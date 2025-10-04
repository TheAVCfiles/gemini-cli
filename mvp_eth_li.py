import pandas as pd
import numpy as np
from pathlib import Path

# ---------- config ----------
LAG_WINDOW = 30
DETREND_WIN = 30
BLOCK_LEN = 10
N_BOOT = 1500
PERM_N = 3000
FWD_H = [30, 90]
CONFIRM_W = 7
OUT = Path("out")
OUT.mkdir(exist_ok=True)

# ---------- io ----------
px = (
    pd.read_csv("prices_mock.csv", parse_dates=["date"])\
    .set_index("date")
    .sort_index()
)
taps = pd.read_csv("taps_mock.csv", parse_dates=["tap_date"]).sort_values("tap_date")
ev = pd.read_csv("structural_events_mock.csv", parse_dates=["date"]).sort_values("date")

# choose pair
x = px["LIT"].astype(float).rename("LIT")  # leader candidate
y = px["ETH"].astype(float).rename("ETH")  # follower candidate


# ---------- detrend ----------
def detrend(s: pd.Series, win: int = 30) -> pd.Series:
    m = s.rolling(win, min_periods=1).mean()
    return (s - m).dropna()


def aligned(series_a: pd.Series, series_b: pd.Series) -> tuple[pd.Series, pd.Series]:
    return series_a.align(series_b, join="inner")


def detrended_pair(series_x: pd.Series, series_y: pd.Series) -> tuple[pd.Series, pd.Series]:
    xd = detrend(np.log(series_x), DETREND_WIN)
    yd = detrend(np.log(series_y), DETREND_WIN)
    return aligned(xd, yd)


xd, yd = detrended_pair(x, y)


# ---------- lag sweep ----------
def corr_at_lag(xd: pd.Series, yd: pd.Series, lag: int) -> float:
    if lag > 0:
        return xd.iloc[:-lag].corr(yd.iloc[lag:])
    if lag < 0:
        L = -lag
        return xd.iloc[L:].corr(yd.iloc[:-L])
    return xd.corr(yd)


lags = range(-LAG_WINDOW, LAG_WINDOW + 1)
corrs = pd.Series({lag: corr_at_lag(xd, yd, lag) for lag in lags})
tau_star = corrs.idxmax()
r_star = corrs.loc[tau_star]
corrs.to_csv(OUT / "corr_by_lag.csv")


# ---------- block bootstrap CI for r(tau*) ----------
rng = np.random.default_rng(7)

def aligned_series(xd: pd.Series, yd: pd.Series, lag: int) -> tuple[np.ndarray, np.ndarray]:
    if lag > 0:
        return xd.iloc[:-lag].to_numpy(), yd.iloc[lag:].to_numpy()
    if lag < 0:
        L = -lag
        return xd.iloc[L:].to_numpy(), yd.iloc[:-L].to_numpy()
    return xd.to_numpy(), yd.to_numpy()


a, b = aligned_series(xd, yd, tau_star)
n = len(a)
nb = max(1, n // BLOCK_LEN)


def boot_once() -> float:
    idx = []
    for _ in range(nb):
        s = rng.integers(0, n - BLOCK_LEN + 1)
        idx.extend(range(s, s + BLOCK_LEN))
    idx = np.array(idx[:n])
    return np.corrcoef(a[idx], b[idx])[0, 1]


boots = np.array([boot_once() for _ in range(N_BOOT)])
ci_low, ci_high = np.quantile(boots, [0.025, 0.975])
pd.DataFrame(
    {
        "tau_star": [tau_star],
        "r_star": [r_star],
        "ci_low": [ci_low],
        "ci_high": [ci_high],
    }
).to_csv(OUT / "tau_star_summary.csv", index=False)


# ---------- event study (weekday-matched permutation) ----------
ret = y.pct_change()
ret.name = "r"
ret = ret.dropna()


def fwd_return(start_date: pd.Timestamp, horizon: int) -> float:
    try:
        p0 = y.loc[start_date]
        tH = start_date + pd.Timedelta(days=horizon)
        idx = y.index.get_indexer([tH], method="nearest")[0]
        pH = y.iloc[idx]
        return (pH - p0) / p0
    except Exception:
        return np.nan


def weekday_match_pool(dayofweek: int) -> pd.Index:
    return ret[ret.index.dayofweek == dayofweek].index


rows = []
for _, tap in taps.iterrows():
    tap_date = tap["tap_date"].normalize()
    for horizon in FWD_H:
        fwd = fwd_return(tap_date, horizon)
        pool = weekday_match_pool(tap_date.dayofweek)
        draw = rng.choice(pool, size=PERM_N, replace=True)
        perm = np.array([fwd_return(pd.Timestamp(dd), horizon) for dd in draw])
        perm = perm[~np.isnan(perm)]
        p_val = (
            (np.sum(perm >= fwd) + 1) / (len(perm) + 1)
            if np.isfinite(fwd)
            else np.nan
        )
        rows.append(
            {
                "tap_date": tap_date,
                "H": horizon,
                "fwd_return": fwd,
                "perm_mean": np.nanmean(perm),
                "p_one_sided": p_val,
            }
        )

event_perm = pd.DataFrame(rows)
event_perm.to_csv(OUT / "event_study_permutation_summary.csv", index=False)


# ---------- structural confirmation overlay ----------
def is_confirmed(tap_date: pd.Timestamp) -> tuple[bool, str | None]:
    window = (
        (ev["date"] >= tap_date - pd.Timedelta(days=CONFIRM_W))
        & (ev["date"] <= tap_date + pd.Timedelta(days=CONFIRM_W))
        & (ev["weight"] >= 80)
    )
    subset = ev.loc[window]
    if subset.empty:
        return False, None
    top = subset.sort_values("weight", ascending=False).iloc[0]
    desc = f"{top['summary']} (W:{int(top['weight'])}, {top['date'].date()})"
    return True, desc


def record_overlay(tap_date: pd.Timestamp) -> dict:
    confirmed, description = is_confirmed(tap_date)
    entry: dict[str, object] = {
        "tap_date": tap_date,
        "is_confirmed": confirmed,
        "confirmation": description,
    }
    for horizon in FWD_H + [60]:
        entry[f"R_{horizon}d"] = fwd_return(tap_date.normalize(), horizon)
    return entry


overlay = pd.DataFrame([record_overlay(t) for t in taps["tap_date"]])
overlay.to_csv(OUT / "backtest_overlay_results.csv", index=False)


def by_group(df: pd.DataFrame, horizon: int) -> pd.DataFrame:
    grouped = df.groupby("is_confirmed")[f"R_{horizon}d"].agg(["mean", "std", "count"])
    hit_rate = df.groupby("is_confirmed")[f"R_{horizon}d"].apply(lambda s: (s > 0).mean())
    grouped["hit_rate"] = hit_rate
    return grouped


stats = []
for horizon in FWD_H + [60]:
    summary = by_group(overlay, horizon)
    summary["H"] = horizon
    stats.append(summary.reset_index())

stats_df = pd.concat(stats, ignore_index=True)
stats_df.to_csv(OUT / "backtest_stats_summary.csv", index=False)

print("Done. Wrote:", [path.name for path in OUT.iterdir()])
