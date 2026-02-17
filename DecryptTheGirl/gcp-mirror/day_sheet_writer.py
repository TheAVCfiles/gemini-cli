"""Generate hashed Day Sheet artifact with regime + mechanical levels."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

OUTPUT_DIR = Path("out")
REGIME_JSON = OUTPUT_DIR / "daily_overlay_regime.json"
LEVELS_CSV = OUTPUT_DIR / "levels_latest.csv"

REQUIRED_LEVEL_COLUMNS = {
    "symbol",
    "pivot",
    "s1",
    "s2",
    "r1",
    "r2",
    "atr_band_low",
    "atr_band_high",
    "invalidation",
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_payload(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _atomic_write(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def _verify_hash(payload: dict[str, Any]) -> bool:
    claimed = payload.get("hash_sha256")
    if not isinstance(claimed, str):
        return False
    copy_payload = dict(payload)
    copy_payload.pop("hash_sha256", None)
    return _hash_payload(copy_payload) == claimed


def generate_day_sheet() -> Path:
    if not REGIME_JSON.exists():
        raise FileNotFoundError("Missing out/daily_overlay_regime.json")
    if not LEVELS_CSV.exists():
        raise FileNotFoundError("Missing out/levels_latest.csv")

    regime = json.loads(REGIME_JSON.read_text(encoding="utf-8"))
    if not _verify_hash(regime):
        raise ValueError("Regime hash verification failed")

    now = _utc_now()
    regime_expiry = datetime.fromisoformat(regime["regime_expiry_utc"].replace("Z", "+00:00"))
    if now >= regime_expiry:
        raise ValueError("Regime expired; fail-closed")

    levels = pd.read_csv(LEVELS_CSV)
    missing = REQUIRED_LEVEL_COLUMNS.difference(levels.columns)
    if missing:
        raise ValueError(f"levels_latest.csv missing columns: {sorted(missing)}")

    sheet_expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)
    payload: dict[str, Any] = {
        "schema_version": "daysheet.v1",
        "generated_utc": now.isoformat().replace("+00:00", "Z"),
        "expiry_utc": sheet_expiry.isoformat().replace("+00:00", "Z"),
        "regime": {
            "regime_status": regime.get("regime_status", "CLOSED_DEFENSIVE"),
            "struct_confirmed": bool(regime.get("struct_confirmed", False)),
            "tau_ci_excludes_zero": bool(regime.get("tau_ci_excludes_zero", False)),
            "tap_p_value": float(regime.get("tap_p_value", 1.0)),
            "tap_weight_max": int(regime.get("tap_weight_max", 75)),
        },
        "levels": levels.sort_values("symbol").to_dict(orient="records"),
        "action_rules": {
            "observe_sigma": 1.5,
            "scale_up_sigma": 2.5,
            "circuit": {"tri_sigma": 6.0, "z_sigma": 8.0},
            "loss_shutdown": 3.0,
        },
    }
    payload["hash_sha256"] = _hash_payload(payload)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"day_sheet_{now.strftime('%Y%m%d')}.json"
    _atomic_write(out_path, payload)
    return out_path


if __name__ == "__main__":
    path = generate_day_sheet()
    print(f"✅ DAY SHEET: {path}")
