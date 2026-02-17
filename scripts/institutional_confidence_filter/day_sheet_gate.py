from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DAY_SHEET_DIR = Path("daily_outputs")


def _verify_hash(payload: dict[str, Any]) -> bool:
    claimed = payload.get("hash_sha256")
    if not claimed:
        return False
    tmp = dict(payload)
    tmp.pop("hash_sha256", None)
    actual = hashlib.sha256(json.dumps(tmp, sort_keys=True).encode("utf-8")).hexdigest()
    return actual == claimed


def read_day_sheet() -> tuple[bool, int, str]:
    now = datetime.now(timezone.utc)
    path = DAY_SHEET_DIR / f"day_sheet_{now.strftime('%Y%m%d')}.json"
    if not path.exists():
        return False, 75, "NO_SHEET"

    payload = json.loads(path.read_text())

    if not _verify_hash(payload):
        return False, 75, "HASH_INVALID"

    expiry = datetime.fromisoformat(payload["expiry_utc"].replace("Z", "+00:00"))
    if now > expiry:
        return False, 75, "EXPIRED"

    regime = payload.get("regime", {})
    favorable = bool(regime.get("favorable", False))
    weight = int(regime.get("structural_weight", 75))
    return favorable, weight, "VALID"


if __name__ == "__main__":
    regime_ok, structural_weight, status = read_day_sheet()
    print(
        json.dumps(
            {
                "regime_ok": regime_ok,
                "structural_weight": structural_weight,
                "status": status,
            },
            sort_keys=True,
        )
    )
