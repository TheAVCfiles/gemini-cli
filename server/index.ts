import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { z } from 'zod';
import crypto from 'node:crypto';

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  type GetObjectCommandInput,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// --- Infra ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET;

if (!BUCKET) {
  throw new Error('S3_BUCKET env var is required');
}

// --- Helpers ---
function token(length = 24) {
  return crypto.randomBytes(length).toString('base64url');
}

async function q<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

function bad(res: Response, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}

// --- Auth (stub) ---
// In production, verify a real JWT and map to user/project ACLs.
// For now, accept `x-project-id` header.
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { projectId?: string }).projectId = req.header('x-project-id') ?? undefined;
  next();
});

type AssetRow = {
  id: string;
  project_id: string;
  path: string;
  kind: string;
  mime: string | null;
  meta_jsonb: Record<string, unknown> | null;
  created_at: string;
};

type ArtifactRow = {
  share_token: string;
  expires_at: string;
};

type ShareRow = {
  type: string;
  title: string;
  expires_at: string;
  path: string | null;
  mime: string | null;
};

// ------------------------
// GET /v1/assets/search
// ------------------------
const SearchSchema = z.object({
  q: z.string().optional(),
  kinds: z
    .string()
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
    .optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

app.get('/v1/assets/search', async (req: Request, res: Response) => {
  const projectId = (req as Request & { projectId?: string }).projectId;
  if (!projectId) return bad(res, 400, 'missing x-project-id');
  const parsed = SearchSchema.safeParse(req.query);
  if (!parsed.success) return bad(res, 400, parsed.error.message);

  const { q: query, kinds, limit, cursor } = parsed.data;
  const params: unknown[] = [projectId];
  let where = 'project_id = $1';
  if (kinds?.length) {
    params.push(kinds);
    where += ` AND kind = ANY($${params.length})`;
  }
  if (query) {
    params.push(`%${query}%`);
    where += ` AND (path ILIKE $${params.length} OR (meta_jsonb->>'title') ILIKE $${params.length})`;
  }
  let afterIdClause = '';
  if (cursor) {
    params.push(cursor);
    afterIdClause = ` AND id::text > $${params.length}`; // simple lexicographic cursor
  }

  const sql = `
    select id, project_id, path, kind, mime, meta_jsonb, created_at
    from assets
    where ${where} ${afterIdClause}
    order by id asc
    limit ${limit + 1}
  `;
  const rows = await q<AssetRow>(sql, params);
  const nextCursor = rows.length > limit ? rows.pop()!.id : null;

  const items = await Promise.all(
    rows.map(async (row) => {
      if (!row.path) return row;
      const command: GetObjectCommandInput = { Bucket: BUCKET, Key: row.path };
      const url = await getSignedUrl(s3, new GetObjectCommand(command), { expiresIn: 60 });
      return { ...row, url };
    }),
  );

  res.json({ items, nextCursor });
});

// ------------------------
// POST /v1/artifacts
// ------------------------
const CreateArtifactSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['pdf', 'audio', 'video', 'link']),
  title: z.string().min(1),
  assetId: z.string().uuid(),
  ttlHours: z.coerce.number().int().min(1).max(24 * 30),
});

app.post('/v1/artifacts', async (req: Request, res: Response) => {
  const body = CreateArtifactSchema.safeParse(req.body);
  if (!body.success) return bad(res, 400, body.error.message);
  const { projectId, type, title, assetId, ttlHours } = body.data;

  const shareToken = token(18);
  const expires = new Date(Date.now() + ttlHours * 3_600_000);

  const [artifact] = await q<ArtifactRow>(
    `
    insert into artifacts(project_id, type, title, asset_id, share_token, expires_at)
    values ($1,$2,$3,$4,$5,$6)
    returning share_token, expires_at
  `,
    [projectId, type, title, assetId, shareToken, expires],
  );

  const url = `${req.protocol}://${req.get('host')}/share/${artifact.share_token}`;
  res.status(201).json({ url, expiresAt: artifact.expires_at });
});

// ------------------------
// POST /v1/insights
// ------------------------
const InsightSchema = z.object({
  projectId: z.string().uuid(),
  text: z.string().min(1).max(8000),
});

app.post('/v1/insights', async (req: Request, res: Response) => {
  const parsed = InsightSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, parsed.error.message);

  const { projectId, text } = parsed.data;
  const id = crypto.randomUUID();
  const key = `text/${projectId}/${id}.txt`;

  const putCommand: PutObjectCommandInput = {
    Bucket: BUCKET,
    Key: key,
    ContentType: 'text/plain',
  };
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand(putCommand), { expiresIn: 60 });

  await q(
    `
    insert into assets(id, project_id, path, kind, mime, meta_jsonb)
    values ($1, $2, $3, 'text', 'text/plain', jsonb_build_object('title', 'Insight note', 'excerpt', $4))
  `,
    [id, projectId, key, text.slice(0, 120)],
  );

  res.status(201).json({ assetId: id, uploadUrl });
});

// ------------------------
// Public share endpoint (simple)
// ------------------------
app.get('/share/:token', async (req: Request, res: Response) => {
  const [row] = await q<ShareRow>(
    `
    select a.type, a.title, a.expires_at, s.path, s.mime
    from artifacts a
    left join assets s on a.asset_id = s.id
    where share_token = $1
  `,
    [req.params.token],
  );

  if (!row) return res.status(404).send('Not found');
  if (new Date(row.expires_at).getTime() < Date.now()) return res.status(410).send('Link expired');
  if (!row.path) return res.status(404).send('Asset missing');

  const command: GetObjectCommandInput = { Bucket: BUCKET, Key: row.path };
  const url = await getSignedUrl(s3, new GetObjectCommand(command), { expiresIn: 60 });
  res
    .type('html')
    .send(`
    <html><body style="font-family:Inter; background:#0b1020; color:#d1d5db; padding:24px">
      <h1 style="color:#fff">${row.title}</h1>
      <p>Type: ${row.type} • Expires: ${new Date(row.expires_at).toLocaleString()}</p>
      <a href="${url}" style="color:#93c5fd">Open secured file</a>
    </body></html>
  `);
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`DeCrypt Studio API listening on http://localhost:${port}`);
});
