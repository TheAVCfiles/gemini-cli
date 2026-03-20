# DecryptTheGirl Codex Backup

This directory captures the choreographic simulation assets discussed in the "Lilith Loop" collaboration and prepares them for publication to GitHub and replication in Google Cloud Platform (GCP).

## Repository Layout

```
DecryptTheGirl/
├── .gitignore
├── LICENSE.md
├── README.md
├── Folios/
│   └── Folio_001_LilithLoop/
│       ├── LilithLoop.rouette
│       ├── README.md
│       ├── flowchart_access_logic.svg
│       ├── glyph_map.json
│       └── witness_window.meta
├── specbook/
│   ├── README.md
│   ├── build_specbook.py
│   └── config.example.yaml
└── gcp-mirror/
    ├── Dockerfile
    ├── README.md
    ├── deploy.sh
    ├── main.py
    ├── requirements.txt
    └── sample-config.yaml
```

## Usage Overview

1. **GitHub Publication** – The folio files sit inside `Folios/`. Commit this folder into your GitHub repository (e.g., `DecryptTheGirl_CodexBackup`).
2. **GCP Mirror** – The `gcp-mirror/` folder can be deployed to Cloud Run. It serves folio metadata through a minimal FastAPI application and reads configuration from `sample-config.yaml`.
3. **Licensing** – `LICENSE.md` stores the PyRouette-derived license language requested in our prior discussions.
4. **Specbook Generator** – `specbook/` provides a configurable Python utility that recreates the Specbook PDF bundle and Glitch Deck print sheets described in the collaboration notes.

See individual READMEs for detailed workflows.
