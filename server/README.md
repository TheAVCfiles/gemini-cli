# DeCrypt Studio API (Prototype)

A minimal Express + PostgreSQL + S3 API powering asset search, artifact sharing, and insight uploads.

## Setup

1. Copy `.env.example` to `.env` and supply real credentials:
   ```bash
   cp server/.env.example server/.env
   ```
2. Ensure the SQL schema in [`schema.sql`](./schema.sql) has been applied to your database.
3. For the Proof Layer (StagePort Ledger, Credential Minting, and AURA/AURE runtime), apply [`decrypt_app_schema.sql`](./decrypt_app_schema.sql) to the Neon `decrypt_app` database:
   ```bash
   psql "$NEON_DATABASE_URL" -f server/decrypt_app_schema.sql
   ```
   The schema enables `pgcrypto` (for `gen_random_uuid()`), defines minted credentials, Sentient Cents ledger entries, archival capsule metadata, and runtime AURA/AURE states.
4. Install dependencies from the repository root (ignore optional postinstall scripts if needed):
   ```bash
   npm install --ignore-scripts
   ```

## Running locally

```bash
npm run start:api
```

The server listens on `http://localhost:8787` by default.

## Endpoints

- `GET /v1/assets/search` – search project assets and receive 60s presigned GET URLs.
- `POST /v1/artifacts` – create shareable artifacts with expiring links.
- `POST /v1/insights` – create a text asset and receive a presigned PUT URL for the note body.
- `GET /share/:token` – public share page that presigns the underlying asset on demand.

## Next steps

- Replace the `x-project-id` stub with real JWT auth using `JWT_PUBLIC_KEY_PEM`.
- Add rate limiting, audit logging, and background jobs for embedding text assets.
- Move presigned URL durations and TTL limits into configuration as needed.
