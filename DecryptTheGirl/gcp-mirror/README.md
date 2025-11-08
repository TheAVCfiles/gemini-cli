# GCP Mirror – Cloud Run Deployment Guide

This folder provides a minimal FastAPI application and deployment script that mirrors Folio metadata into Google Cloud Platform using your available credits. Deploying it ensures the choreography codex survives even if third-party services lapse.

## Prerequisites

- Google Cloud project with billing enabled and available credits.
- `gcloud` CLI authenticated with your account.
- Docker (local) or Cloud Build enabled for your project.
- [`yq`](https://github.com/mikefarah/yq) available in your shell for parsing `config.yaml` inside `deploy.sh`.

## Configuration

1. Copy `sample-config.yaml` to `config.yaml` and adjust values:
   ```yaml
   project_id: your-gcp-project
   region: us-central1
   service_name: lilith-loop-mirror
   folios:
     - id: folio-001
       title: "Lilith Loop (6/8)"
       glyph_map: "Folios/Folio_001_LilithLoop/glyph_map.json"
       meta_rule: "Folios/Folio_001_LilithLoop/witness_window.meta"
       script: "Folios/Folio_001_LilithLoop/LilithLoop.rouette"
       flowchart: "Folios/Folio_001_LilithLoop/flowchart_access_logic.svg"
   ```
2. Place the Folios directory somewhere accessible to the deployment workflow (same repo is recommended).

## Deployment

Run the helper script:

```bash
./deploy.sh
```

The script reads `config.yaml`, builds the container, and deploys it to Cloud Run using the specified project, region, and service name.

## API Endpoints

- `GET /health` – Basic readiness probe.
- `GET /folios` – Lists available folios from the configuration file.
- `GET /folios/{folio_id}` – Returns the script, meta rule, glyph map, and flowchart path for a specific folio.

## Next Steps

- Add IAM rules or API keys at the Cloud Run layer if you need to restrict access.
- Connect the service to Firebase Hosting or a small web front-end to display the glitch/clear visibility states in real time.
