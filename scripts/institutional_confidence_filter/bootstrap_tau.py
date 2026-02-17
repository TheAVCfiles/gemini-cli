from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class BootstrapResult:
    tau: int
    ci_lower: float
    ci_upper: float
    p_value: float
    corr_at_tau: float
    ci_excludes_zero: bool


def _aligned_for_lag(x: np.ndarray, y: np.ndarray, lag: int) -> tuple[np.ndarray, np.ndarray]:
    if lag > 0:
        return x[:-lag], y[lag:]
    if lag < 0:
        return x[-lag:], y[:lag]
    return x, y


def _safe_corr(a: np.ndarray, b: np.ndarray) -> float:
    if len(a) < 3 or len(b) < 3:
        return 0.0
    if np.std(a) == 0 or np.std(b) == 0:
        return 0.0
    return float(np.corrcoef(a, b)[0, 1])


def _bootstrap_corr_for_lag(
    x: np.ndarray,
    y: np.ndarray,
    lag: int,
    block_size: int,
    n_boot: int,
    seed: int,
) -> tuple[np.ndarray, float]:
    x_aligned, y_aligned = _aligned_for_lag(x, y, lag)
    n = len(x_aligned)
    observed = _safe_corr(x_aligned, y_aligned)

    rng = np.random.default_rng(seed)
    n_blocks = int(np.ceil(n / block_size))
    max_start = max(1, n - block_size + 1)

    boot_corrs: list[float] = []
    for _ in range(n_boot):
        starts = rng.integers(0, max_start, size=n_blocks)
        bx = np.concatenate([x_aligned[s : s + block_size] for s in starts])[:n]
        by = np.concatenate([y_aligned[s : s + block_size] for s in starts])[:n]
        boot_corrs.append(_safe_corr(bx, by))

    return np.array(boot_corrs, dtype=float), observed


def compute_block_bootstrap_tau(
    x: pd.Series,
    y: pd.Series,
    max_lag: int = 20,
    block_size: int = 5,
    n_boot: int = 2000,
    alpha: float = 0.05,
    seed: int = 7,
) -> BootstrapResult:
    clean = pd.DataFrame({"x": x, "y": y}).dropna()
    if clean.empty or len(clean) < max(30, block_size * 5):
        return BootstrapResult(0, 0.0, 0.0, 1.0, 0.0, False)

    x_vals = clean["x"].to_numpy(dtype=float)
    y_vals = clean["y"].to_numpy(dtype=float)

    lags = range(-max_lag, max_lag + 1)
    corrs = np.array([_safe_corr(*_aligned_for_lag(x_vals, y_vals, lag)) for lag in lags])
    tau = int(list(lags)[int(np.argmax(np.abs(corrs)))])

    boot_corrs, observed = _bootstrap_corr_for_lag(
        x_vals, y_vals, tau, block_size=block_size, n_boot=n_boot, seed=seed
    )

    lo = float(np.quantile(boot_corrs, alpha / 2))
    hi = float(np.quantile(boot_corrs, 1 - alpha / 2))
    ci_excludes_zero = (lo > 0 and hi > 0) or (lo < 0 and hi < 0)

    p_one_sided = float(np.mean(np.abs(boot_corrs) >= abs(observed)))
    p_value = min(1.0, max(0.0, p_one_sided))

    return BootstrapResult(tau, lo, hi, p_value, observed, ci_excludes_zero)


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute block-bootstrap tau confidence interval")
    parser.add_argument("--input", type=Path, required=True, help="CSV with x/y return columns")
    parser.add_argument("--x-col", type=str, required=True)
    parser.add_argument("--y-col", type=str, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-lag", type=int, default=20)
    parser.add_argument("--block-size", type=int, default=5)
    parser.add_argument("--n-boot", type=int, default=2000)
    parser.add_argument("--alpha", type=float, default=0.05)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    df = pd.read_csv(args.input)
    result = compute_block_bootstrap_tau(
        df[args.x_col],
        df[args.y_col],
        max_lag=args.max_lag,
        block_size=args.block_size,
        n_boot=args.n_boot,
        alpha=args.alpha,
        seed=args.seed,
    )

    payload = {
        "tau": result.tau,
        "ci_lower": result.ci_lower,
        "ci_upper": result.ci_upper,
        "p_value": result.p_value,
        "corr_at_tau": result.corr_at_tau,
        "tau_ci_excludes_zero": result.ci_excludes_zero,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, sort_keys=True))
    print(json.dumps(payload, sort_keys=True))


if __name__ == "__main__":
    main()
