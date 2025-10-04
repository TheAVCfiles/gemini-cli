"""Create diagnostic logs for the permutation test and geometric levels.

The analytics pipeline currently fails the forward-return permutation test.  In
order to spend the "information capital" wisely we want a reproducible snapshot
of the critical inputs that drove the failure.  This script compiles two CSV
artifacts that can be inspected during post-mortems or uploaded to notebooks
for deeper analysis:

* ``permutation_test_log.csv`` – one row per confirmed tap and horizon with the
  actual forward return, the mean of the permutation sample and the delta.  This
  makes it easy to identify whether a small subset of taps is diluting the
  signal.
* ``geometric_level_log.csv`` – the guard low, primary fade zone and stop level
  derived from ``predictive_levels.csv``.  These values anchor the Cunning Mercy
  execution plan and should travel with the diagnostic packet.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate P-value diagnostic logs")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("out"),
        help="Directory where diagnostic CSVs should be written",
    )
    parser.add_argument(
        "--event-perm",
        type=Path,
        default=Path("out/event_study_permutation_summary.csv"),
        help="CSV from the permutation study",
    )
    parser.add_argument(
        "--overlay",
        type=Path,
        default=Path("out/backtest_overlay_results.csv"),
        help="CSV with confirmation status for each tap",
    )
    parser.add_argument(
        "--levels",
        type=Path,
        default=Path("out/predictive_levels.csv"),
        help="Predictive levels generated from ATR inputs",
    )
    return parser.parse_args()


def load_csv(path: Path, description: str) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"{description} not found: {path}")
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError(f"{description} is empty: {path}")
    return df


def make_permutation_log(event_perm: pd.DataFrame, overlay: pd.DataFrame) -> pd.DataFrame:
    event_perm = event_perm.copy()
    overlay = overlay.copy()

    event_perm["tap_date"] = pd.to_datetime(event_perm["tap_date"])
    overlay["tap_date"] = pd.to_datetime(overlay["tap_date"])

    merged = event_perm.merge(
        overlay[["tap_date", "is_confirmed", "confirmation"]],
        on="tap_date",
        how="left",
    )

    confirmed = merged[merged["is_confirmed"] == True].copy()  # noqa: E712
    if confirmed.empty:
        raise ValueError("No confirmed taps available for diagnostic log")

    confirmed.rename(
        columns={
            "H": "horizon_days",
            "fwd_return": "actual_return",
            "perm_mean": "permutation_mean",
            "p_one_sided": "p_value",
        },
        inplace=True,
    )

    confirmed["return_delta"] = confirmed["actual_return"] - confirmed["permutation_mean"]
    confirmed.sort_values(["tap_date", "horizon_days"], inplace=True)
    confirmed["tap_date"] = confirmed["tap_date"].dt.strftime("%Y-%m-%d")

    summary = (
        confirmed.groupby("horizon_days").agg(
            avg_actual_return=("actual_return", "mean"),
            avg_permutation_mean=("permutation_mean", "mean"),
            avg_return_delta=("return_delta", "mean"),
            avg_p_value=("p_value", "mean"),
        )
    ).reset_index()
    summary["tap_date"] = "SUMMARY"
    summary["confirmation"] = "aggregate"
    summary["p_value"] = summary["avg_p_value"]
    summary["is_confirmed"] = True
    summary["actual_return"] = summary["avg_actual_return"]
    summary["permutation_mean"] = summary["avg_permutation_mean"]
    summary["return_delta"] = summary["avg_return_delta"]

    combined = pd.concat([confirmed, summary], ignore_index=True, sort=False)
    columns = [
        "tap_date",
        "horizon_days",
        "actual_return",
        "permutation_mean",
        "return_delta",
        "p_value",
        "is_confirmed",
        "confirmation",
        "avg_actual_return",
        "avg_permutation_mean",
        "avg_return_delta",
        "avg_p_value",
    ]
    for col in columns:
        if col not in combined.columns:
            combined[col] = pd.NA

    return combined[columns]


def make_geometric_log(levels: pd.DataFrame) -> pd.DataFrame:
    levels = levels.copy()
    required_cols = {"symbol", "guard_low", "angle90_high", "angle180_high"}
    missing = required_cols - set(levels.columns)
    if missing:
        raise ValueError(f"Predictive levels missing columns: {missing}")

    levels["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    levels.rename(
        columns={
            "angle90_high": "primary_fade_zone",
            "angle180_high": "stop_zone",
        },
        inplace=True,
    )
    return levels[["symbol", "guard_low", "primary_fade_zone", "stop_zone", "generated_at"]]


def main() -> None:
    args = parse_args()
    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    event_perm = load_csv(args.event_perm, "Permutation summary")
    overlay = load_csv(args.overlay, "Backtest overlay")
    levels = load_csv(args.levels, "Predictive levels")

    perm_log = make_permutation_log(event_perm, overlay)
    geo_log = make_geometric_log(levels)

    perm_path = out_dir / "permutation_test_log.csv"
    geo_path = out_dir / "geometric_level_log.csv"

    perm_log.to_csv(perm_path, index=False)
    geo_log.to_csv(geo_path, index=False)


if __name__ == "__main__":
    main()
