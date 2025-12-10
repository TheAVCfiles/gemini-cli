# Workspace overview

## Project purpose
The MWRA Interactive Glossary provides a static glossary UI backed by a canonical `glossary.json` dataset and an optional Netlify function that can answer questions with OpenAI when an API key is configured.【F:README.md†L1-L45】【F:README.md†L62-L82】

## Repository layout
- `web/` hosts the front-end experience, including the Pico.css-based HTML shell and the `boot_glossary.js` module that powers filtering, ingest, conflict detection, and the assistant dialog.【F:web/index.html†L1-L96】【F:web/boot_glossary.js†L1-L120】
- `netlify/functions/ask.js` implements the `/ask` endpoint, falling back to a stub response without credentials and forwarding prompts to the OpenAI Responses API when `OPENAI_API_KEY` is present.【F:netlify/functions/ask.js†L1-L86】
- `packages/` contains the workspaces that make up the broader Gemini CLI monorepo, exposed through the root `package.json` configuration.【F:package.json†L1-L66】
- `docs/` (this directory) collects operational and product documentation, such as deployment, tooling, and troubleshooting guides.【F:docs/index.md†L1-L25】
- `integration-tests/` holds Vitest-powered integration tests exercised through the workspace scripts.【F:package.json†L39-L58】

## Key development commands
- `npm install` — install root workspace dependencies.
- `npm run build` — produce distributable assets via the bundled build script.【F:package.json†L18-L40】
- `npm run start` — launch the CLI locally using `scripts/start.js` (paired with `npm run start:a2a-server` for the agent-to-agent server).【F:package.json†L18-L22】
- `npm run test` — execute tests across workspaces (delegates to each package's `test` script).【F:package.json†L31-L32】
- `npm run lint` — run ESLint over the repository, including integration tests.【F:package.json†L48-L49】
- `netlify dev` — serve the glossary locally with function proxies, as documented in the README Quickstart.【F:README.md†L23-L45】

## Data management
The canonical terminology lives in `web/glossary.json`, while `boot_glossary.js` can ingest CSV or JSON uploads to compare external datasets and surface conflicts.【F:README.md†L47-L67】【F:web/boot_glossary.js†L56-L135】

## Assistant endpoint behaviour
`netlify/functions/ask.js` builds a glossary-aware system prompt, invokes the OpenAI Responses API when possible, and otherwise responds with a clear stub so the UI remains functional offline.【F:netlify/functions/ask.js†L1-L86】
