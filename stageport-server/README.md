# Stageport Server (RAG Vault + License Flow) — Demo

Serverless endpoints to support the Stageport demo:

- `/api/vault-query` — RAG-backed vault query (vector search + LLM summary + provenance).
- `/api/license-create-session` — Stripe checkout session for license purchases.
- `/api/webhooks-stripe` — Stripe webhook to record license purchases and trigger contract generation.

## Deploy targets

- Vercel serverless functions (recommended) or Cloud Run.

## Required env variables

- `PINECONE_API_KEY`
- `PINECONE_ENV`
- `PINECONE_INDEX_NAME`
- `OPENAI_API_KEY` (or `GEMINI_API_KEY`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PUBLIC_URL` (e.g., https://decryptthegirl.vercel.app)
- `FIRESTORE_CREDENTIALS_JSON` (optional) or `FIRESTORE_PROJECT`

## Run locally

1. `npm install`
2. `npx vercel dev` (or `npx vercel dev --listen 3000`)
3. Provide environment variables via Vercel env or local `.env` (dev only).

## Notes

- Replace placeholder code for contract signing (DocuSign / HelloSign).
- Replace Pinecone calls with your vector DB if desired.
- This repo is a demo skeleton — secure secrets and harden before public production.
