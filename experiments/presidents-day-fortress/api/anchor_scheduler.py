from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd

from check_structural_bid_confirmation import check_structural_bid_confirmation

ANCHOR_CALENDAR = pd.DataFrame(
    {
        "anchor_date": [datetime(2026, 2, 12), datetime(2026, 5, 15)],
        "description": ["Saturn/Uranus Conjunction", "Q2 Policy Update"],
    }
)

LEDGER_CSV = "structural_ledger.csv"


def detect_narrative_anchors(calendar_df: pd.DataFrame, lookback_days: int = 365) -> pd.DataFrame:
    today = datetime.today()
    start = today - timedelta(days=lookback_days)
    end = today + timedelta(days=90)
    return calendar_df[
        (calendar_df["anchor_date"] >= start)
        & (calendar_df["anchor_date"] <= end)
    ].sort_values(by="anchor_date")


def backtest_anchors(calendar_df: pd.DataFrame, ledger_path: str) -> pd.DataFrame:
    ledger_df = pd.read_csv(ledger_path)
    results = []
    for _, anchor in calendar_df.iterrows():
        result = check_structural_bid_confirmation(ledger_df, anchor["anchor_date"].strftime("%Y-%m-%d"))
        result["anchor_description"] = anchor["description"]
        results.append(result)
    backtest_df = pd.DataFrame(results)
    backtest_df.to_csv("backtest_results.csv", index=False)
    return backtest_df


if __name__ == "__main__":
    anchors = detect_narrative_anchors(ANCHOR_CALENDAR)
    print("Detected Anchors:\n", anchors)
    backtest = backtest_anchors(ANCHOR_CALENDAR, LEDGER_CSV)
    print("Backtest Results:\n", backtest)
