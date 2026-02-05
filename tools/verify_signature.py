#!/usr/bin/env python3
"""
StagePort Cadence Signature Verifier (v0)

Usage:
  python tools/verify_signature.py --text path/to/text.txt --sig path/to/signature.json --pub path/to/public_key.pem

Notes:
- Verifies cryptographic signature over binding_hash
- Recomputes content_hash from provided text file
- Does NOT require cadence features; uses cadence_hash already in signature.json
"""

import argparse
import base64
import hashlib
import json
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def compute_binding_hash(content_hash_hex: str, cadence_hash_hex: str, session_id: str) -> str:
    blob = (content_hash_hex + cadence_hash_hex + session_id).encode("utf-8")
    return sha256_bytes(blob)


def verify_signature(pubkey_pem: bytes, binding_hash_hex: str, signature_b64: str) -> bool:
    public_key = serialization.load_pem_public_key(pubkey_pem)
    sig = base64.b64decode(signature_b64)
    try:
        public_key.verify(
            sig,
            bytes.fromhex(binding_hash_hex),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--sig", required=True)
    ap.add_argument("--pub", required=True)
    args = ap.parse_args()

    text_path = Path(args.text)
    sig_path = Path(args.sig)
    pub_path = Path(args.pub)

    sigj = load_json(sig_path)
    text_bytes = text_path.read_bytes()

    computed_content_hash = sha256_bytes(text_bytes)
    claimed_content_hash = sigj.get("content_hash")
    cadence_hash = sigj.get("cadence_hash")
    session_id = sigj.get("session_id")
    claimed_binding_hash = sigj.get("binding_hash")
    signature_b64 = sigj.get("signature")
    refusal_state = sigj.get("refusal_state")
    level = sigj.get("verification_level")

    problems = []

    if claimed_content_hash and computed_content_hash != claimed_content_hash:
        problems.append("content_hash_mismatch")

    computed_binding_hash = compute_binding_hash(computed_content_hash, cadence_hash, session_id)
    if claimed_binding_hash and computed_binding_hash != claimed_binding_hash:
        problems.append("binding_hash_mismatch")

    pub_pem = pub_path.read_bytes()
    ok_sig = verify_signature(pub_pem, computed_binding_hash, signature_b64)
    if not ok_sig:
        problems.append("signature_invalid")

    print("\n== StagePort Cadence Signature Verify (v0) ==")
    print(f"text: {text_path}")
    print(f"sig : {sig_path}")
    print(f"pub : {pub_path}")
    print(f"level: {level}")
    print(f"refusal_state: {refusal_state}")
    print(f"content_hash (computed): {computed_content_hash}")
    print(f"binding_hash (computed): {computed_binding_hash}")

    if problems:
        print("\nRESULT: FAIL")
        print("Problems:", ", ".join(problems))
        return 1

    print("\nRESULT: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
