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

function writeIndex(index) {
  index.last_updated_at = new Date().toISOString();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

function appendLedgerLine(entry) {
  fs.appendFileSync(LEDGER_PATH, `${JSON.stringify(entry)}\n`);
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function hmacHex(secret, message) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(sortKeysDeep(value));
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

  const canonical = canonicalJson(envelope);
  const signature = hmacHex(HMAC_SECRET, canonical);

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
  const index = readIndex();
  res.json({
    ok: true,
    service: 'stageport-backstage-controller',
    version: '1.2.0',
    time: new Date().toISOString(),
    totals: index.totals,
  });
});

app.get('/metrics', (req, res) => {
  const index = readIndex();
  res.json({
    ok: true,
    schema_version: index.schema_version,
    last_updated_at: index.last_updated_at,
    totals: index.totals,
    by_type: index.by_type,
    latest: index.latest,
  });
});

app.get('/ingests/latest', (req, res) => {
  const n = Math.max(1, Math.min(50, Number(req.query.n || 10)));
  const index = readIndex();
  res.json({ ok: true, latest: index.latest.slice(0, n) });
});

app.post('/ingest', (req, res) => {
  const started = Date.now();
  const trace_id = req.trace_id;

  const { type, source, content, tags, actor, meta } = req.body || {};
  if (!type || !content) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: type, content',
      trace_id,
    });
  }

  const contentCanonical = canonicalJson(content);
  const contentBuffer = Buffer.from(contentCanonical, 'utf8');
  const payload_hash = sha256Hex(contentBuffer);

  const payload = {
    type,
    source: source || 'unknown',
    tags: Array.isArray(tags) ? tags : [],
    actor: actor || null,
    content,
  };

  const wrapped = wrapWithLicense({ payload, payload_hash, trace_id, meta: meta || {} });

  appendLedgerLine(wrapped);

  const index = readIndex();
  const bytes = contentBuffer.length;

  index.totals.ingests += 1;
  index.totals.bytes += bytes;
  index.totals.last_ingest_at = wrapped.created_at;
  index.totals.last_trace_id = trace_id;

  index.by_type[type] = index.by_type[type] || { count: 0, bytes: 0, last_at: null };
  index.by_type[type].count += 1;
  index.by_type[type].bytes += bytes;
  index.by_type[type].last_at = wrapped.created_at;

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

  index.latest.unshift(summary);
  index.latest = index.latest.slice(0, 25);

  writeIndex(index);

  const latency_ms = Date.now() - started;
  return res.status(201).json({
    ok: true,
    trace_id,
    payload_hash,
    signature: wrapped.signature,
    bytes,
    latency_ms,
  });
});

app.post('/verify', (req, res) => {
  const trace_id = req.trace_id;
  const envelope = req.body;

  if (!envelope || !envelope.signature) {
    return res.status(400).json({ ok: false, error: 'Missing envelope.signature', trace_id });
  }

  const { signature, ...unsigned } = envelope;
  const canonical = canonicalJson(unsigned);
  const expected = hmacHex(HMAC_SECRET, canonical);

  return res.json({
    ok: true,
    trace_id,
    valid: crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)),
    expected,
    provided: signature,
  });
});

app.listen(PORT, () => {
  console.log(`[StagePort] Backstage Controller listening on http://localhost:${PORT}`);
  console.log(`[StagePort] Ledger: ${LEDGER_PATH}`);
  console.log(`[StagePort] Index:  ${INDEX_PATH}`);
});
