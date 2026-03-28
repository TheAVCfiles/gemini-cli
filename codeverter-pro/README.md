# CodeVerter PRO (Local-first dual-evaluation prototype)

This folder provides a local Python + HTML implementation of a code translation flow with a **true before/after evaluation delta**:

- `server.py` (Flask API):
  - Evaluates source code.
  - Translates/refactors code.
  - Re-evaluates translated code.
  - Logs `source_score`, `target_score`, and `delta` to a CSV ledger.
- `index.html` (React-in-browser UI):
  - Source/Target editor panes.
  - Execute action.
  - Cognitive Delta dashboard (`source score → target score`, net improvement).

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install flask flask-cors requests
export ANTHROPIC_API_KEY="your_key_here"
python server.py
```

Open `index.html` in your browser and call the local API at `http://127.0.0.1:5000/api/convert`.
