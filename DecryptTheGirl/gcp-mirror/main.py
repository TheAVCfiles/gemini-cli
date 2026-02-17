"""FastAPI endpoints for Institutional Confidence Filter artifacts."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from live_gate import read_regime_gate

OUT_DIR = Path("out")

app = FastAPI(title="Institutional Confidence Filter API", version="1.1.0")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/regime")
def regime() -> JSONResponse:
    regime_open, tap_weight, payload = read_regime_gate()
    return JSONResponse(
        {
            "regime_open": regime_open,
            "tap_weight_max": tap_weight,
            "payload": payload,
        }
    )


@app.get("/day-sheet/latest")
def day_sheet_latest() -> JSONResponse:
    path = OUT_DIR / f"day_sheet_{datetime.now(timezone.utc).strftime('%Y%m%d')}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Day sheet not found for today")

    payload: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    expiry = datetime.fromisoformat(payload["expiry_utc"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) >= expiry:
        raise HTTPException(status_code=410, detail="Day sheet expired")

    return JSONResponse(payload)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
