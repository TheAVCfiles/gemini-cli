#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

REGIME_JSON = Path("daily_overlay_regime.json")
LEVELS_CSV = Path("daily_outputs") / "levels_latest.csv"
OUTDIR = Path("daily_outputs")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_z(ts: datetime) -> str:
    return ts.isoformat().replace("+00:00", "Z")


def atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def compute_pivot_bands(high: float, low: float, close: float) -> dict:
    pivot = (high + low + close) / 3
    r1 = (2 * pivot) - low
    s1 = (2 * pivot) - high
    r2 = pivot + (high - low)
    s2 = pivot - (high - low)
    atr_est = (high - low) * 0.5
    return {
        "pivot": round(pivot, 2),
        "s1": round(s1, 2),
        "s2": round(s2, 2),
        "r1": round(r1, 2),
        "r2": round(r2, 2),
        "atr_band_low": round(close - atr_est, 2),
        "atr_band_high": round(close + atr_est, 2),
        "invalidation": round(s2 * 0.99, 2),
    }


def verify_regime_or_fail(regime: dict, now: datetime) -> dict:
    expiry = regime.get("regime_expiry_utc")
    if not expiry:
        raise ValueError("🚨 REGIME INVALID — missing expiry")
    if now >= datetime.fromisoformat(expiry.replace("Z", "+00:00")):
        raise ValueError("🚨 REGIME EXPIRED — FAIL CLOSED")

    claimed = regime.get("hash_sha256")
    if not claimed:
        raise ValueError("🚨 REGIME INVALID — missing hash")
    copy = dict(regime)
    copy.pop("hash_sha256", None)
    actual = hashlib.sha256(json.dumps(copy, sort_keys=True).encode("utf-8")).hexdigest()
    if actual != claimed:
        raise ValueError("🚨 REGIME CORRUPTION — hash mismatch")
    return regime


def load_levels(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError("🚨 LEVELS CSV INVALID — no headers")
        required = {"symbol", "high", "low", "close"}
        missing = required - set(reader.fieldnames)
        if missing:
            raise ValueError(f"🚨 LEVELS CSV INVALID — missing columns: {sorted(missing)}")

        out = []
        for row in reader:
            high = float(row["high"])
            low = float(row["low"])
            close = float(row["close"])
            level = compute_pivot_bands(high, low, close)
            level.update({"symbol": row["symbol"], "last_close": close})
            out.append(level)
        return out


def day_sheet_writer() -> Path:
    now = utc_now()
    if not REGIME_JSON.exists():
        raise FileNotFoundError("🚨 REGIME MISSING — FAIL CLOSED")
    regime = verify_regime_or_fail(json.loads(REGIME_JSON.read_text(encoding="utf-8")), now)

    if not LEVELS_CSV.exists():
        raise FileNotFoundError("🚨 LEVELS CSV MISSING")
    levels = load_levels(LEVELS_CSV)

    expiry = (now + timedelta(hours=24)).replace(minute=0, second=0, microsecond=0)
    sheet = {
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
        "levels": levels,
        "action_rules": {
            "observe_sigma": 1.5,
            "scale_up_sigma": 2.5,
            "circuit_breakers": {"tri_abs_sigma": 6.0, "channel_z_sigma": 8.0},
            "daily_loss_shutdown": 3.0,
            "invalidation_logic": "CI_EXCLUDES_ZERO AND p<0.05 AND regime_favorable",
        },
    }
    sheet["hash_sha256"] = hashlib.sha256(json.dumps(sheet, sort_keys=True).encode("utf-8")).hexdigest()

    out = OUTDIR / f"day_sheet_{now.strftime('%Y%m%d')}.json"
    atomic_write(out, sheet)
    print(f"✅ DAY SHEET WRITTEN: {out}")
    return out


if __name__ == "__main__":
    day_sheet_writer()
