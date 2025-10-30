# DeCrypt Studio — Modular Launch Architecture

DeCrypt Studio turns IntuitionLabs' creative R&D experiments into a cohesive product line: a neon mythos portal, rhythm arena, choreography lab, and shareable asset library woven together by a privacy-first backend. This document translates the concept art and feature sketches into ship-ready architecture that engineers, designers, and ops teams can act on immediately.

## 1. System surfaces (user-facing)

### Portal (`apps/portal`)
- Home of the **Intuition Labs Portal** experience for web and iPad.
- Surfaces live countdowns, featured artifacts, and the astrology-inspired candlestick widget.
- Hosts the **AI Council** chat panel powered by the server-side SDK tools.
- Pulls artifact metadata via `GET /v1/assets/search` (scoped by project) and renders expiry badges based on `artifacts.expires_at`.

### Dance Arena (`apps/arena`)
- Rhythm/QTE gameplay loop with score, streak, and coin economy (synced to `localStorage` with optional project sync to `routines`).
- Feature-flagged "Dance With Me" webcam mode:
  - Lazy-load `@tensorflow-models/pose-detection` (MoveNet lightning).
  - Overlay target "ghost" poses for the active move.
  - Score posture using joint angle cosine similarity + DTW smoothing and emit events to the realtime bus.

### Choreography Builder (`apps/builder`)
- Timeline editor for routines using `moves` and `routine_steps` tables.
- Move library browser with search, difficulty filters, and tags.
- Webcam capture workflow to record new moves into `assets.raw` then enqueue pose extraction.
- Music alignment helpers: BPM detection (worker based) and manual beat grid nudging.

### Artifacts Library (Portal modal + shareable links)
- Lists exportable PDFs, audio summaries, and session videos tied to `artifacts.type`.
- Generates short-lived share URLs via `POST /v1/artifacts`.
- Share modal previews metadata and exposes scoped tokens for collaborators (`role in ('collab','viewer')`).

## 2. Core services (how it runs)

### Identity & Auth
- Supabase Auth (email + magic links) or Auth0 social login depending on deployment target.
- Roles: `owner`, `collab`, `viewer`; stored in `users.role` and mirrored in JWT claims.
- Per-project ACL enforced at API layer. Artifacts require share tokens even for authenticated viewers.

### Asset store
- S3-compatible buckets (Supabase storage supported) partitioned into:
  - `raw/` uploads: original webcam videos, reference images, PDFs.
  - `derivatives/`: mp3, webm, thumbnails, pose JSON exports.
  - `private/`: contracts, briefs, and sensitive documents.
- Uploads use pre-signed POST forms with 15-minute expiry; downloads use signed GET URLs scoped to role or share token.

### Metadata database (Postgres)
- Stores project hierarchy, assets, choreography primitives, blueprint data, and artifact sharing metadata.
- Leverage JSONB columns for flexible metadata (`profile_jsonb`, `meta_jsonb`, `data_jsonb`).
- Recommended indices: `btree` on `assets.project_id`, `routine_steps.routine_id`, and `docs.project_id` plus `GIN` on tag arrays.

### Vector index (RAG spine)
- `docs` table holds chunked text embeddings (`vector(1536)` column) generated from PDFs, transcripts, notes, and insight logs.
- Embedding creation handled by worker queue after ingestion events.
- Search API combines metadata filters with cosine similarity, delivering context to the AI Council and future copilots.

### Realtime event bus
- PostgreSQL `NOTIFY/LISTEN` or managed Pub/Sub (Pusher/Ably) broadcasting:
  - `asset.recording_complete`, `asset.thumbnail_ready`, `pose.model_loaded`, `routine.updated`.
- Frontends subscribe via SSE/WebSocket to update progress bars, countdowns, and ghost pose overlays in real time.

### Workers and queues
- Lightweight job queue (BullMQ or Supabase Functions) drives:
  - FFmpeg transcodes and audio waveform renders.
  - Thumbnail + sprite sheet generation.
  - Embedding ingestion (OpenAI `text-embedding-3-small`).
  - Pose keypoint extraction and scoring summaries persisted to `assets.meta_jsonb`.

## 3. App SDK layer (ChatGPT tool integrations)

Server-side actions exposed to Gemini / ChatGPT-based assistants:

| Action | Purpose | Notes |
| --- | --- | --- |
| `searchAssets(query, tags)` | Query `assets` + `docs` to retrieve metadata and signed URLs. | Enforce role-based filtering; signed URLs expire in ≤5 minutes. |
| `createArtifact(type, title, asset_id, ttl)` | Create shareable artifact records. | Generates unique `share_token`, returns signed link with embedded expiry claim. |
| `logInsight(project_id, text)` | Persist AI/coach insights. | Inserts into `artifacts` (type `text`) or dedicated `insights` table; triggers embedding worker. |
| `getBlueprintWindow(project_id, from, to)` | Fetch candlestick slices for astrology charts. | Reads `blueprints.data_jsonb` ranges and normalizes for uPlot/ApexCharts consumption. |

**Guardrails**
- Tools execute on the application server with least-privileged service accounts.
- Signed URLs are one-time use where possible and bound to project-level ACLs.
- All tool invocations logged to `audit_logs` (optional table) for traceability.

## 4. Frontend composition (React + iPad-first)

- **Monorepo**: Turborepo-style layout with `apps/portal`, `apps/arena`, `apps/builder`, shared `packages/ui` (component library) and `packages/sdk` (API clients & tool wrappers).
- **Design tokens**: CSS variables for neon-retro palette, typography, blur/glow; theme supports prefers-reduced-motion variants.
- **State management**: TanStack Query for server data, Zustand or Redux Toolkit for gameplay session state, plus React Context for auth session.
- **Charts**: uPlot or ApexCharts configured for "birth chart" candlesticks with highlighted ranges (e.g., Oct 15–30, 2025) and tooltip callouts.
- **Pose stack**: Lazy-load MoveNet, render to `<canvas>` overlay with WebGL fallback; scoring results posted to API via `packages/sdk` mutations.
- **Accessibility**: Focus-visible outlines, ARIA live regions for countdown updates, keyboard bindings for QTE lanes.

## 5. Privacy & compliance

- Data stays tenant-bound; no training on customer assets (aligns with OpenAI policy).
- Store sensitive media in `private/` bucket with default deny lists.
- Signed URLs expire quickly and are scoped to project and role.
- Artifact share tokens embed `aud` claim, expiry, and optional download watermark controls.
- Maintain security reviews for webcam capture and pose processing modules; include consent gating on first use.

## 6. Minimal schemas & types

```sql
create table projects(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  title text not null,
  slug text unique,
  created_at timestamptz default now()
);

create table assets(
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  path text not null,
  kind text check (kind in ('image','video','audio','pdf','text')),
  mime text,
  duration_s int,
  width int,
  height int,
  meta_jsonb jsonb default '{}'::jsonb
);

create table moves(
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  name text not null,
  action text check (action in ('SPIN','STRIKE','JUMP','POSE')),
  description text,
  icon text,
  difficulty int default 1,
  tags text[]
);

create table routines(
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  title text,
  bpm int,
  notes text
);

create table routine_steps(
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id),
  move_id uuid references moves(id),
  start_ms int not null,
  end_ms int not null,
  easing text default 'linear'
);

create table artifacts(
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  type text check (type in ('pdf','audio','video','link','text')),
  title text,
  asset_id uuid references assets(id),
  share_token text unique,
  expires_at timestamptz
);
```

```ts
export type AssetKind = 'image' | 'video' | 'audio' | 'pdf' | 'text';
export interface Asset {
  id: string;
  projectId: string;
  kind: AssetKind;
  path: string;
  mime?: string;
  meta?: Record<string, unknown>;
}

export interface SearchAssetsParams {
  q?: string;
  kinds?: AssetKind[];
  tags?: string[];
  limit?: number;
  cursor?: string;
}

export interface SearchAssetsResult {
  items: Asset[];
  nextCursor?: string;
}

export interface CreateArtifactInput {
  projectId: string;
  type: 'pdf' | 'audio' | 'video' | 'link' | 'text';
  title: string;
  assetId: string;
  ttlHours: number;
}

export interface CreateArtifactResult {
  url: string;
  expiresAt: string;
}
```

### Embedding worker flow (pseudo-code)

```ts
// Triggered on asset upload, insight log, or document ingest
const text = await extractText(asset);              // pdf -> text, audio -> transcript, image -> OCR
const chunks = chunk(text, { targetTokens: 800 });  // tokenizer-aware splitting

for (const chunk of chunks) {
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunk.text,
  });

  await db.insert('docs', {
    id: crypto.randomUUID(),
    project_id: asset.project_id,
    asset_id: asset.id,
    chunk_text: chunk.text,
    embedding: data[0].embedding,
  });
}
```

## 7. API slice (MVP routes)

Implement a slim Node/Express (or Fastify) service colocated with Supabase edge functions:

- `POST /v1/artifacts`
  - Body: `CreateArtifactInput`.
  - Verifies project ownership, writes record, returns signed URL with expiry derived from `ttlHours`.
- `GET /v1/assets/search`
  - Query params: `SearchAssetsParams` + `projectId`.
  - Filters by role, optionally merges vector search results for text queries.
- `POST /v1/insights`
  - Body: `{ projectId, text }`.
  - Stores note (as artifact type `text` or `insights` table) and enqueues embedding job.

All endpoints log to audit tables and emit events to the realtime bus for UI refreshes.

## 8. Delivery roadmap

| Milestone | Focus | Key Deliverables |
| --- | --- | --- |
| **M0 — Foundations (1–2 days)** | Bootstrap repo + environment | Turborepo scaffold, Postgres + storage connection, auth baseline, Portal shell wired to artifacts table. |
| **M1 — Knowledge spine (2–3 days)** | RAG + AI tooling | Ingestion worker, AI Council tool integrations, candlestick widget reading `blueprints` mock data. |
| **M2 — Dance stack (3–5 days)** | Gameplay + pose overlay | Polished QTE Arena, MoveNet-powered "Dance With Me" prototype, score logging to `assets.meta_jsonb`. |
| **M3 — Shareable product (2 days)** | External sharing + compliance | Public artifact links with expiring tokens, branded landing page, privacy statement referencing short-lived signed URLs. |

## 9. Reference assets

- Shared vector store snapshot: [vs_6859e43920848191a894dd36ecf0595a](https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a).
- Existing design mocks and neon token palettes feed into `packages/ui` theme definition.
- Reuse Ballet Bots pose presets for early choreography move templates.

---

This architecture gives engineering, design, and operations a synchronized blueprint to ship DeCrypt Studio as a cohesive, privacy-conscious creative OS.
