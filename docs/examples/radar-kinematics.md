# Compute kinematics after harmonic levels and tri-star analysis

This walkthrough shows how to extend a futures radar notebook so it captures price kinematics after calculating structural levels with `harmonic_levels(...)` and pattern alignment with `tri_star(...)`. The snippet below slots into the analytics pipeline once you have:

1. Loaded a pandas `DataFrame` with recent OHLCV history.
2. Calculated `levels = harmonic_levels(df, ...)`.
3. Estimated `tri_score, comps, tau_star = tri_star(df, ...)`.

With those inputs you can derive velocity/acceleration z-scores, enforce driver confirmation, and emit a ready-to-trade signal dictionary.

```python
import os
from typing import Optional

import pandas as pd

K_WIN = int(os.getenv("RADAR_VEL_WIN", "3"))  # minutes for v_t
V_Z = float(os.getenv("RADAR_V_Z", "1.5"))
A_Z = float(os.getenv("RADAR_A_Z", "1.0"))
BASELINE_T = 240  # historical samples for baseline
BASELINE_GAP = 60  # samples to skip between live window and baseline


def vel_accel_zscores(
    df: pd.DataFrame,
    T: int = BASELINE_T,
    gap: int = BASELINE_GAP,
    k: int = K_WIN,
) -> tuple[float, float]:
    """Compute velocity and acceleration z-scores for the most recent bar."""
    px = df["close"]
    v = px.pct_change(k)
    a = v.diff()
    base = df.iloc[-(T + gap) : -gap]
    vb = base["close"].pct_change(k)
    ab = vb.diff()
    zv = (v.iloc[-1] - vb.mean()) / (vb.std() if vb.std() > 1e-9 else 1e-9)
    za = (a.iloc[-1] - ab.mean()) / (ab.std() if ab.std() > 1e-9 else 1e-9)
    return float(zv), float(za)


def v90_d100_signal(
    df: pd.DataFrame,
    levels: dict[str, float],
    tri_score: float,
    comps: dict[str, float],
    tau_star: float,
) -> Optional[dict[str, float]]:
    """Emit a V90/D100 continuation signal when kinematics, drivers, and τ align."""
    A90 = levels["ang_90"]
    FTR = (10.0 / 9.0) * A90
    price = df["close"].iloc[-1]
    if price < A90 or price < FTR:
        return None  # price not yet in the harmonic band

    zv, za = vel_accel_zscores(df)

    # Require at least two affirmative macro drivers (volume, open interest, fundamentals)
    drivers_up = sum(1 for key in ("vol", "oi", "fund") if comps.get(key, 0.0) > 0.0)
    tri_ok = tri_score >= 2.5 and drivers_up >= 2

    # τ-star gating: allow positive skew or tightly bounded negative skew
    tau_ok = tau_star >= 0 or abs(tau_star) <= 2

    if zv >= V_Z and za >= A_Z and tri_ok and tau_ok:
        return {
            "A90": A90,
            "FTR": FTR,
            "price": price,
            "zv": zv,
            "za": za,
            "tau": tau_star,
        }

    return None
```

### How to use the signal helper

1. Update your notebook to call `v90_d100_signal(df, levels, tri_score, comps, tau_star)` immediately after the `tri_star(...)` step.
2. If the return value is a dictionary, surface it in your dashboard (e.g., append to an alerts table or push a notification).
3. Tune the environment variables to match your desk’s preferred sensitivity:
   - `RADAR_VEL_WIN` controls the lookback for the velocity delta.
   - `RADAR_V_Z` and `RADAR_A_Z` set the minimum z-scores required for a trigger.
4. Consider persisting the velocity/acceleration history for monitoring so you can audit past signals and adjust baselines.

This augmentation keeps the radar lightweight while still layering in motion analysis before you escalate the setup to execution tooling.
