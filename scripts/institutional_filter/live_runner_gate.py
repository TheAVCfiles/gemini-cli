#!/usr/bin/env python3
"""Fail-closed Day Sheet reader for execution engines."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def _verify_hash(payload: dict) -> bool:
    claimed = payload.get("hash_sha256")
    if not claimed:
        return False
    copy = dict(payload)
    copy.pop("hash_sha256", None)
    actual = hashlib.sha256(json.dumps(copy, sort_keys=True).encode("utf-8")).hexdigest()
    return actual == claimed


def read_day_sheet(path: Path | None = None) -> tuple[bool, int, str]:
    now = datetime.now(timezone.utc)
    if path is None:
        path = Path("daily_outputs") / f"day_sheet_{now.strftime('%Y%m%d')}.json"

    if not path.exists():
        return False, 75, "NO_SHEET"

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False, 75, "JSON_INVALID"

    expiry_raw = payload.get("expiry_utc")
    if not expiry_raw:
        return False, 75, "MISSING_EXPIRY"

    try:
        expiry = datetime.fromisoformat(expiry_raw.replace("Z", "+00:00"))
    except ValueError:
        return False, 75, "BAD_EXPIRY"

    if now >= expiry:
        return False, 75, "EXPIRED"

    if not _verify_hash(payload):
        return False, 75, "HASH_MISMATCH"

    regime = payload.get("regime", {})
    favorable = bool(regime.get("favorable", False))
    weight = int(regime.get("structural_weight", 75))
    return favorable, weight, "VALID"


if __name__ == "__main__":
    ok, w, status = read_day_sheet()
    print({"regime_ok": ok, "structural_weight": w, "status": status})
