# MWRA Interactive Glossary

A lightweight, AI-assisted glossary UI with zero-hassle deployment. Designed for engineers, editors, and reviewers who need a single source of truth for terminology.

---

## 🚀 Features

- Two-click deploy with Netlify Drop
- Optional Google Cloud Function backend for enterprise setups
- CSV/JSON ingest with schema-flexible parsing (term, definition, sources)
- Conflict Agent: Compare canonical vs. external datasets → flag new terms, potential conflicts, and minor variations
- Export visible entries as CSV
- Alphabet navigation (A–Z / #) and full-text search
- Tailwind UI with instant local preview

---

## 🔧 Quickstart (Netlify — recommended)

1. Fork / clone this repo
2. Push to GitHub
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MWRA Interactive Glossary"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/mwra-interactive-glossary.git
   git push -u origin main
   ```
3. Netlify → **New site from Git** → select your repo
   - Build settings: **No build (static)**
   - Publish directory: `web/`
   - Functions directory: `netlify/functions`
4. Environment variable → add `OPENAI_API_KEY` under **Site settings → Environment variables**
5. Deploy. The frontend auto-calls `/.netlify/functions/ask`.

✅ If no API key is set, the backend falls back to a safe stub string.

---

## 📘 Populate the glossary

Open `web/index.html` and edit the seed:

```js
const glossaryData = [
  { term: "Abutment", definition: "Part of a structure supporting an arch or span at the ends.", sources: "MWRA SpecBook" },
  { term: "Slurry", definition: "A fluid mixture of water and suspended solids used in excavation or transport.", sources: "External" }
];
```

Or upload a CSV/JSON via the UI. CSV expected columns: `term`, `definition`, `sources` (extra columns are fine).

---

## ☁ Alternative: Google Cloud Function (HTTP)

If you prefer GCF:

```bash
cd functions_gcf
npm i
gcloud functions deploy mwraAsk \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --entry-point=default \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=OPENAI_API_KEY=YOUR_KEY
```

Take the HTTPS trigger URL → set in `web/index.html`:

```js
const cloudFunctionUrl = "https://YOUR-REGION-YOUR-PROJECT.run.app/...";
```

Redeploy the static site.

---

## 🛠 Local dev

Install Netlify CLI:

```bash
npm i -g netlify-cli
netlify dev
```

Visit [http://localhost:8888](http://localhost:8888).

---

## 🔒 Security

- Never expose API keys in `index.html`.
- Only store secrets in Netlify / GCF env vars.
- Backend constrained to glossary context — safe against open-ended prompts.

---

## 📂 File map

```
web/
  index.html            # Tailwind UI + search + glossary viewer
netlify/
  functions/
    ask.js              # Serverless backend
netlify.toml            # Netlify config
functions_gcf/
  index.js              # GCF HTTP function
  package.json
README.md
```

---

## 🎨 Screenshots

- `docs/screenshot_ui.png` — Glossary viewer
- `docs/screenshot_conflict.png` — Conflict Agent report

---

## 🔄 Model Switching (Optional)

- Default: `gpt-4o-mini` via OpenAI (`OPENAI_API_KEY`)
- Swap to Google Gemini with `@google/generative-ai` and `GEMINI_API_KEY`

---

## ✅ Status

Stable MVP. Drag, drop, deploy. Copy in your glossary → live reference site.

---

Do you want me to also integrate your full `SpecBook_Glossary.csv` into a starter `glossary.json` file in the repo, so contributors don’t need to paste it into HTML manually? That way, the UI would load it on first boot without editing code.
