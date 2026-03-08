# Prima Ledger

Minimal Flask-based ledger with FSM gating and multi-wing ingest.

## Deploy

### Render (one-click)
1. Fork this repo
2. Go to https://render.com/new
3. Select this repo
4. Runtime: Python
5. Start Command: `python server.py`
6. Add Disk: Mount `/app` → size 1GB
7. Deploy

### PythonAnywhere
1. Upload files
2. Bash console: `pip install --user -r requirements.txt`
3. Web tab → Flask → point to `server.py`
4. Reload

Open in browser / iPhone Safari.
