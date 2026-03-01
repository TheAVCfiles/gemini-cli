"""Generate the Planetary-Market Correlation Index chart.

This script loads the historical planetary-market alignment data alongside the
November 2025 calendar, synthesises a confluence score for the new entries, and
produces a rolling correlation index. The updated dataset is written to an
Excel workbook and the chart is optionally exported as an image.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

import matplotlib.pyplot as plt
import pandas as pd

DEFAULT_PREV_PATH = Path("/mnt/data/astro_market_alignment.xlsx")
DEFAULT_NOV_PATH = Path("/mnt/data/astro_nov2025_calendar.xlsx")
DEFAULT_OUTPUT_PATH = Path("/mnt/data/planetary_market_index.xlsx")
DEFAULT_CHART_PATH = Path("/mnt/data/planetary_market_index.png")


TONE_MAP = {
    "🔺": 0.8,
    "⚡": 0.6,
    "🔻": 0.3,
    "↔": 0.5,
}


def parse_args(args: Iterable[str] | None = None) -> argparse.Namespace:
    """Parse command line arguments."""

    parser = argparse.ArgumentParser(
        description=(
            "Build the Planetary-Market Correlation Index by combining "
            "historical confluence scores with the November 2025 events."
        )
    )
    parser.add_argument(
        "--previous",
        type=Path,
        default=DEFAULT_PREV_PATH,
        help=(
            "Path to the historical astro-market alignment workbook. "
            "The sheet named 'Data' must contain 'Date (approx)' and "
            "'Confluence Score' columns."
        ),
    )
    parser.add_argument(
        "--november",
        type=Path,
        default=DEFAULT_NOV_PATH,
        help=(
            "Path to the November 2025 calendar workbook with 'Date' and "
            "'Risk Tone' columns."
        ),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Output path for the combined dataset workbook.",
    )
    parser.add_argument(
        "--chart",
        type=Path,
        default=DEFAULT_CHART_PATH,
        help="Optional path for the generated chart image.",
    )
    parser.add_argument(
        "--window",
        type=int,
        default=3,
        help="Rolling window (in events) used to smooth the index.",
    )
    return parser.parse_args(args)


def _extract_november_dates(series: pd.Series) -> pd.Series:
    """Convert the November date descriptions into timestamps.

    The calendar entries typically describe the event day with text such as
    "Nov 4" or "Nov 4 – 6". We extract the first numeric day reference and use
    it as the calendar day in November 2025. Missing or unparsable entries fall
    back to the 15th of the month.
    """

    day_strings = series.astype(str).str.extract(r"(\d{1,2})")[0]
    days = pd.to_numeric(day_strings, errors="coerce").fillna(15).astype(int)
    return pd.to_datetime({"year": 2025, "month": 11, "day": days})


def load_previous_alignment(path: Path) -> pd.DataFrame:
    """Load the historical astro-market alignment workbook."""

    df_prev = pd.read_excel(path, sheet_name="Data")
    expected_columns = {"Date (approx)", "Confluence Score"}
    missing = expected_columns.difference(df_prev.columns)
    if missing:
        missing_str = ", ".join(sorted(missing))
        raise ValueError(
            f"Historical dataset is missing required columns: {missing_str}."
        )
    df_prev = df_prev.rename(columns={"Date (approx)": "Date"})
    df_prev["Date"] = pd.to_datetime(df_prev["Date"], errors="coerce")
    return df_prev[["Date", "Confluence Score"]]


def load_november_alignment(path: Path) -> pd.DataFrame:
    """Load and prepare the November 2025 calendar entries."""

    df_nov = pd.read_excel(path)
    expected_columns = {"Date", "Risk Tone"}
    missing = expected_columns.difference(df_nov.columns)
    if missing:
        missing_str = ", ".join(sorted(missing))
        raise ValueError(
            f"November dataset is missing required columns: {missing_str}."
        )

    df_nov = df_nov.copy()
    df_nov["Date"] = _extract_november_dates(df_nov["Date"])
    df_nov["Confluence Score"] = df_nov["Risk Tone"].map(TONE_MAP)
    if df_nov["Confluence Score"].isna().any():
        unknown_tones = df_nov.loc[
            df_nov["Confluence Score"].isna(), "Risk Tone"
        ].unique()
        unknown = ", ".join(sorted(map(str, unknown_tones)))
        raise ValueError(
            "Encountered unrecognised Risk Tone values: "
            f"{unknown or '[empty values]'}."
        )

    return df_nov[["Date", "Confluence Score"]]


def build_correlation_index(
    previous_df: pd.DataFrame, november_df: pd.DataFrame, window: int
) -> pd.DataFrame:
    """Combine historical and November data and compute the rolling index."""

    if window < 1:
        raise ValueError("Rolling window must be at least 1.")

    combo = (
        pd.concat([previous_df, november_df], ignore_index=True)
        .sort_values("Date")
        .reset_index(drop=True)
    )
    combo["Rolling Index"] = (
        combo["Confluence Score"].rolling(window=window, min_periods=1).mean()
    )
    return combo


def plot_index(df: pd.DataFrame, output_path: Path) -> None:
    """Render and save the Planetary-Market Correlation Index chart."""

    plt.figure(figsize=(10, 5))
    plt.plot(
        df["Date"],
        df["Rolling Index"],
        marker="o",
        linestyle="-",
        label="Planetary–Market Correlation Index",
    )
    plt.title(
        "Planetary–Market Correlation Index (2020–2025 including Nov 2025 forecast)"
    )
    plt.xlabel("Date")
    plt.ylabel("Average Alignment Strength (0–1)")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path)
    plt.close()


def save_dataset(df: pd.DataFrame, output_path: Path) -> None:
    """Persist the combined dataset to an Excel workbook."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(output_path, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name="Correlation_Index")


def main(args: Iterable[str] | None = None) -> Path:
    """Entry point for script execution."""

    options = parse_args(args)
    previous_df = load_previous_alignment(options.previous)
    november_df = load_november_alignment(options.november)
    combined = build_correlation_index(previous_df, november_df, options.window)

    save_dataset(combined, options.output)
    if options.chart is not None:
        plot_index(combined, options.chart)
    return options.output


if __name__ == "__main__":
    main()
