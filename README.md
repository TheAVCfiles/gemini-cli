# MWRA Interactive Glossary

A lightweight, AI-assisted glossary UI for MWRA terminology. The site ships with a
canonical `glossary.json`, offers CSV/JSON ingest, flags conflicts, and exposes an
optional `/ask` endpoint for AI-assisted explanations.

---

## 🚀 Features

- Canonical glossary preloaded from `web/glossary.json`
- Zero-build Netlify deployment with `/netlify/functions/ask`
- CSV/JSON ingest with conflict detection against the bundled dataset
- Alphabet navigation (A–Z / #) and instant search
- Export currently visible entries as CSV
- Optional OpenAI-backed assistant (falls back to offline stub)

---

## 🔧 Quickstart (Netlify)

1. Fork or clone this repository and push it to your Git provider.
2. In Netlify, choose **New site from Git** and connect the repository.
3. Use these build settings:
   - **Build command:** leave empty (static site)
   - **Publish directory:** `web`
   - **Functions directory:** `netlify/functions`
4. (Optional) Add `OPENAI_API_KEY` under **Site settings → Environment variables**.
5. Deploy. The site will load `web/glossary.json` and the UI will call
   `/.netlify/functions/ask` when the assistant dialog is used.

✅ Without an API key the function returns a stub response so the UI remains usable.

---

## 🛠 Local development

```bash
npm install
npm install -g netlify-cli
netlify dev
```

This serves the static site at `http://localhost:8888` and proxies `/.netlify/functions/ask`.
If you prefer not to use Netlify CLI, you can run any static server from the `web`
directory and point API calls to a deployed instance.

---

## 📘 Glossary data

- `web/glossary.json` contains the canonical MWRA terminology (sample of 30 entries).
- `web/boot_glossary.js` fetches the JSON, renders the UI, and handles ingest/export.
- Uploading a CSV/JSON file overlays an external dataset so the conflict agent can
  highlight new, changed, or missing terms.

**CSV format** (extra columns are ignored):

```text
term,definition,sources
Abutment,Part of a structure supporting an arch or span,MWRA SpecBook
```

**JSON format**: array of objects with `term`, `definition`, and optional `sources`.

---

## 🤖 Ask endpoint

`netlify/functions/ask.js` wraps OpenAI's Responses API. Provide an `OPENAI_API_KEY`
to enable live answers. Without the key, the function echoes a stub message so the
frontend experience stays consistent.

Environment variables:

| Variable         | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `OPENAI_API_KEY` | (Optional) API key for OpenAI Responses API              |
| `OPENAI_MODEL`   | (Optional) Override the model. Default: `gpt-4o-mini`    |

---

## ✨ Demon Huntrix Dance Lab (Gemini demo)

The `web/demon-huntrix.html` playground showcases a Gemini-powered choreography
workflow:

- Generate a new "Demon Huntrix" dance move with schema validation and a fallback
  pose.
- Request short AI descriptions for in-game shop items.
- Rehearse three "Hit This Pose" cue cards extracted from the provided photo set.

All Gemini traffic is proxied through `netlify/functions/gemini.js`, which expects
the following environment variables:

| Variable          | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `GEMINI_API_KEY`  | (Required) API key for the Google Generative Language API        |
| `GEMINI_MODEL`    | (Optional) Override the model. Default: `gemini-2.5-flash-preview-09-2025` |

During development the page calls `/api/gemini`, which Netlify redirects to the
serverless function. You can serve the static files with `netlify dev` or any HTTP
server pointed at `web/`.

---

## 🛡️ Adaptive Ethics Rebuttal Explorer

- `web/rebuttal-interactive.html` presents the three-pillar rebuttal with live Gemini
  summaries, TTS narration, and a CSV-powered mercy gate simulation.
- Gemini calls are proxied via the new Netlify functions
  `/api/rebuttal/summary` and `/api/rebuttal/tts`, which require `GEMINI_API_KEY`.
- Upload a CSV containing `date,signal,return` columns to drive Spearman's rho and the
  mercy gate directly in the browser.

### Proof runner utility

The `scripts/liminal_market_engine/proof_runner.py` script generates a CSV template,
emits a synthetic demo dataset, and computes Spearman correlation statistics for any
CSV that follows the `signal`/`return` schema. Run it from the repository root:

```bash
python scripts/liminal_market_engine/proof_runner.py [--csv path/to/your.csv]
```

Artifacts (template, demo dataset, receipt JSON, markdown report) are written to
`scripts/liminal_market_engine/proof_artifacts/`.

### Visual snapshot workflow

Need shareable renders of the interactive rebuttal (or any page in `web/`)? Use the
Playwright-based helper in `scripts/visual-snapshots/capture.mjs`:

```bash
npm install
npx playwright install chromium
npm run snapshots
```

The command launches a headless Chromium session, serves `web/` locally, and writes a
timestamped folder under `snapshots/` that contains PNG captures plus a manifest with
viewport metadata. Pass custom options to cover additional pages or device sizes:

```bash
npm run snapshots -- --pages=index.html,rebuttal-interactive.html --width=1280 --height=720 --delay=800
```

Each entry can also specify a friendly label (`page.html|hero`) to control the output
file name. The manifest is suitable for embedding in docs or review tools.

---

## 📂 File map

```
web/
  index.html            # UI shell and Pico.css theme
  boot_glossary.js      # Glossary bootstrapper + conflict agent
  glossary.json         # Canonical glossary dataset
netlify/
  functions/
    ask.js              # Serverless function for AI explanations
netlify.toml            # Netlify configuration (publish dir + redirects)
README.md
```

---

## ✅ Maintenance checklist

- Update `web/glossary.json` as terminology evolves.
- Re-run an ingest check with the Conflict Agent before publishing.
- Redeploy on Netlify after updating the dataset or UI.
- Rotate API keys and store them only in Netlify/GCF environment variables.
