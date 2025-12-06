"""Streamlit dashboard for exploring the PMCI prototype outputs."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import pandas as pd
import streamlit as st

from planetary_model import PipelineOutputs, run_pipeline

OUTPUT_DIR = Path("outputs")


def ensure_outputs() -> PipelineOutputs:
    """Load existing artefacts or trigger a fresh pipeline run."""

    expected_files = [
        OUTPUT_DIR / "pmci_demo_z.csv",
        OUTPUT_DIR / "market_demo_prices.csv",
        OUTPUT_DIR / "rolling_corr_demo.csv",
    ]
    if all(path.exists() for path in expected_files):
        pmci = pd.read_csv(expected_files[0], parse_dates=["date"])
        market = pd.read_csv(expected_files[1], parse_dates=["date"])
        rolling_corr = pd.read_csv(expected_files[2], parse_dates=["date"])
        aspects = pd.read_csv(OUTPUT_DIR / "aspects_demo.csv", parse_dates=["date"])
        ephemeris = pd.read_csv(OUTPUT_DIR / "ephemeris_demo.csv", parse_dates=["date"])
        pmci_monthly = pd.read_csv(OUTPUT_DIR / "pmci_monthly.csv", parse_dates=["month"])
        backtest_summary = pd.read_csv(OUTPUT_DIR / "backtest_summary.csv")
        permutation_result = pd.read_json(OUTPUT_DIR / "permutation_result.json")

        return PipelineOutputs(
            ephemeris=ephemeris,
            aspects=aspects,
            pmci=pmci,
            pmci_monthly=pmci_monthly,
            market=market,
            rolling_correlations=rolling_corr,
            backtest_summary=backtest_summary,
            permutation_result=permutation_result.iloc[0].to_dict(),
        )

    return run_pipeline(write_outputs_flag=True)


def draw_summary_cards(outputs: PipelineOutputs) -> None:
    """Display key metrics in a compact format."""

    aligned = outputs.pmci.merge(outputs.market, on="date")
    corr = aligned["pmci_z"].corr(
        aligned["Tech_Index"].pct_change().rolling(30).mean(),
    )

    col1, col2, col3 = st.columns(3)
    col1.metric("Observations", f"{len(outputs.pmci):,}")
    col2.metric("Avg Rolling Corr (30d)", f"{corr:.2f}")
    col3.metric(
        "Permutation p-value",
        f"{outputs.permutation_result['p_value_two_sided']:.3f}",
    )


def main() -> None:
    st.set_page_config(page_title="Planetary Market Correlation Index", layout="wide")
    st.title("Planetary-Market Correlation Prototype")
    st.caption(
        "Synthetic demo data showcasing PMCI signals, rolling correlations, "
        "and a toy backtest. Replace the data sources with real ephemeris/market feeds "
        "for production research."
    )

    outputs = ensure_outputs()
    draw_summary_cards(outputs)

    with st.expander("PMCI vs Synthetic Tech Index", expanded=True):
        merged = outputs.pmci.merge(outputs.market, on="date").set_index("date")
        chart_data = merged[["pmci_z", "Tech_Index"]]
        st.line_chart(chart_data)

    with st.expander("Rolling Correlations"):
        selected_window = st.slider("Window length (days)", 20, 180, 60, step=10)
        corr_subset = outputs.rolling_correlations[
            outputs.rolling_correlations["window"] == selected_window
        ].set_index("date")
        st.line_chart(corr_subset["correlation"].dropna())

    with st.expander("Aspect Activity", expanded=False):
        st.dataframe(outputs.aspects.head(50))

    with st.expander("Monthly PMCI Averages", expanded=False):
        monthly = outputs.pmci_monthly.set_index("month")
        st.bar_chart(monthly["pmci_z"])

    with st.expander("Backtest Summary"):
        st.table(outputs.backtest_summary.set_index("metric"))

    st.markdown("---")
    st.caption(
        "Prototype artefacts live under ./outputs/. Run `python planetary_model.py` to refresh the dataset."
    )


if __name__ == "__main__":
    main()
