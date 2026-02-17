from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

REGIME_JSON = Path("daily_overlay_regime.json")
LEVELS_CSV = Path("daily_outputs/levels_latest.csv")
OUTDIR = Path("daily_outputs")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_z(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def atomic_write(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True))
    tmp.replace(path)


def _verify_hash(payload: dict[str, Any]) -> bool:
    claimed = payload.get("hash_sha256")
    if not claimed:
        return False
    copy = dict(payload)
    copy.pop("hash_sha256", None)
    actual = hashlib.sha256(json.dumps(copy, sort_keys=True).encode("utf-8")).hexdigest()
    return actual == claimed


def _ensure_not_expired(regime: dict[str, Any], now: datetime) -> None:
    expiry = datetime.fromisoformat(regime["regime_expiry_utc"].replace("Z", "+00:00"))
    if now >= expiry:
        raise ValueError("REGIME_EXPIRED_FAIL_CLOSED")


def day_sheet_writer() -> Path:
    if not REGIME_JSON.exists():
        raise FileNotFoundError("REGIME_MISSING_FAIL_CLOSED")
    if not LEVELS_CSV.exists():
        raise FileNotFoundError("LEVELS_MISSING_FAIL_CLOSED")

    regime = json.loads(REGIME_JSON.read_text())
    now = utc_now()

    if not _verify_hash(regime):
        raise ValueError("REGIME_HASH_INVALID_FAIL_CLOSED")
    _ensure_not_expired(regime, now)

    levels = pd.read_csv(LEVELS_CSV)

    expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)
    sheet: dict[str, Any] = {
        "schema_version": "daysheet.v1",
        "generated_utc": iso_z(now),
        "expiry_utc": iso_z(expiry),
        "regime": {
            "favorable": bool(regime.get("regime_favorable", False)),
            "structural_weight": int(regime.get("structural_weight", 0)),
            "max_gain_factor": float(regime.get("max_gain_factor", 0.5)),
            "risk_level_bias": regime.get("risk_level_bias", "NEUTRAL"),
            "tau_status": regime.get("tau_status", "NO_EDGE"),
            "tap_p_value": float(regime.get("tap_p_value", 1.0)),
        },
        "levels": levels.to_dict(orient="records"),
        "action_rules": {
            "observe_sigma": 1.5,
            "scale_up_sigma": 2.5,
            "circuit_breakers": {"tri_abs_sigma": 6.0, "channel_z_sigma": 8.0},
            "daily_loss_shutdown": 3.0,
            "invalidation_logic": "CI_EXCLUDES_ZERO AND p<0.05 AND regime_favorable",
        },
    }

    sheet["hash_sha256"] = hashlib.sha256(
        json.dumps(sheet, sort_keys=True).encode("utf-8")
    ).hexdigest()

    OUTDIR.mkdir(parents=True, exist_ok=True)
    out = OUTDIR / f"day_sheet_{now.strftime('%Y%m%d')}.json"
    atomic_write(out, sheet)
    print(f"wrote {out}")
    return out


if __name__ == "__main__":
    day_sheet_writer()
