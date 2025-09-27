# TheAVCfiles / codex — Clean Monorepo

**Apps**
- `apps/web` — minimal agent console (Firebase Hosting).
- `functions` — HTTP function proxy for `/agent/run`.

**Agent**
- `packages/agent` — thin wrapper around Gemini CLI (`npx gemini`).
- Config lives in `.gemini/config.yaml`.

**Commands**
```bash
npm run setup
npm run dev       # (static page)
npm run agent -- "Plan a repo tidy"
npm run deploy    # requires Firebase secret (see below)
# User-provided custom instructions

https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a
