/**
* AVC Relay Server (stateless-by-default)
* - Accepts encrypted "snapshot" uploads (JSON with base64 payload)
* - Broadcasts to WebSocket clients subscribed to "room"
* - Optionally persists WAL (RELAYS_PERSIST=true)
*
* Security model:
* - Relay does NOT decrypt or inspect payload
* - A simple API key is used for authorized uploads & websocket connects (optional)
*
* Usage:
* - POST /snapshots { room, payload, meta } (x-api-key header or ?api_key=)
* - GET /snapshots/:id
* - WS /ws?room=ROOM&api_key=... (subscribe to room)
*/

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const API_KEY = process.env.RELAY_API_KEY || null; // set in .env for simple auth
const PERSIST = (process.env.RELAY_PERSIST === 'true'); // write WAL file if true
const WAL_FILE = process.env.WAL_FILE || path.resolve('./relay_wal.log');

const app = express();
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));

// In-memory snapshot store (id -> record)
const snapshots = new Map();

// On startup, replay WAL if exists & PERSIST enabled
if (PERSIST && fs.existsSync(WAL_FILE)) {
  const lines = fs.readFileSync(WAL_FILE, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      snapshots.set(obj.id, obj);
    } catch (err) {
      console.warn('Skipping WAL corrupt line', err);
    }
  }
  console.log(`Loaded ${snapshots.size} records from WAL`);
}

// ------- WebSocket setup -------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// rooms: Map roomName -> Set of ws
const rooms = new Map();

function ensureRoom(room) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  return rooms.get(room);
}
function broadcastToRoom(room, data) {
  const set = rooms.get(room);
  if (!set) return;
  const payload = JSON.stringify(data);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const room = url.searchParams.get('room') || 'global';
    const apiKey = url.searchParams.get('api_key') || null;
    // simple auth: if API_KEY is set, require it on ws connect
    if (API_KEY && apiKey !== API_KEY) {
      ws.close(1008, 'unauthorized');
      return;
    }
    const set = ensureRoom(room);
    set.add(ws);
    ws._room = room;
    ws.send(JSON.stringify({ type: 'welcome', room, ts: Date.now() }));
    ws.on('message', (msg) => {
      // harmless echo/ping handler; do not treat as commands
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed && parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
      } catch (e) {
        /* ignore */
      }
    });
    ws.on('close', () => {
      const s = rooms.get(ws._room);
      if (s) s.delete(ws);
    });
  } catch (err) {
    ws.close(1011, 'server_error');
  }
});

// ------- HTTP API -------

// health
app.get('/health', (req, res) => {
  res.json({ ok: true, snapshots: snapshots.size, rooms: Array.from(rooms.keys()) });
});

// Post an encrypted snapshot
// Body: { room?:string, payload: base64string, meta?:object }
// Authentication: x-api-key header or ?api_key= if RELAY API key is defined
app.post('/snapshots', (req, res) => {
  const headerKey = req.headers['x-api-key'] || req.query.api_key;
  if (API_KEY && headerKey !== API_KEY) return res.status(401).json({ error: 'unauthorized' });

  const { room = 'global', payload, meta = {} } = req.body;
  if (!payload) return res.status(400).json({ error: 'payload required (base64)' });

  const id = crypto.randomBytes(12).toString('hex');
  const record = { id, room, payload, meta, ts: Date.now() };

  snapshots.set(id, record);
  if (PERSIST) {
    try {
      fs.appendFileSync(WAL_FILE, JSON.stringify(record) + '\n');
    } catch (err) {
      console.error('WAL write failed', err);
    }
  }

  // broadcast to room subscribers, but only with metadata + id (not decrypt)
  broadcastToRoom(room, { type: 'snapshot', record: { id: record.id, room: record.room, meta: record.meta, ts: record.ts } });

  return res.json({ id });
});

// Fetch a snapshot by id (returns full record; still encrypted)
app.get('/snapshots/:id', (req, res) => {
  const id = req.params.id;
  const rec = snapshots.get(id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  return res.json(rec);
});

// List rooms (lightweight)
app.get('/rooms', (req, res) => {
  res.json({ rooms: Array.from(rooms.keys()) });
});

// Optionally clear memory (admin)
app.post('/admin/clear', (req, res) => {
  const headerKey = req.headers['x-api-key'] || req.query.api_key;
  if (API_KEY && headerKey !== API_KEY) return res.status(401).json({ error: 'unauthorized' });
  snapshots.clear();
  // remove WAL file
  if (PERSIST && fs.existsSync(WAL_FILE)) fs.unlinkSync(WAL_FILE);
  res.json({ ok: true });
});

// start
server.listen(PORT, () => {
  console.log(`AVC Relay server listening at http://0.0.0.0:${PORT}`);
  console.log(`PERSIST=${PERSIST} WAL_FILE=${WAL_FILE} API_KEY_SET=${!!API_KEY}`);
});
