# DeCrypt Studio Architecture Overview

This document consolidates the high level concepts, assets, and code sketches for **DeCrypt Studio** into an implementation-ready blueprint. It is organized around what the user experiences, how the platform works behind the scenes, and the build milestones required to make the product shippable.

---

## 1. Product Surfaces

Each surface is delivered as a dedicated React application within a mono-repo (see [Frontend Composition](#4-frontend-composition)).

| Surface | Purpose | Key Features | Integrations |
| --- | --- | --- | --- |
| **Intuition Labs Portal** (Web/iPad) | Home entry point that highlights the latest rituals and output. | Countdown blocks, featured artifacts grid, “birth chart” candlestick widget, AI Council chat. | Artifacts API, Blueprint service, AI Council tools. |
| **Dance Arena** | Rhythm/QTE gameplay, future live “Dance With Me” webcam mode. | Beat-matched prompts, score/coins persistence, pose overlay for ghost choreography. | Pose service, Routine data, Asset store for audio/video. |
| **Choreography Builder** | Authoring environment for routines. | Timeline editor, move library, webcam capture, BPM alignment, routine export. | Moves & Routine APIs, Asset ingestion (video capture), Workers (transcode + keypoints). |
| **Artifacts Library** | Vault of PDFs, audio summaries, and videos. | Filter/search, share links with scoped tokens, expiry badges. | Artifacts API, Asset storage, AuthN/AuthZ. |

---

## 2. Core Services

| Service | Responsibilities | Tech Notes |
| --- | --- | --- |
| **Identity & Auth** | Account provisioning, role-based access control. | Supabase or Auth0 with email + magic links. Roles: `owner`, `collab`, `viewer`. |
| **Asset Store** | Central storage for all raw uploads and derivatives. | S3/Supabase buckets: `raw/`, `derivatives/`, `private/`. Use short-lived signed URLs. |
| **Metadata DB** | Persistent state for projects, assets, choreography, artifacts, and blueprints. | Postgres (Supabase recommended). Schema defined in [Section 3](#3-data-model). |
| **Vector Index** | Retrieval augmented generation (RAG) support for AI Council. | Postgres `vector` extension or pgvector; embed text with `text-embedding-3-small`. |
| **Realtime Event Bus** | Fan out system events. | Postgres `NOTIFY/LISTEN`, Pusher, or Ably. Triggers: `recording_complete`, `thumbnail_ready`, `pose_model_loaded`. |
| **Workers** | Offline/background processing. | Queue (BullMQ, Temporal) running FFmpeg transcodes, image thumbs, embeddings, pose keypoints. |

---

## 3. Data Model

### 3.1 Relational Schema (Postgres)

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  title text not null,
  slug text unique,
  created_at timestamptz default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  path text not null,
  kind text check (kind in ('image', 'video', 'audio', 'pdf', 'text')),
  mime text,
  duration_s int,
  width int,
  height int,
  meta_jsonb jsonb default '{}'::jsonb
);

create table moves (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  name text not null,
  action text check (action in ('SPIN', 'STRIKE', 'JUMP', 'POSE')),
  description text,
  icon text,
  difficulty int default 1,
  tags text[]
);

create table routines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  title text,
  bpm int,
  notes text
);

create table routine_steps (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id),
  move_id uuid references moves(id),
  start_ms int not null,
  end_ms int not null,
  easing text default 'linear'
);

create table blueprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  title text,
  data_jsonb jsonb
);

create table artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  type text check (type in ('pdf', 'audio', 'video', 'link')),
  title text,
  asset_id uuid references assets(id),
  share_token text unique,
  expires_at timestamptz
);
```

### 3.2 Vector Index

```sql
create table docs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  asset_id uuid references assets(id),
  chunk_text text,
  embedding vector(1536)
);
```

### 3.3 TypeScript SDK Types

```ts
export type AssetKind = 'image' | 'video' | 'audio' | 'pdf' | 'text';

export interface Asset {
  id: string;
  projectId: string;
  kind: AssetKind;
  path: string;
  meta?: any;
}

export interface SearchAssetsParams {
  q?: string;
  kinds?: AssetKind[];
  tags?: string[];
  limit?: number;
}

export interface SearchAssetsResult {
  items: Asset[];
  nextCursor?: string;
}

export interface CreateArtifactInput {
  projectId: string;
  type: 'pdf' | 'audio' | 'video' | 'link';
  title: string;
  assetId: string;
  ttlHours: number;
}

export interface CreateArtifactResult {
  url: string;
  expiresAt: string;
}
```

---

## 4. Frontend Composition

* **Repo topology:** Turborepo/Nx mono-repo with apps `portal`, `arena`, `builder`, plus shared `packages/ui` (design system) and `packages/sdk` (API client).
* **UI system:** Neon-retro design tokens implemented as CSS variables; ensure WCAG-friendly contrast, focus rings, reduced motion variants.
* **Charting:** uPlot or ApexCharts powering the birth-chart-as-candlestick widget, including range highlight, hover tooltips, and ability to overlay blueprint callouts.
* **Pose stack:** `@tensorflow-models/pose-detection` with MoveNet lightning. Lazy-load model, draw on `<canvas>`, score poses with DTW/angle similarity. Results persisted to `assets.meta_jsonb`.
* **State sync:** Use Supabase realtime (or Pusher) for event-driven updates (e.g., new artifact, routine step edit).

---

## 5. Server SDK & ChatGPT Tools

### 5.1 Tooling

Expose a minimal tool surface to ChatGPT (via OpenAI function calling or ReAct) to ensure least-privilege execution:

* `searchAssets(query, tags)` → returns asset metadata + signed URLs.
* `createArtifact(type, title, asset_id, ttl)` → issues share link with scoped token.
* `logInsight(project_id, text)` → stores insights, triggers embedding worker.
* `getBlueprintWindow(project_id, from, to)` → retrieves blueprint slices for charts.

All tools execute server-side with short-lived signed URLs and project-scoped ACL enforcement.

### 5.2 Worker Flow Example

```ts
async function ingestAssetForEmbeddings(asset: Asset) {
  const text = await extractText(asset); // pdf -> text, image -> OCR, audio -> transcript
  const chunks = chunk(text, { target: 800 });

  for (const chunk of chunks) {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk.text,
    });

    await db.insert('docs', {
      project_id: asset.projectId,
      asset_id: asset.id,
      chunk_text: chunk.text,
      embedding: embedding.data[0].embedding,
    });
  }
}
```

---

## 6. Privacy Model

* **Zero-training guarantee:** API usage adheres to OpenAI’s policy—no customer data is used to train models.
* **Storage isolation:** Keep private assets in `private/` bucket. Grant access via signed URLs with <15 minute TTL.
* **Project-level ACLs:** Enforce role checks (`owner`, `collab`, `viewer`) on every API entry point.
* **Artifact tokens:** Share links carry JWTs with `aud`, `project_id`, `artifact_id`, and expiration claims. No broad bucket exposure.
* **Audit trail:** Record artifact access and AI tool invocations for compliance.

---

## 7. Build Milestones

| Milestone | Timeline | Focus |
| --- | --- | --- |
| **M0 — Foundations** | 1–2 days | Repo scaffolding, Postgres + S3 wiring, base tables (`projects`, `assets`, `artifacts`), Portal shell with live artifact expiry. |
| **M1 — Knowledge Spine** | 2–3 days | Ingestion worker, RAG tooling (`searchAssets`, `logInsight`, `createArtifact`), chart widget integrated with blueprint data. |
| **M2 — Dance Stack** | 3–5 days | Dance Arena polish, pose “ghost overlay” prototype, scoring pipeline with persistence. |
| **M3 — Shareable Product** | 2 days | Public artifact links with expiring tokens, branded landing page, published privacy statement. |

---

## 8. Immediate Implementation Checklist

1. Provision Postgres (Supabase) and apply schema migrations in Section 3.
2. Configure S3/Supabase storage buckets (`raw/`, `derivatives/`, `private/`) with lifecycle policies.
3. Implement a Node/Express (or Fastify) API with three initial routes:
   * `POST /v1/artifacts` → accepts `CreateArtifactInput`, stores row, returns signed URL.
   * `GET /v1/assets/search` → filters by project/kind/tags, returns `SearchAssetsResult` with signed URLs.
   * `POST /v1/insights` → stores note, enqueues embedding worker job.
4. Set up workers for FFmpeg transcodes, thumbnails, transcripts, and embeddings.
5. Scaffold `apps/portal` using existing HTML mock, fetching live data from the API for artifact tiles.
6. Create UI kit skeleton in `packages/ui` with neon-retro tokens and accessibility hooks.

---

## 9. Open Questions

* Determine preferred realtime transport (Supabase realtime vs. managed service like Pusher).
* Decide how move library assets are created (manual upload vs. automated pose extraction).
* Establish retention policy for share tokens and audit logging requirements.

---

With this architecture in place, DeCrypt Studio moves from mood board to implementation roadmap, aligning the creative surfaces, AI-powered back-end, and privacy expectations into a cohesive product plan.
