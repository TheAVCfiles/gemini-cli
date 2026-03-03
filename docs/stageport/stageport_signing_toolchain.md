# StagePort Signing Toolchain (v0.1)

This guide documents the local signing workflow for StagePort artifact proofs.

## Scripts

- `tools/keygen.py` — Generates RSA keypairs (`private_key.pem` + `public_key.pem`).
- `tools/sign_text.py` — Mints a StagePort-style `<artifact>.signature.json` bundle from text input.

## Quick start

```bash
python tools/keygen.py
printf "I agree to the Founding Faculty Covenant.\n" > covenant.txt
python tools/sign_text.py --text covenant.txt --key private_key.pem
python tools/sign_text.py --text covenant.txt --key private_key.pem --refuse
```

## Output schema

Each generated `*.signature.json` includes:

- `session_id`
- `created_at`
- `content_hash`
- `cadence_hash` (mock cadence in v0.1)
- `binding_hash`
- `public_key_id`
- `signature` (base64)
- `verification_level`
- `refusal_state`
- `notes`

## Notes

- The cadence stream is intentionally mocked in v0.1 (`mock_cadence_v0.1_timing_data`).
- Use `--refuse` to generate refusal-state payloads for UI and verifier-path testing.
