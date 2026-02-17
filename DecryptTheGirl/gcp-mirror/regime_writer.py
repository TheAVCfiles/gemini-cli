"""Institutional regime writer with fail-closed controls and atomic output.

Inputs (from daily pipeline):
- out/backtest_overlay_results.csv
- out/tau_star_summary.csv
- out/event_study_permutation_summary.csv

Output:
- out/daily_overlay_regime.json
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

OUTPUT_DIR = Path("out")
OVERLAY_CSV = OUTPUT_DIR / "backtest_overlay_results.csv"
TAU_CSV = OUTPUT_DIR / "tau_star_summary.csv"
PERM_CSV = OUTPUT_DIR / "event_study_permutation_summary.csv"
REGIME_FILE = OUTPUT_DIR / "daily_overlay_regime.json"
TEMP_FILE = OUTPUT_DIR / "daily_overlay_regime.json.tmp"

STRUCT_THRESHOLD = 80
PV_THRESHOLD = 0.05
FALLBACK_WEIGHT = 75


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _safe_float(value: Any, default: float | None = None) -> float | None:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_weight_from_confirmation(df_overlay: pd.DataFrame) -> tuple[int, bool]:
    if "Confirmation_Type" not in df_overlay.columns or df_overlay.empty:
        return FALLBACK_WEIGHT, False

    values = df_overlay["Confirmation_Type"].astype(str)
    confirmed = values[values.str.contains("STRUCTURAL_CONFIRMED_W", na=False)]
    if confirmed.empty:
        return FALLBACK_WEIGHT, False

    weights: list[int] = []
    for item in confirmed:
        match = re.search(r"W=(\d+)", item)
        if match:
            weights.append(int(match.group(1)))

    if not weights:
        return FALLBACK_WEIGHT, False

    max_weight = max(weights)
    return max_weight, max_weight >= STRUCT_THRESHOLD


def _ci_excludes_zero(ci_lower: float | None, ci_upper: float | None) -> bool:
    return bool(
        ci_lower is not None
        and ci_upper is not None
        and ((ci_lower > 0 and ci_upper > 0) or (ci_lower < 0 and ci_upper < 0))
    )


def check_ci_status(df_tau: pd.DataFrame) -> tuple[bool, float | None, float | None]:
    if df_tau.empty:
        return False, None, None

    row = df_tau.iloc[0]
    ci_lower = _safe_float(row.get("ci_lower"), None)
    ci_upper = _safe_float(row.get("ci_upper"), None)

    strict_sign_ok = _ci_excludes_zero(ci_lower, ci_upper)

    # Optional compatibility with existing pipelines that also carry ci_status text.
    status_ok = False
    if "ci_status" in df_tau.columns:
        status_ok = str(row.get("ci_status", "")).strip().lower() == "excludes 0"

    return bool(strict_sign_ok and (status_ok or "ci_status" not in df_tau.columns)), ci_lower, ci_upper


def get_best_p_value(df_perm: pd.DataFrame) -> float:
    if df_perm.empty or "p_value" not in df_perm.columns:
        return 1.0

    p_values = pd.to_numeric(df_perm["p_value"], errors="coerce").dropna()
    if p_values.empty:
        return 1.0

    return float(p_values.min())


def _hash_payload(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _atomic_write_json(path: Path, tmp_path: Path, payload: dict[str, Any]) -> None:
    tmp_path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    tmp_path.replace(path)


def write_regime_file() -> dict[str, Any]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        df_overlay = pd.read_csv(OVERLAY_CSV)
        df_tau = pd.read_csv(TAU_CSV)
        df_perm = pd.read_csv(PERM_CSV)
    except FileNotFoundError:
        # Fail-closed payload on missing input artifacts.
        now = _utc_now()
        expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)
        payload = {
            "timestamp": now.isoformat().replace("+00:00", "Z"),
            "regime_expiry_utc": expiry.isoformat().replace("+00:00", "Z"),
            "regime_status": "CLOSED_DEFENSIVE",
            "struct_confirmed": False,
            "tau_ci_excludes_zero": False,
            "tap_p_value": 1.0,
            "tap_weight_max": FALLBACK_WEIGHT,
        }
        payload["hash_sha256"] = _hash_payload(payload)
        _atomic_write_json(REGIME_FILE, TEMP_FILE, payload)
        return payload

    tap_weight, struct_confirmed = parse_weight_from_confirmation(df_overlay)
    tau_ci_excludes_zero, ci_lower, ci_upper = check_ci_status(df_tau)
    best_p_value = get_best_p_value(df_perm)

    is_regime_open = bool(
        struct_confirmed
        and tau_ci_excludes_zero
        and (best_p_value < PV_THRESHOLD)
    )

    now = _utc_now()
    expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)
    payload: dict[str, Any] = {
        "timestamp": now.isoformat().replace("+00:00", "Z"),
        "regime_expiry_utc": expiry.isoformat().replace("+00:00", "Z"),
        "regime_status": "OPEN" if is_regime_open else "CLOSED_DEFENSIVE",
        "struct_confirmed": bool(struct_confirmed),
        "tau_ci_excludes_zero": bool(tau_ci_excludes_zero),
        "tap_p_value": float(best_p_value),
        "tap_weight_max": int(tap_weight),
        "ci_lower": ci_lower,
        "ci_upper": ci_upper,
    }

    payload["hash_sha256"] = _hash_payload(payload)
    _atomic_write_json(REGIME_FILE, TEMP_FILE, payload)
    return payload


if __name__ == "__main__":
    result = write_regime_file()
    print(
        "✅ REGIME WRITER SUCCESS "
        f"| status={result['regime_status']} "
        f"| p={result['tap_p_value']:.3f} "
        f"| weight={result['tap_weight_max']}"
    )
