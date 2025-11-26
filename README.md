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

## StudioOS Workspace: How to Run the Pipeline

This repo is wired for fast, low-friction collaboration in Codespaces / Dev Containers / cloud IDEs.

### 1. One-Time Setup

1. Open the repo in **GitHub Codespaces** or **VS Code Dev Containers**.
2. The workspace will:
   - Build the container
   - Run `studioos_pipeline.sh` automatically (default PR: `347`)

> If `studioos_pipeline.sh` fails, fix the issue, then re-run it using the tasks below.

---

### 2. Run the StudioOS Pipeline (VS Code Tasks)

You can run everything from the Command Palette — no remembering long commands.

1. Open Command Palette: `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Select: **`Tasks: Run Task`**
3. Choose one:

#### a) Default: Run on PR 347

```text
StudioOS: Run Integration Pipeline (default PR 347)

This is the “hit play and go” option.

b) Run on a Specific PR

StudioOS: Run Integration Pipeline (choose PR)

You’ll be prompted for the PR number. The task will:
    • Check out the PR
    • Run the pipeline script end-to-end
    • Output logs in the terminal

c) Custom Engine Path (optional)
If you have a local / mounted Regime Engine path to wire:

StudioOS: Run Integration Pipeline (custom engine path)

You’ll be prompted for:
    • REGIME_ENGINE_SRC (path inside the container)
    • PR number
```

---

3. Manual Terminal Usage (if you like typing)

From the workspace terminal:

```bash
# Make sure the script is executable
chmod +x studioos_pipeline.sh

# Run against default PR
./studioos_pipeline.sh 347

# Run against a custom PR
./studioos_pipeline.sh 412

# Run with a specific Regime Engine path
export REGIME_ENGINE_SRC="/workspaces/regime-engine"
./studioos_pipeline.sh 347
```

---

4. Collaboration Norms
    • Before pushing:
Run one of the StudioOS tasks and make sure it completes without errors.
    • When reviewing PRs:
Re-run the pipeline for that PR using StudioOS: Run Integration Pipeline (choose PR).
    • If something explodes:
Paste the task output (logs) directly into the team chat so everyone can see the failure state.

---

That’s the wiring set:

- Dev container spins up → pipeline auto-runs
- VS Code Tasks give you one-click re-runs
- README tells collaborators exactly which buttons to press
  
You now have a **“press play, get signal”** workspace instead of **“which branch / what command again?”** chaos.

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
