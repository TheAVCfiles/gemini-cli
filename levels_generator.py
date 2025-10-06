"""Generate ATR-based predictive price levels for defensive trading protocols.

This utility reads a CSV file containing the most recent closing price and
Average True Range (ATR) for each symbol that should be monitored by the live
runner.  For every symbol it calculates the guard zone and the core angular
levels inspired by the W.D. Gann framework that the surrounding tooling uses
for risk control decisions.

The default invocation mirrors the example shared in the operating runbooks::

    python levels_generator.py --input data/levels_input.csv \
        --output out/predictive_levels.csv

The script is intentionally small and dependency light so that it can be called
from cron jobs or ad‑hoc debugging sessions.  The output file is suitable for
downstream inspection as well as for the diagnostic logging utilities that rely
on these geometric guard rails.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


def compute_levels(df: pd.DataFrame) -> pd.DataFrame:
    """Return a DataFrame with the predictive guard and angle levels.

    Parameters
    ----------
    df:
        DataFrame with ``symbol``, ``last_close`` and ``atr14`` columns.
    """

    required_cols = {"symbol", "last_close", "atr14"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Input levels data is missing required columns: {missing}")

    def _float(series: pd.Series) -> pd.Series:
        return pd.to_numeric(series, errors="coerce")

    levels = pd.DataFrame({
        "symbol": df["symbol"].astype(str),
        "last_close": _float(df["last_close"]),
        "atr14": _float(df["atr14"]),
    })

    if levels[["last_close", "atr14"]].isna().any().any():
        raise ValueError("Found non-numeric values in last_close/atr14 columns")

    A = levels["atr14"]
    C = levels["last_close"]

    levels["guard_low"] = C - 0.5 * A
    levels["guard_high"] = C + 0.5 * A
    levels["angle45_low"] = C - 1.0 * A
    levels["angle45_high"] = C + 1.0 * A
    levels["angle90_low"] = C - 1.5 * A
    levels["angle90_high"] = C + 1.5 * A
    levels["angle180_low"] = C - 2.5 * A
    levels["angle180_high"] = C + 2.5 * A

    return levels


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate ATR-based price levels")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("levels_input.csv"),
        help="CSV containing symbol,last_close,atr14 columns",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("predictive_levels.csv"),
        help="Destination CSV for generated levels",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.input.exists():
        raise FileNotFoundError(f"Input CSV not found: {args.input}")

    df = pd.read_csv(args.input)
    levels = compute_levels(df)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    levels.to_csv(args.output, index=False)


if __name__ == "__main__":
    main()
