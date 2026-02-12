# KOI Package Drop — 20251109_1821

This bundle contains:
- `migrations/20251109_1821_create_koi_attempts.sql` — SQL to create `koi_attempts` table + indexes.
- `koi_worker_20251109_1821.py` — a no-deps Python KOI worker stub implementing backoff + jitter, heartbeat, and a demo queue.
- `render_mermaid.sh` — helper to render any `.mmd` Mermaid diagram into PNG/SVG using Mermaid CLI (Node).
- Use previously generated `.mmd` files (e.g., `mythos_cloud_with_koi_*.mmd`).

## Render Mermaid
1. Install Node + Mermaid CLI:

```bash
npm install -g @mermaid-js/mermaid-cli
```

2. Render diagrams:

```bash
./render_mermaid.sh diagram.mmd diagram.svg
```

## Additional Resources
- User-provided custom instructions: https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a
