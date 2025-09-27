# TheAVCfiles / codex — Clean Monorepo

**Apps**
- `apps/web` — minimal agent console (Firebase Hosting).
- `functions` — HTTP function proxy for `/agent/run`.

**Agent**
- `packages/agent` — thin wrapper around Gemini CLI (`npx gemini`).
- Config lives in `.gemini/config.yaml`.

## Google Cloud Setup

Two bootstrap scripts are available for quick Google Cloud project setup:

### Quick Setup (Recommended)
```bash
./gcp-setup.sh [PROJECT_NAME] [BILLING_ACCOUNT_ID]
```
Single copy-paste bootstrap block that creates a working Google Cloud project with:
- Fresh project with billing enabled
- Vertex AI + Discovery Engine + Firestore + Cloud Run APIs
- Service account with owner permissions  
- Local `key.json` credentials ready for Python/Node scripts

### Advanced Setup
```bash
./gcp-bootstrap.sh [PROJECT_NAME]
```
Interactive setup with detailed progress reporting and error handling.

Both scripts enable you to immediately:
- Run your Codex repo against Vertex AI
- Import docs into Discovery Engine  
- Use any Python/Node script with Google Cloud APIs

## Commands
```bash
npm run setup
npm run dev       # (static page)
npm run agent -- "Plan a repo tidy"
npm run deploy    # requires Firebase secret (see below)

# Google Cloud Setup
npm run gcp:setup         # Quick Google Cloud project setup
npm run gcp:bootstrap     # Advanced interactive setup
```
# User-provided custom instructions

https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a
