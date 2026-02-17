from __future__ import annotations

from datetime import datetime


def check_structural_bid_confirmation(ledger_df, anchor_date):
    """Compute a lightweight structural signal summary from a ledger DataFrame."""
    if isinstance(anchor_date, str):
        anchor_date = datetime.fromisoformat(anchor_date)

    df = ledger_df.copy()
    if "timestamp" in df.columns:
        df["timestamp"] = df["timestamp"].apply(lambda x: datetime.fromisoformat(str(x)))
        df = df[df["timestamp"] >= anchor_date]

    weight = float(df["weight"].mean()) if "weight" in df.columns and not df.empty else 0.0
    p_value = float(df["p_value"].mean()) if "p_value" in df.columns and not df.empty else 1.0

    events = (
        df.tail(5).to_dict(orient="records")
        if not df.empty
        else []
    )

    return {
        "anchor_date": anchor_date.date().isoformat(),
        "weight": round(weight, 2),
        "p_value": round(p_value, 4),
        "ci_status": "Excludes 0" if p_value < 0.05 else "Includes 0",
        "regime_status": "OPEN" if weight >= 80 and p_value < 0.05 else "CLOSED_DEFENSIVE",
        "events": events,
    }
