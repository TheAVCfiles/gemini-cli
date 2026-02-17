"""Block-bootstrap tools for Institutional Confidence Filter."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class BootstrapResult:
    tau: int
    ci_lower: float
    ci_upper: float
    p_value: float


def _as_array(values: Iterable[float] | np.ndarray | pd.Series) -> np.ndarray:
    arr = np.asarray(values, dtype=float)
    return arr[np.isfinite(arr)]


def _corr_at_lag(x: np.ndarray, y: np.ndarray, lag: int) -> float:
    if lag > 0:
        xs = x[:-lag]
        ys = y[lag:]
    elif lag < 0:
        xs = x[-lag:]
        ys = y[:lag]
    else:
        xs = x
        ys = y

    if xs.size < 3 or ys.size < 3:
        return 0.0

    if np.std(xs) == 0.0 or np.std(ys) == 0.0:
        return 0.0

    corr = float(np.corrcoef(xs, ys)[0, 1])
    return 0.0 if np.isnan(corr) else corr


def _bootstrap_corr_distribution(
    x: np.ndarray,
    y: np.ndarray,
    tau: int,
    block_size: int,
    n_bootstrap: int,
    rng: np.random.Generator,
) -> np.ndarray:
    n = x.size
    n_blocks = max(1, n // block_size)
    max_start = n - block_size + 1
    boot_corrs = np.empty(n_bootstrap, dtype=float)

    for i in range(n_bootstrap):
        starts = rng.integers(0, max_start, size=n_blocks)
        boot_x = np.concatenate([x[s : s + block_size] for s in starts])
        boot_y = np.concatenate([y[s : s + block_size] for s in starts])
        boot_corrs[i] = _corr_at_lag(boot_x, boot_y, tau)

    return boot_corrs


def block_bootstrap_tau_ci(
    x: Iterable[float] | np.ndarray | pd.Series,
    y: Iterable[float] | np.ndarray | pd.Series,
    *,
    max_lag: int = 20,
    block_size: int = 5,
    n_bootstrap: int = 1000,
    alpha: float = 0.05,
    random_seed: int | None = 7,
) -> BootstrapResult:
    x_arr = _as_array(x)
    y_arr = _as_array(y)

    n = min(x_arr.size, y_arr.size)
    x_arr = x_arr[:n]
    y_arr = y_arr[:n]

    if n < max(40, block_size * 10) or block_size <= 0 or n_bootstrap <= 0:
        return BootstrapResult(tau=0, ci_lower=0.0, ci_upper=0.0, p_value=1.0)

    rng = np.random.default_rng(random_seed)

    lags = list(range(-max_lag, max_lag + 1))
    corrs = [_corr_at_lag(x_arr, y_arr, lag) for lag in lags]
    tau = int(lags[int(np.argmax(np.abs(corrs)))])

    observed_corr = _corr_at_lag(x_arr, y_arr, tau)
    boot_corrs = _bootstrap_corr_distribution(x_arr, y_arr, tau, block_size, n_bootstrap, rng)

    lower_q = 100.0 * (alpha / 2.0)
    upper_q = 100.0 * (1.0 - alpha / 2.0)
    ci_lower, ci_upper = np.percentile(boot_corrs, [lower_q, upper_q]).tolist()

    centered = boot_corrs - np.mean(boot_corrs)
    p_value = float(np.mean(np.abs(centered) >= abs(observed_corr)))
    p_value = max(0.0, min(1.0, p_value))

    return BootstrapResult(
        tau=tau,
        ci_lower=float(ci_lower),
        ci_upper=float(ci_upper),
        p_value=p_value,
    )


def block_bootstrap_ci(
    series_x: pd.Series,
    series_y: pd.Series,
    block_size: int = 5,
    n_boot: int = 1000,
    alpha: float = 0.05,
) -> tuple[int, np.ndarray, float]:
    """Compatibility helper returning (tau, [ci_lower, ci_upper], p_value)."""
    result = block_bootstrap_tau_ci(
        series_x,
        series_y,
        block_size=block_size,
        n_bootstrap=n_boot,
        alpha=alpha,
    )
    return result.tau, np.array([result.ci_lower, result.ci_upper]), result.p_value
