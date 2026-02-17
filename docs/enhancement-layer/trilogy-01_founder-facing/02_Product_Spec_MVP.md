# Product Spec — MVP

Core features:

- Local-first editor (Automerge) with encrypted IndexedDB storage.
- Kanban pipeline for Projects/Tasks.
- Templates for SOWs, grants, invoices.
- One-click signed snapshot export (.enc) and .ics creation.
- Relay server (stateless default) for encrypted sync, WebSocket broadcasts, and job enqueue.
- Grant portal basic flows: ingest opportunities, map projects -> opportunities, generate drafts, send jobs.
- LLM assistant (opt-in) with provenance capture.

Acceptance criteria:

- Editor can store & retrieve encrypted docs with passphrase.
- Enqueue draft and worker produces stamped PDF and a ledger entry.
- Client can export signed snapshot and verify signature locally.
- UI shows live updates for job status via WebSocket.
