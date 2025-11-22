# Stageport Server (RAG Vault + License Flow) — Demo

## What this repo is
Minimal serverless endpoints for:
- `/api/vault-query` — server-side RAG query for a faculty vault (vector search + LLM).
- `/api/license-create-session` — Stripe Checkout session creation (license purchase).
- `/api/webhooks-stripe` — Stripe webhook to create a license record and call contract flow.

Designed for Vercel serverless or Cloud Run.

## Env Variables (required)
- PINECONE_API_KEY
- PINECONE_ENV
- PINECONE_INDEX_NAME
- OPENAI_API_KEY  (or set GEMINI_API_KEY + use utils/llm.js)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PUBLIC_URL  (e.g., https://decryptthegirl.vercel.app)
- FIRESTORE_CREDENTIALS_JSON (optional) or FIRESTORE_PROJECT for Firestore usage

## Run locally
1. `npm install`
2. `npx vercel dev` (preferred)
3. Set environment vars locally: `vercel env add ...` or a local `.env` for `vercel dev`.

## Notes
- Replace the LLM call with your prefered provider (Gemini sample included in utils/llm.js).
- Replace Pinecone with your vector DB if desired.
- This repo intentionally keeps business logic minimal and demonstrative; do not run in production without security hardening and secrets management.
