"""Compute bootstrap tau summary and write out/tau_star_summary.csv."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from institutional_filter import block_bootstrap_tau_ci

OUTPUT_DIR = Path("out")
INPUT_RETURNS = OUTPUT_DIR / "eth_li_returns.csv"  # timestamp, eth_return, li_return
TAU_SUMMARY = OUTPUT_DIR / "tau_star_summary.csv"


def run_bootstrap() -> pd.DataFrame:
    if not INPUT_RETURNS.exists():
        raise FileNotFoundError(
            "Missing out/eth_li_returns.csv with columns: timestamp,eth_return,li_return"
        )

    df = pd.read_csv(INPUT_RETURNS)
    if not {"eth_return", "li_return"}.issubset(df.columns):
        raise ValueError("Input must contain columns eth_return and li_return")

    result = block_bootstrap_tau_ci(df["eth_return"], df["li_return"], block_size=5, n_bootstrap=1000)
    ci_status = (
        "Excludes 0"
        if ((result.ci_lower > 0 and result.ci_upper > 0) or (result.ci_lower < 0 and result.ci_upper < 0))
        else "Includes 0"
    )

    summary = pd.DataFrame(
        [
            {
                "horizon": 30,
                "tau_star": result.tau,
                "ci_lower": result.ci_lower,
                "ci_upper": result.ci_upper,
                "ci_status": ci_status,
                "p_value": result.p_value,
            }
        ]
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary.to_csv(TAU_SUMMARY, index=False)
    return summary


if __name__ == "__main__":
    out = run_bootstrap()
    print(
        "✅ BOOTSTRAP COMPLETE "
        f"| tau={out.loc[0, 'tau_star']} "
        f"| ci=[{out.loc[0, 'ci_lower']:.4f}, {out.loc[0, 'ci_upper']:.4f}] "
        f"| p={out.loc[0, 'p_value']:.4f}"
    )
