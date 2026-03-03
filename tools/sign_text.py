"""Sign text artifacts into StagePort-compatible signature bundles."""

import argparse
import base64
import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def sha256_bytes(data: bytes) -> str:
    """Return the hex-encoded SHA-256 digest for bytes."""
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="StagePort Signer v0.1")
    parser.add_argument("--text", required=True, help="Path to text file to sign")
    parser.add_argument("--key", default="private_key.pem", help="Path to private key PEM")
    parser.add_argument(
        "--refuse",
        action="store_true",
        help="Force a refusal state (e.g., for paste/no-cadence simulation)",
    )
    args = parser.parse_args()

    text_path = Path(args.text)
    text_bytes = text_path.read_bytes()

    with open(args.key, "rb") as key_file:
        private_key = serialization.load_pem_private_key(key_file.read(), password=None)

    content_hash = sha256_bytes(text_bytes)

    # Placeholder cadence stream for v0.1; replace with captured telemetry in v0.2.
    cadence_vector = b"mock_cadence_v0.1_timing_data"
    cadence_hash = sha256_bytes(cadence_vector)

    session_id = str(uuid.uuid4())
    verification_level = "D" if args.refuse else "A"
    refusal_state = "REFUSE_NO_CADENCE" if args.refuse else None

    binding_blob = (content_hash + cadence_hash + session_id).encode("utf-8")
    binding_hash = sha256_bytes(binding_blob)

    signature = private_key.sign(
        bytes.fromhex(binding_hash),
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )

    payload = {
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "content_hash": content_hash,
        "cadence_hash": cadence_hash,
        "binding_hash": binding_hash,
        "public_key_id": "steward_key_01",
        "signature": base64.b64encode(signature).decode("utf-8"),
        "verification_level": verification_level,
        "refusal_state": refusal_state,
        "notes": "Generated via StagePort CLI v0.1",
    }

    output_path = text_path.with_suffix(".signature.json")
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"Successfully minted signature for {text_path.name}")
    print(f"Verification Level: {verification_level}")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    main()
