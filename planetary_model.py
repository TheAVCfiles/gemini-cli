"""Planetary-Market Correlation (PMCI) demo pipeline.

This module synthesizes ephemeris data, constructs a toy market index
influenced by the generated planetary cycles, and evaluates the
relationship between the two via several analytics artefacts.

Running this file as a script will generate CSV outputs and charts under
``./outputs`` that mirror a realistic research workflow:

* Synthetic ephemeris and market price histories
* Aspect detection and daily PMCI index values (raw and z-scored)
* Rolling correlations between PMCI and market returns
* A naive long/short backtest driven by PMCI signals
* A permutation test to gauge statistical significance of the observed
  correlations
* Example visualisations to explore the relationships

The script is intentionally self-contained, making it easy to swap out
synthetic inputs with real ephemeris or market data sources when moving
beyond the prototype stage.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from itertools import combinations
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

# Seed all pseudo-random behaviour for reproducibility of the demo outputs
RNG = np.random.default_rng(42)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

# Planet definitions loosely based on synodic motion speeds (deg/day)
PLANET_SPEEDS = {
    "Sun": 0.9856,
    "Moon": 13.1764,
    "Mercury": 1.607,
    "Venus": 1.174,
    "Mars": 0.524,
    "Jupiter": 0.084,
    "Saturn": 0.033,
}

ASPECT_ANGLES = {
    "Conjunction": 0,
    "Sextile": 60,
    "Square": 90,
    "Trine": 120,
    "Opposition": 180,
}

# Relative importance and polarity of each aspect type for the PMCI score.
ASPECT_WEIGHTS = {
    "Conjunction": 0.6,
    "Sextile": 0.9,
    "Square": -1.0,
    "Trine": 1.1,
    "Opposition": -1.2,
}

# Orb tolerances per aspect in degrees. Harmonious aspects use a tighter orb
# to generate more pronounced peaks in the PMCI signal.
ASPECT_ORBS = {
    "Conjunction": 4.0,
    "Sextile": 3.0,
    "Square": 4.5,
    "Trine": 3.0,
    "Opposition": 5.0,
}


@dataclass
class PipelineOutputs:
    """Convenience container for the generated artefacts."""

    ephemeris: pd.DataFrame
    aspects: pd.DataFrame
    pmci: pd.DataFrame
    pmci_monthly: pd.DataFrame
    market: pd.DataFrame
    rolling_correlations: pd.DataFrame
    backtest_summary: pd.DataFrame
    permutation_result: Dict[str, float]


def generate_demo_ephemeris(
    start: str = "2015-01-01",
    end: str = "2024-12-31",
    freq: str = "D",
) -> pd.DataFrame:
    """Create a synthetic ephemeris table with smoothly varying longitudes."""

    dates = pd.date_range(start=start, end=end, freq=freq)
    steps = np.arange(len(dates))
    data: Dict[str, Iterable[float]] = {"date": dates}

    for idx, (planet, speed) in enumerate(PLANET_SPEEDS.items()):
        base_motion = (speed * steps) % 360
        modulation = 8 * np.sin(2 * np.pi * steps / (365.25 / max(speed, 0.01)))
        wobble = 4 * np.sin(2 * np.pi * steps / (45 + 30 * idx) + idx)
        data[f"{planet}_Longitude"] = (base_motion + modulation + wobble) % 360

    ephemeris = pd.DataFrame(data)
    return ephemeris


def angular_separation(angle_a: float, angle_b: float) -> float:
    """Return the absolute smallest angle between two circular measures."""

    diff = abs(angle_a - angle_b) % 360
    if diff > 180:
        diff = 360 - diff
    return diff


def detect_aspects(ephemeris: pd.DataFrame) -> pd.DataFrame:
    """Identify aspects between each planetary pair for every observation."""

    planet_columns = [col for col in ephemeris.columns if col.endswith("_Longitude")]
    records: List[Dict[str, object]] = []

    for _, row in ephemeris.iterrows():
        date = row["date"]
        for planet_a, planet_b in combinations(planet_columns, 2):
            angle_a = row[planet_a]
            angle_b = row[planet_b]
            sep = angular_separation(angle_a, angle_b)

            for aspect, target_angle in ASPECT_ANGLES.items():
                orb = sep - target_angle
                if abs(orb) <= ASPECT_ORBS[aspect]:
                    records.append(
                        {
                            "date": date,
                            "planet_a": planet_a.replace("_Longitude", ""),
                            "planet_b": planet_b.replace("_Longitude", ""),
                            "aspect": aspect,
                            "orb": orb,
                        }
                    )

    return pd.DataFrame(records)


def gaussian_weight(orb: float, tolerance: float) -> float:
    """A smooth weight that peaks when the aspect is exact."""

    # Negative exponent ensures the weight decays symmetrically as the orb grows.
    exponent = -0.5 * (orb / tolerance) ** 2
    return float(np.exp(exponent))


def compute_pmci(ephemeris: pd.DataFrame, aspects: pd.DataFrame) -> pd.DataFrame:
    """Aggregate aspect strength into a composite PMCI value."""

    if aspects.empty:
        raise ValueError("Aspect table is empty; cannot compute PMCI")

    daily_scores: Dict[pd.Timestamp, float] = {}
    for date, group in aspects.groupby("date"):
        score = 0.0
        for _, row in group.iterrows():
            weight = ASPECT_WEIGHTS[row["aspect"]]
            tolerance = ASPECT_ORBS[row["aspect"]]
            strength = gaussian_weight(row["orb"], tolerance)
            score += weight * strength
        daily_scores[pd.to_datetime(date)] = score

    pmci = (
        pd.DataFrame(
            {
                "date": pd.to_datetime(list(daily_scores.keys())),
                "pmci_raw": list(daily_scores.values()),
            }
        )
        .sort_values("date")
        .reset_index(drop=True)
    )

    pmci["pmci_z"] = (pmci["pmci_raw"] - pmci["pmci_raw"].mean()) / pmci["pmci_raw"].std(ddof=0)
    return pmci


def resample_monthly(pmci: pd.DataFrame) -> pd.DataFrame:
    """Compute monthly averages of the PMCI signal."""

    monthly = (
        pmci.set_index("date")
        .resample("M")
        .agg({"pmci_raw": "mean", "pmci_z": "mean"})
        .reset_index()
        .rename(columns={"date": "month"})
    )
    return monthly


def generate_market_index(pmci: pd.Series) -> pd.DataFrame:
    """Create a synthetic market index influenced by PMCI dynamics."""

    baseline_trend = 0.0004  # ~10% annual drift
    pmci_influence = 0.004 * pmci  # modulates daily returns with PMCI
    seasonality = 0.0015 * np.sin(np.linspace(0, 10 * np.pi, len(pmci)))
    noise = RNG.normal(0, 0.006, size=len(pmci))

    daily_returns = baseline_trend + pmci_influence + seasonality + noise
    price = 100 * np.exp(np.cumsum(daily_returns))

    market = pd.DataFrame(
        {
            "date": pmci.index,
            "Tech_Index": price,
            "return": daily_returns,
        }
    )
    return market


def compute_rolling_correlations(
    pmci: pd.Series, returns: pd.Series, windows: Sequence[int] = (30, 60, 120)
) -> pd.DataFrame:
    """Calculate rolling correlations for several window lengths."""

    frames = []
    for window in windows:
        corr = pmci.rolling(window).corr(returns)
        frames.append(
            pd.DataFrame(
                {
                    "date": pmci.index,
                    "window": window,
                    "correlation": corr,
                }
            )
        )

    return pd.concat(frames, ignore_index=True)


def run_backtest(pmci: pd.Series, returns: pd.Series) -> pd.DataFrame:
    """Naive long/short strategy driven by PMCI z-scores."""

    signal = pd.Series(0, index=pmci.index, dtype=float)
    signal = signal.mask(pmci > 0.75, 1.0)
    signal = signal.mask(pmci < -0.75, -1.0)
    strategy_returns = signal.shift(1).fillna(0) * returns

    equity_curve = (1 + strategy_returns).cumprod()
    total_return = equity_curve.iloc[-1] - 1
    days = len(strategy_returns)
    annual_factor = np.sqrt(252)

    sharpe = strategy_returns.mean() / strategy_returns.std(ddof=0) * annual_factor
    hit_rate = (strategy_returns > 0).mean()

    summary = pd.DataFrame(
        {
            "metric": ["Total Return", "Annualized Sharpe", "Hit Rate"],
            "value": [total_return, sharpe, hit_rate],
        }
    )
    summary["value"] = summary["value"].astype(float)

    return summary


def permutation_test(
    pmci: pd.Series,
    returns: pd.Series,
    iterations: int = 1000,
) -> Dict[str, float]:
    """Permutation test for PMCI/returns correlation significance."""

    aligned = pd.DataFrame({"pmci": pmci, "returns": returns}).dropna()
    actual_corr = aligned["pmci"].corr(aligned["returns"])

    sims = []
    for _ in range(iterations):
        shuffled = RNG.permutation(aligned["pmci"].to_numpy())
        sims.append(np.corrcoef(shuffled, aligned["returns"].to_numpy())[0, 1])

    sims_arr = np.array(sims)
    p_value = (np.abs(sims_arr) >= abs(actual_corr)).mean()

    return {
        "actual_correlation": float(actual_corr),
        "mean_random_correlation": float(sims_arr.mean()),
        "std_random_correlation": float(sims_arr.std(ddof=0)),
        "p_value_two_sided": float(p_value),
        "iterations": float(iterations),
    }


def write_outputs(outputs: PipelineOutputs) -> None:
    """Persist pipeline artefacts to ``./outputs``."""

    outputs.ephemeris.to_csv(OUTPUT_DIR / "ephemeris_demo.csv", index=False)
    outputs.market.drop(columns=["return"], errors="ignore").to_csv(
        OUTPUT_DIR / "market_demo_prices.csv", index=False
    )
    outputs.aspects.to_csv(OUTPUT_DIR / "aspects_demo.csv", index=False)
    outputs.pmci.to_csv(OUTPUT_DIR / "pmci_demo_z.csv", index=False)
    outputs.pmci[["date", "pmci_raw"]].to_csv(
        OUTPUT_DIR / "pmci_demo_raw.csv", index=False
    )
    outputs.pmci_monthly.to_csv(OUTPUT_DIR / "pmci_monthly.csv", index=False)
    outputs.rolling_correlations.to_csv(
        OUTPUT_DIR / "rolling_corr_demo.csv", index=False
    )
    outputs.backtest_summary.to_csv(
        OUTPUT_DIR / "backtest_summary.csv", index=False
    )
    with open(OUTPUT_DIR / "permutation_result.json", "w", encoding="utf-8") as fh:
        json.dump(outputs.permutation_result, fh, indent=2)


def plot_pmci_vs_price(pmci: pd.DataFrame, market: pd.DataFrame) -> None:
    """Render a dual-axis plot comparing PMCI and market levels."""

    merged = pmci.merge(market, on="date")
    fig, ax1 = plt.subplots(figsize=(12, 6))

    ax1.plot(merged["date"], merged["pmci_z"], color="tab:blue", label="PMCI (z-score)")
    ax1.set_ylabel("PMCI (z-score)", color="tab:blue")
    ax1.tick_params(axis="y", labelcolor="tab:blue")

    ax2 = ax1.twinx()
    ax2.plot(merged["date"], merged["Tech_Index"], color="tab:orange", label="Tech Index")
    ax2.set_ylabel("Tech Index Level", color="tab:orange")
    ax2.tick_params(axis="y", labelcolor="tab:orange")

    ax1.set_title("PMCI vs. Synthetic Tech Index")
    ax1.set_xlabel("Date")

    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "pmci_vs_tech.png", dpi=150)
    plt.close(fig)


def plot_rolling_correlation_heatmap(rolling_corr: pd.DataFrame) -> None:
    """Plot a heatmap of rolling correlations across window sizes and years."""

    data = rolling_corr.dropna().copy()
    data["year"] = data["date"].dt.year
    pivot = data.pivot_table(
        index="year", columns="window", values="correlation", aggfunc="mean"
    )

    plt.figure(figsize=(8, 6))
    sns.heatmap(
        pivot,
        annot=True,
        fmt=".2f",
        cmap="coolwarm",
        center=0,
        cbar_kws={"label": "Correlation"},
    )
    plt.title("Average Rolling Correlations by Window")
    plt.ylabel("Year")
    plt.xlabel("Window (days)")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "rolling_corr_heatmap.png", dpi=150)
    plt.close()


def run_pipeline(write_outputs_flag: bool = True) -> PipelineOutputs:
    """Execute the full demo workflow and optionally persist artefacts."""

    ephemeris = generate_demo_ephemeris()
    aspects = detect_aspects(ephemeris)

    pmci = compute_pmci(ephemeris, aspects)
    pmci_monthly = resample_monthly(pmci)

    market = generate_market_index(pmci.set_index("date")["pmci_z"])
    rolling_corr = compute_rolling_correlations(
        pmci.set_index("date")["pmci_z"], market.set_index("date")["return"]
    )
    backtest_summary = run_backtest(
        pmci.set_index("date")["pmci_z"], market.set_index("date")["return"]
    )
    permutation_result = permutation_test(
        pmci.set_index("date")["pmci_z"], market.set_index("date")["return"]
    )

    outputs = PipelineOutputs(
        ephemeris=ephemeris,
        aspects=aspects,
        pmci=pmci,
        pmci_monthly=pmci_monthly,
        market=market,
        rolling_correlations=rolling_corr,
        backtest_summary=backtest_summary,
        permutation_result=permutation_result,
    )

    if write_outputs_flag:
        write_outputs(outputs)
        plot_pmci_vs_price(pmci, market)
        plot_rolling_correlation_heatmap(rolling_corr)

    return outputs


def main() -> None:
    """Entry point for CLI usage."""

    outputs = run_pipeline(write_outputs_flag=True)

    print("Generated demo outputs in ./outputs:")
    for file in sorted(OUTPUT_DIR.iterdir()):
        if file.is_file():
            print(f" - {file.name}")

    print("\nBacktest summary:")
    print(outputs.backtest_summary.to_string(index=False))

    print("\nPermutation test:")
    print(json.dumps(outputs.permutation_result, indent=2))


if __name__ == "__main__":
    main()
