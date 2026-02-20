import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REGIME_JSON = Path("daily_overlay_regime.json")


def _parse_z(iso_z: str) -> datetime:
    return datetime.fromisoformat(iso_z.replace("Z", "+00:00"))


def read_regime_gate(fallback_tap_weight: int = 75) -> tuple[bool, int, dict[str, Any] | None]:
    """Read regime gate from disk with expiry/hash validation.

    Returns (regime_favorable, tap_weight, payload_or_none).
    """
    if not REGIME_JSON.exists():
        return False, fallback_tap_weight, None

    try:
        payload = json.loads(REGIME_JSON.read_text(encoding="utf-8"))

        required = [
            "schema_version",
            "last_update_utc",
            "regime_expiry_utc",
            "regime_favorable",
            "max_gain_factor",
            "structural_weight",
            "tap_p_value",
            "risk_level_bias",
            "hash_sha256",
        ]
        if not all(k in payload for k in required):
            return False, fallback_tap_weight, None

        now = datetime.now(timezone.utc)
        if now >= _parse_z(payload["regime_expiry_utc"]):
            return False, fallback_tap_weight, None

        claimed_hash = payload["hash_sha256"]
        verify_payload = dict(payload)
        verify_payload.pop("hash_sha256", None)
        actual_hash = hashlib.sha256(
            json.dumps(verify_payload, sort_keys=True).encode("utf-8")
        ).hexdigest()
        if actual_hash != claimed_hash:
            return False, fallback_tap_weight, None

        if float(payload["tap_p_value"]) >= 0.05:
            return False, int(payload["structural_weight"]), payload

        return bool(payload["regime_favorable"]), int(payload["structural_weight"]), payload
    except Exception:
        return False, fallback_tap_weight, None
