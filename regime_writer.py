import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

# --- CONFIG ---
DAILY_OUTDIR = Path("daily_outputs")
TAU_CSV = DAILY_OUTDIR / "tau_analysis_latest.csv"  # tau, ci_lower, ci_upper, p_value
STRUCTURAL_CSV = DAILY_OUTDIR / "structural_ledger_latest.csv"  # event_date, weight, proximity_days
REGIME_JSON = Path("daily_overlay_regime.json")

# Policy knobs
PROX_WINDOW_DAYS = 7
STRUCT_THRESHOLD = 80
PV_THRESHOLD = 0.05
FALLBACK_TAP_WEIGHT = 75


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _safe_float(value: Any, default: float | None = None) -> float | None:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def _atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def compute_regime() -> dict[str, Any]:
    # Defaults (fail-closed posture)
    tau = None
    ci_lower = None
    ci_upper = None
    p_value = 1.0
    tau_significant = False

    struct_confirmed = False
    tap_weight = FALLBACK_TAP_WEIGHT

    # Load tau stats
    if TAU_CSV.exists():
        tau_df = pd.read_csv(TAU_CSV)
        if len(tau_df) > 0:
            row0 = tau_df.iloc[0]
            tau = _safe_float(row0.get("tau"), None)
            ci_lower = _safe_float(row0.get("ci_lower"), None)
            ci_upper = _safe_float(row0.get("ci_upper"), None)
            p_value = _safe_float(row0.get("p_value"), 1.0) or 1.0

            ci_excludes_zero = (
                ci_lower is not None
                and ci_upper is not None
                and ((ci_lower > 0 and ci_upper > 0) or (ci_lower < 0 and ci_upper < 0))
            )
            tau_significant = bool(ci_excludes_zero and (p_value < PV_THRESHOLD))

    # Load structural ledger
    if STRUCTURAL_CSV.exists():
        struct_df = pd.read_csv(STRUCTURAL_CSV)
        if (
            len(struct_df) > 0
            and "proximity_days" in struct_df.columns
            and "weight" in struct_df.columns
        ):
            struct_df["proximity_days"] = pd.to_numeric(struct_df["proximity_days"], errors="coerce")
            struct_df["weight"] = pd.to_numeric(struct_df["weight"], errors="coerce")

            recent = struct_df[struct_df["proximity_days"].abs() <= PROX_WINDOW_DAYS]
            if len(recent) > 0:
                max_w = recent["weight"].max(skipna=True)
                if max_w is not None and pd.notna(max_w):
                    tap_weight = int(max_w)
                    struct_confirmed = tap_weight >= STRUCT_THRESHOLD

    now = _utc_now()
    expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)

    regime_favorable = bool(struct_confirmed and tau_significant)

    payload: dict[str, Any] = {
        "schema_version": "regime.v1",
        "last_update_utc": now.isoformat().replace("+00:00", "Z"),
        "regime_expiry_utc": expiry.isoformat().replace("+00:00", "Z"),
        "regime_favorable": regime_favorable,
        "struct_confirmed": bool(struct_confirmed),
        "tau_ci_excludes_zero": bool(tau_significant),
        "tap_p_value": float(p_value),
        "structural_weight": int(tap_weight),
        "max_gain_factor": float(0.5 + 0.5 * (tap_weight / 100.0)),
        "tau": tau,
        "ci_lower": ci_lower,
        "ci_upper": ci_upper,
        "tau_status": "CI_EXCLUDES_ZERO" if tau_significant else "NO_EDGE",
        "risk_level_bias": "LONG_BIAS" if regime_favorable else "NEUTRAL",
    }

    hashable = json.dumps(payload, sort_keys=True).encode("utf-8")
    payload["hash_sha256"] = hashlib.sha256(hashable).hexdigest()

    _atomic_write_json(REGIME_JSON, payload)

    print(
        f"✅ REGIME WRITTEN | favorable={payload['regime_favorable']} "
        f"| tap={payload['structural_weight']} "
        f"| p={payload['tap_p_value']:.4f} "
        f"| bias={payload['risk_level_bias']}"
    )

    return payload


if __name__ == "__main__":
    compute_regime()
