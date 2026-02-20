import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

REGIME_JSON = Path("daily_overlay_regime.json")
LEVELS_CSV = Path("daily_outputs") / "levels_latest.csv"
OUTDIR = Path("daily_outputs")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def day_sheet_writer() -> Path:
    if not REGIME_JSON.exists():
        raise FileNotFoundError("Missing daily_overlay_regime.json")

    if not LEVELS_CSV.exists():
        raise FileNotFoundError("Missing daily_outputs/levels_latest.csv")

    regime = json.loads(REGIME_JSON.read_text(encoding="utf-8"))
    levels = pd.read_csv(LEVELS_CSV)

    OUTDIR.mkdir(parents=True, exist_ok=True)

    now = _utc_now()
    expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)

    sheet: dict[str, Any] = {
        "schema_version": "daysheet.v1",
        "generated_utc": now.isoformat().replace("+00:00", "Z"),
        "expiry_utc": expiry.isoformat().replace("+00:00", "Z"),
        "regime": {
            "regime_favorable": regime.get("regime_favorable", False),
            "structural_weight": regime.get("structural_weight"),
            "max_gain_factor": regime.get("max_gain_factor"),
            "risk_level_bias": regime.get("risk_level_bias"),
            "tap_p_value": regime.get("tap_p_value"),
            "tau_status": regime.get("tau_status"),
            "hash_sha256": regime.get("hash_sha256"),
        },
        "levels": levels.to_dict(orient="records"),
        "action_rules": {
            "probe_sigma": [1.5, 2.5],
            "scale_up_sigma": 2.5,
            "circuit_breakers": {"tri_abs_sigma": 6.0, "z_abs_sigma": 8.0},
            "daily_loss_shutdown_pct": 3.0,
        },
    }

    sheet["hash_sha256"] = hashlib.sha256(
        json.dumps(sheet, sort_keys=True).encode("utf-8")
    ).hexdigest()

    out_path = OUTDIR / f"day_sheet_{now.strftime('%Y%m%d')}.json"
    _atomic_write_json(out_path, sheet)
    print(f"✅ DAY SHEET WRITTEN: {out_path}")

    return out_path


if __name__ == "__main__":
    day_sheet_writer()
