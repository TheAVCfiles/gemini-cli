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

---

## StagePort backend and executive one-pager

This repository now also includes:

- `server/index.js`: Express backend with SHA-256 hashing, HMAC envelope signing,
  append-only JSONL ledger, and health/metrics/verify endpoints.
- `server/package.json`: Minimal server dependency manifest.
- `web/avc-shark-onepager.html`: Enterprise-style single-page executive summary.

Run backend locally:

```bash
cd server
npm install
node index.js
```

Backend endpoints:

- `GET /health`
- `GET /metrics`
- `GET /ingests/latest?n=10`
- `POST /ingest`
- `POST /verify`
