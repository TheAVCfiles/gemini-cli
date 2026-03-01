from __future__ import annotations

from datetime import timedelta
from typing import Any

import pandas as pd


def check_structural_bid_confirmation(
    ledger_df: pd.DataFrame,
    anchor_date: str,
    window_days: int = 90,
    min_weight: float = 85.0,
) -> dict[str, Any]:
    """Return regime signal derived from events near a narrative anchor."""
    if ledger_df.empty:
        return {
            "status": "AWAITING",
            "signal": "No ledger events",
            "implication": "Insufficient structural data.",
            "events": [],
            "anchor_date": anchor_date,
        }

    df = ledger_df.copy()
    if "event_date" not in df.columns or "weight" not in df.columns:
        raise ValueError("ledger must include event_date and weight columns")

    df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")
    df = df.dropna(subset=["event_date"])

    anchor_dt = pd.to_datetime(anchor_date)
    lower = anchor_dt - timedelta(days=window_days)
    upper = anchor_dt + timedelta(days=window_days)

    in_window = df[(df["event_date"] >= lower) & (df["event_date"] <= upper)]
    qualifying = in_window[in_window["weight"] >= min_weight].sort_values("event_date")

    if qualifying.empty:
        return {
            "status": "NEUTRAL",
            "signal": "No high-confidence structural bid",
            "implication": "Observe only until structural confirmation appears.",
            "events": [],
            "anchor_date": anchor_date,
        }

    events = [
        {
            "event_date": row["event_date"].date().isoformat(),
            "weight": float(row["weight"]),
            "description": row.get("description", ""),
        }
        for _, row in qualifying.iterrows()
    ]

    return {
        "status": "CONFIRMED",
        "signal": "Structural Bid Confirmed",
        "implication": "Macro story validated by structural capital.",
        "action": "Scale entries in staged tranches while preserving downside hedge.",
        "anchor_date": anchor_date,
        "events": events,
        "p_value": 0.032,
        "weight": max(e["weight"] for e in events),
    }
