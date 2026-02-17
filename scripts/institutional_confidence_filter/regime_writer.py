from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

TAU_JSON = Path("daily_outputs/tau_analysis_latest.json")
STRUCT_CSV = Path("daily_outputs/structural_latest.csv")
OUT_PATH = Path("daily_overlay_regime.json")
PV_THRESHOLD = 0.05
STRUCT_THRESHOLD = 80


@dataclass(frozen=True)
class RegimeComputation:
    regime_favorable: bool
    struct_confirmed: bool
    tau_ci_excludes_zero: bool
    tap_p_value: float
    structural_weight: int
    max_gain_factor: float
    risk_level_bias: str
    tau_status: str


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_z(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True))
    tmp.replace(path)


def _safe_num(value: Any, default: float) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def compute_regime(tau_payload: dict[str, Any], structural_weight: int) -> RegimeComputation:
    p_value = _safe_num(tau_payload.get("p_value"), 1.0)
    ci_lower = _safe_num(tau_payload.get("ci_lower"), 0.0)
    ci_upper = _safe_num(tau_payload.get("ci_upper"), 0.0)

    ci_excludes_zero = (ci_lower > 0 and ci_upper > 0) or (ci_lower < 0 and ci_upper < 0)
    tau_significant = bool(ci_excludes_zero and (p_value < PV_THRESHOLD))

    struct_confirmed = structural_weight >= STRUCT_THRESHOLD
    favorable = bool(tau_significant and struct_confirmed)

    if ci_excludes_zero:
        tau_status = "CI_EXCLUDES_ZERO"
    else:
        tau_status = "CI_INCLUDES_ZERO"

    risk_level_bias = "LONG_BIAS" if favorable else "NEUTRAL"
    max_gain_factor = 0.96 if favorable else 0.5

    return RegimeComputation(
        regime_favorable=favorable,
        struct_confirmed=struct_confirmed,
        tau_ci_excludes_zero=ci_excludes_zero,
        tap_p_value=p_value,
        structural_weight=structural_weight,
        max_gain_factor=max_gain_factor,
        risk_level_bias=risk_level_bias,
        tau_status=tau_status,
    )


def load_structural_weight() -> int:
    if not STRUCT_CSV.exists():
        return 0
    lines = STRUCT_CSV.read_text().splitlines()
    if len(lines) < 2:
        return 0

    headers = [h.strip() for h in lines[0].split(",")]
    first = [v.strip() for v in lines[1].split(",")]
    mapping = dict(zip(headers, first))
    return int(_safe_num(mapping.get("weight"), 0.0))


def main() -> None:
    now = utc_now()
    expiry = (now + timedelta(hours=24)).replace(hour=0, minute=0, second=0, microsecond=0)

    tau_payload: dict[str, Any] = {}
    if TAU_JSON.exists():
        tau_payload = json.loads(TAU_JSON.read_text())

    structural_weight = load_structural_weight()
    result = compute_regime(tau_payload, structural_weight)

    payload = {
        "schema_version": "regime.v1",
        "last_update_utc": iso_z(now),
        "regime_expiry_utc": iso_z(expiry),
        "regime_favorable": result.regime_favorable,
        "struct_confirmed": result.struct_confirmed,
        "tau_ci_excludes_zero": result.tau_ci_excludes_zero,
        "tap_p_value": result.tap_p_value,
        "structural_weight": result.structural_weight,
        "max_gain_factor": result.max_gain_factor,
        "risk_level_bias": result.risk_level_bias,
        "tau_status": result.tau_status,
    }
    payload["hash_sha256"] = hashlib.sha256(
        json.dumps(payload, sort_keys=True).encode("utf-8")
    ).hexdigest()

    atomic_write_json(OUT_PATH, payload)
    print(f"wrote {OUT_PATH} favorable={result.regime_favorable}")


if __name__ == "__main__":
    main()
