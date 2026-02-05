#!/usr/bin/env python3
"""
Sign a text file and emit StagePort `signature.json`.

Usage:
  python tools/sign_text.py \
    --text examples/text.txt \
    --priv keys/avc-stageport-v0_private_key.pem \
    --pubid avc-stageport-v0 \
    --out examples/signature.json \
    --session SESSION-001 \
    --cadence-hash <hex> \
    --refusal-state <optional>

Notes:
- If refusal_state is set, we still emit a record, but mark verification_level accordingly.
- cadence_hash is required for deterministic binding. If you don't have cadence yet, use:
  --cadence-hash 00...00 (64 hex chars) AND set --refusal-state REFUSE_NO_CADENCE
"""

import argparse
import base64
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def compute_binding_hash(content_hash_hex: str, cadence_hash_hex: str, session_id: str) -> str:
    blob = (content_hash_hex + cadence_hash_hex + session_id).encode("utf-8")
    return sha256_bytes(blob)


def sign_binding_hash(private_key_pem: bytes, binding_hash_hex: str) -> str:
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)
    sig = private_key.sign(
        bytes.fromhex(binding_hash_hex),
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )
    return base64.b64encode(sig).decode("ascii")


def verification_level_for(refusal_state: str | None) -> str:
    # v0 rule: any refusal means "D" (no certification). You can refine later.
    return "D" if refusal_state else "A"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--priv", required=True)
    ap.add_argument("--pubid", required=True, help="Public key identifier (string label)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--session", required=True)
    ap.add_argument("--cadence-hash", required=True, help="64 hex chars (sha256)")
    ap.add_argument("--refusal-state", default=None)
    ap.add_argument("--notes", default=None)
    args = ap.parse_args()

    text_path = Path(args.text)
    out_path = Path(args.out)
    priv_path = Path(args.priv)

    text_bytes = text_path.read_bytes()
    content_hash = sha256_bytes(text_bytes)

    cadence_hash = args.cadence_hash.lower().strip()
    if len(cadence_hash) != 64 or any(c not in "0123456789abcdef" for c in cadence_hash):
        raise SystemExit("cadence-hash must be 64 hex chars (sha256).")

    binding_hash = compute_binding_hash(content_hash, cadence_hash, args.session)
    signature_b64 = sign_binding_hash(priv_path.read_bytes(), binding_hash)

    refusal_state = args.refusal_state if args.refusal_state else None
    level = verification_level_for(refusal_state)

    payload = {
        "schema_version": "0.1",
        "session_id": args.session,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "content_hash": content_hash,
        "cadence_hash": cadence_hash,
        "binding_hash": binding_hash,
        "public_key_id": args.pubid,
        "signature": signature_b64,
        "verification_level": level,
        "refusal_state": refusal_state,
        "notes": args.notes,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {out_path}")
    print(f"verification_level={level} refusal_state={refusal_state}")


if __name__ == "__main__":
    main()
