# AVC Enhancement Layer — Next Step Pack (Client SDK + Migrations)

This pack gives you the **two highest-leverage next moves** after the relay+worker demo:

1) **Repeatable DB migrations** (node-pg-migrate)
2) **Client SDK** (`client-relay.js`) that can:
   - encrypt snapshots (AES-GCM via Web Crypto)
   - sign snapshots (ECDSA P-256 via Web Crypto)
   - POST snapshots to your relay
   - subscribe to WS events (if/when enabled)

## What MVP we’re shipping (canonical)
**“One-click Artifact Factory”**: opportunity/project input → draft → enqueue → worker produces:
- a **signed artifact** (PDF/ZIP)
- a **ledger entry** (hash + metadata)
- a **ready-to-send packet** (no extra meetings required)

## Quickstart (local)
1. Run your docker-compose (db, rabbitmq, redis, relay).
2. Apply migrations:
   ```bash
   npm i
   npm run migrate up
   ```
3. Use the SDK from a browser app or Next.js client-side.

---

## Migrations
- `migrations/001_init.sql` contains the schema you pasted (users, teams, projects, opportunities, templates, draft_apps, ledger_entries, experiments).

## Client SDK
- `sdk/client-relay.js` + `sdk/usage_example.html`

Notes:
- This is “boring by design.” Boring is secure.
- Nothing here forces SaaS. It just makes your artifact pipeline **repeatable** and **demoable**.
