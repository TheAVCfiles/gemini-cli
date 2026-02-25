import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.PORT || 3001);
const HMAC_SECRET = process.env.HMAC_SECRET || 'dev-only-change-me';
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), 'data');
const CORS_ORIGIN = process.env.CORS_ORIGIN || true;

const LEDGER_PATH = path.join(STORAGE_DIR, 'stageport_ledger.jsonl');
const INDEX_PATH = path.join(STORAGE_DIR, 'stageport_index.json');

function defaultIndex() {
  return {
    schema_version: 'StagePort.Index.v1',
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    totals: {
      ingests: 0,
      bytes: 0,
      last_ingest_at: null,
      last_trace_id: null,
    },
    by_type: {},
    latest: [],
  };
}

function ensureStorage() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(LEDGER_PATH)) fs.writeFileSync(LEDGER_PATH, '');
  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(defaultIndex(), null, 2));
  }
}

function readIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  } catch {
    return defaultIndex();
  }
}

function writeIndex(idx) {
  idx.last_updated_at = new Date().toISOString();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
}

function appendLedgerLine(obj) {
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(obj) + '\n');
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function hmacHex(secret, message) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function parseHexToBuffer(value) {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    return null;
  }
  return Buffer.from(value, 'hex');
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

function canonicalJson(obj) {
  return JSON.stringify(sortKeysDeep(obj));
}

function wrapWithLicense({ payload, payload_hash, trace_id, meta }) {
  const envelope = {
    wrapper_version: 'StagePort.HMAC.Wrap.v1',
    trace_id,
    created_at: new Date().toISOString(),
    payload_hash,
    meta: meta || {},
    payload,
  };

  const signature = hmacHex(HMAC_SECRET, canonicalJson(envelope));

  return {
    ...envelope,
    signature,
    signature_alg: 'HMAC-SHA256',
  };
}

ensureStorage();
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: CORS_ORIGIN }));

app.use((req, res, next) => {
  const incoming = req.header('x-trace-id');
  const trace_id = incoming && incoming.length < 200 ? incoming : crypto.randomUUID();
  res.setHeader('x-trace-id', trace_id);
  req.trace_id = trace_id;
  next();
});

app.get('/health', (req, res) => {
  const idx = readIndex();
  res.json({
    ok: true,
    service: 'stageport-backstage-controller',
    version: '1.2.0',
    time: new Date().toISOString(),
    totals: idx.totals,
  });
});

app.get('/metrics', (req, res) => {
  const idx = readIndex();
  res.json({
    ok: true,
    schema_version: idx.schema_version,
    last_updated_at: idx.last_updated_at,
    totals: idx.totals,
    by_type: idx.by_type,
    latest: idx.latest,
  });
});

app.get('/ingests/latest', (req, res) => {
  const n = Math.max(1, Math.min(50, Number(req.query.n || 10)));
  const idx = readIndex();
  res.json({ ok: true, latest: idx.latest.slice(0, n) });
});

app.post('/ingest', (req, res) => {
  const started = Date.now();
  const trace_id = req.trace_id;
  const { type, source, content, tags, actor, meta } = req.body || {};

  if (typeof type !== 'string' || content === undefined) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: type (string), content (any JSON value)',
      trace_id,
    });
  }

  const contentCanonical = canonicalJson(content);
  const contentBuf = Buffer.from(contentCanonical, 'utf8');
  const payload_hash = sha256Hex(contentBuf);

  const payload = {
    type,
    source: source || 'unknown',
    tags: Array.isArray(tags) ? tags : [],
    actor: actor || null,
    content,
  };

  const wrapped = wrapWithLicense({
    payload,
    payload_hash,
    trace_id,
    meta: meta || {},
  });

  appendLedgerLine(wrapped);

  const idx = readIndex();
  const bytes = contentBuf.length;

  idx.totals.ingests += 1;
  idx.totals.bytes += bytes;
  idx.totals.last_ingest_at = wrapped.created_at;
  idx.totals.last_trace_id = trace_id;

  idx.by_type[type] = idx.by_type[type] || { count: 0, bytes: 0, last_at: null };
  idx.by_type[type].count += 1;
  idx.by_type[type].bytes += bytes;
  idx.by_type[type].last_at = wrapped.created_at;

  const summary = {
    trace_id,
    created_at: wrapped.created_at,
    type,
    source: wrapped.payload.source,
    payload_hash,
    signature: wrapped.signature,
    bytes,
    tags: wrapped.payload.tags,
  };

  idx.latest.unshift(summary);
  idx.latest = idx.latest.slice(0, 25);
  writeIndex(idx);

  return res.status(201).json({
    ok: true,
    trace_id,
    payload_hash,
    signature: wrapped.signature,
    bytes,
    latency_ms: Date.now() - started,
  });
});

app.post('/verify', (req, res) => {
  const trace_id = req.trace_id;
  const envelope = req.body;
  if (!envelope || !envelope.signature) {
    return res.status(400).json({ ok: false, error: 'Missing envelope.signature', trace_id });
  }

  const { signature, ...unsigned } = envelope;
  const expected = hmacHex(HMAC_SECRET, canonicalJson(unsigned));

  const providedBuf = parseHexToBuffer(signature);
  const expectedBuf = parseHexToBuffer(expected);
  if (!providedBuf || !expectedBuf) {
    return res.status(400).json({
      ok: false,
      trace_id,
      error: 'Signature must be a valid hex string',
    });
  }

  const valid =
    providedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(providedBuf, expectedBuf);

  return res.json({
    ok: true,
    trace_id,
    valid,
    expected,
    provided: signature,
  });
});

app.listen(PORT, () => {
  console.log(`[StagePort] Backstage Controller listening on http://localhost:${PORT}`);
  console.log(`[StagePort] Ledger: ${LEDGER_PATH}`);
  console.log(`[StagePort] Index:  ${INDEX_PATH}`);
});
