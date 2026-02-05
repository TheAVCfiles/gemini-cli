#!/usr/bin/env python3
"""Verify a StagePort signature payload against text content and a public key."""

import argparse
import base64
import hashlib
import json
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def compute_binding_hash(content_hash_hex: str, cadence_hash_hex: str, session_id: str) -> str:
    blob = (content_hash_hex + cadence_hash_hex + session_id).encode("utf-8")
    return sha256_bytes(blob)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--sig", required=True)
    ap.add_argument("--pub", required=True)
    args = ap.parse_args()

    text_bytes = Path(args.text).read_bytes()
    payload = json.loads(Path(args.sig).read_text(encoding="utf-8"))

    content_hash = sha256_bytes(text_bytes)
    if content_hash != payload.get("content_hash"):
        raise SystemExit("FAIL: content_hash mismatch")

    cadence_hash = payload.get("cadence_hash")
    session_id = payload.get("session_id")
    if not isinstance(cadence_hash, str) or not isinstance(session_id, str):
        raise SystemExit("FAIL: signature payload missing cadence_hash or session_id")

    binding_hash = compute_binding_hash(content_hash, cadence_hash, session_id)
    if binding_hash != payload.get("binding_hash"):
        raise SystemExit("FAIL: binding_hash mismatch")

    signature = base64.b64decode(payload["signature"])
    public_key = serialization.load_pem_public_key(Path(args.pub).read_bytes())

    try:
        public_key.verify(
            signature,
            bytes.fromhex(binding_hash),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
    except InvalidSignature as exc:
        raise SystemExit("FAIL: invalid signature") from exc

    level = payload.get("verification_level")
    refusal = payload.get("refusal_state")
    print("PASS")
    print(f"verification_level={level} refusal_state={refusal}")


if __name__ == "__main__":
    main()
