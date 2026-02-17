from __future__ import annotations

from datetime import datetime

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from check_structural_bid_confirmation import check_structural_bid_confirmation

app = FastAPI(title="Structural Bid Signal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/signal")
async def get_signal(
    anchor_date: str = Query("2026-02-12", description="Narrative anchor date (YYYY-MM-DD)"),
):
    try:
        datetime.strptime(anchor_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid anchor_date format. Use YYYY-MM-DD") from exc

    try:
        ledger_df = pd.read_csv("structural_ledger.csv")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="structural_ledger.csv not found") from exc

    try:
        return check_structural_bid_confirmation(ledger_df, anchor_date)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Signal calculation failed: {exc}") from exc
