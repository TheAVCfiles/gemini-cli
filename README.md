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
- Visual Idea Canvas for planning product launches with optional Gemini integration

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

`netlify/functions/ask.js` can call either Gemini's Generative Language API or
OpenAI's Responses API. Provide whichever key you have available and the function
will automatically pick the matching provider (preferring Gemini when both are set)
and include the provider name in the JSON response. Without a key, it echoes a
stub message so the frontend experience stays consistent.

Environment variables:

| Variable          | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `GEMINI_API_KEY`  | (Optional) API key for Gemini's Generative Language API                    |
| `GEMINI_MODEL`    | (Optional) Override the Gemini model. Default: `gemini-1.5-flash`          |
| `OPENAI_API_KEY`  | (Optional) API key for OpenAI Responses API                                |
| `OPENAI_MODEL`    | (Optional) Override the OpenAI model. Default: `gpt-4o-mini`               |

---

## 📂 File map

```
web/
  index.html            # UI shell and Pico.css theme
  visual-idea-canvas.html # Visual Idea Canvas generator (Gemini optional)
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
