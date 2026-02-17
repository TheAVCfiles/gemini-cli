"""Fail-closed runtime readers for regime/day-sheet artifacts."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REGIME_FILE = Path("out") / "daily_overlay_regime.json"


def _parse_z(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _hash_payload(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _verify_hash(payload: dict[str, Any]) -> bool:
    claimed = payload.get("hash_sha256")
    if not isinstance(claimed, str):
        return False
    copy_payload = dict(payload)
    copy_payload.pop("hash_sha256", None)
    return _hash_payload(copy_payload) == claimed


def read_regime_gate(fallback_weight: int = 75) -> tuple[bool, int, dict[str, Any] | None]:
    if not REGIME_FILE.exists():
        return False, fallback_weight, None

    payload = json.loads(REGIME_FILE.read_text(encoding="utf-8"))
    required = {
        "timestamp",
        "regime_expiry_utc",
        "regime_status",
        "struct_confirmed",
        "tau_ci_excludes_zero",
        "tap_p_value",
        "tap_weight_max",
        "hash_sha256",
    }
    if not required.issubset(payload):
        return False, fallback_weight, None

    if not _verify_hash(payload):
        return False, fallback_weight, None

    if datetime.now(timezone.utc) >= _parse_z(payload["regime_expiry_utc"]):
        return False, fallback_weight, None

    try:
        tap_weight = int(payload["tap_weight_max"])
        p_value = float(payload["tap_p_value"])
    except (TypeError, ValueError):
        return False, fallback_weight, None

    is_open = payload.get("regime_status") == "OPEN"
    if not is_open or p_value >= 0.05:
        return False, tap_weight, payload

    return True, tap_weight, payload
