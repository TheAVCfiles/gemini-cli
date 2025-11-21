# Local Secretary — RAG/LLM Spec (Self-Hosted)
_Version: 0.1 • 2025-11-08_

## Goal
A private assistant that:
- Ingests Lilly/SYVAQ docs + astro CSVs
- Answers queries about dates/windows/meaning
- Generates Notion rows & checklists
- NEVER leaks data (local-only or your GCP project)

## Minimal Stack
- **LLM**: `llama.cpp` or `Ollama` (e.g., `llama3.1` local) OR Vertex AI if on GCP
- **Vector DB**: `Chroma` (local) or `SQLite + FAISS`
- **Indexers**: Markdown, PDF (use `pypdf`), CSV
- **Server**: FastAPI
- **UI**: Streamlit (optional)

## Folder Layout
```
/oracle_local/
  data/
    astro/lilly_syvaq_astro_series_*.csv
    docs/*.md, *.pdf
  index/
  config/profile.json   # from syvaq_foundation_profile.template.json
  app.py                # FastAPI endpoints
  rag.py                # chunk, embed, retrieve
  prompts/system.txt    # safety + style
```

## Ingestion Command
```
python rag.py --ingest data/docs --csv data/astro/lilly_syvaq_astro_series_*.csv
```

## Example Query
- "Show next 30 days with composite > 1.2 and summarize why."
- "Generate a Week 5 tasks checklist for a red window."

## Safety
- Redact PII on indexing, require passphrase to decrypt profile.
- Log all answers to `logs/` with timestamp for audits.
