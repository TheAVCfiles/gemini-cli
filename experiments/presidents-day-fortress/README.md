# Presidents Day Fortress (Example Integration)

This example package contains:

- `api/app.py`: FastAPI `/signal` endpoint for dashboard polling.
- `api/anchor_scheduler.py`: daily anchor detection and backtest script.
- `api/check_structural_bid_confirmation.py`: reusable signal logic.
- `api/structural_ledger.csv`: sample ledger data.
- `web/App.tsx`: React TypeScript dashboard wired for polling.

## Run API

```bash
cd experiments/presidents-day-fortress/api
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Run scheduler manually

```bash
cd experiments/presidents-day-fortress/api
python anchor_scheduler.py
```

## Polling behavior

The React dashboard fetches:

- `GET http://localhost:8000/signal?anchor_date=YYYY-MM-DD`

on initial load and every 60 seconds.
