#!/usr/bin/env python3
"""
Generate an RSA keypair for StagePort signatures.

Usage:
  python tools/keygen.py --outdir keys --key-id avc-stageport-v0

Outputs:
  keys/avc-stageport-v0_private_key.pem
  keys/avc-stageport-v0_public_key.pem
"""

import argparse
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default="keys")
    ap.add_argument("--key-id", required=True)
    args = ap.parse_args()

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    public_key = private_key.public_key()

    priv_path = outdir / f"{args.key_id}_private_key.pem"
    pub_path = outdir / f"{args.key_id}_public_key.pem"

    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    priv_path.write_bytes(priv_pem)
    pub_path.write_bytes(pub_pem)

    print("Wrote:")
    print(f"  {priv_path}")
    print(f"  {pub_path}")


if __name__ == "__main__":
    main()
