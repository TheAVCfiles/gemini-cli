# Issue #1: v0 Cadence Capture + Signature JSON (REFUSE states included)

## Objective
Implement v0 of Cadence Signature:
- capture cadence features (local)
- bind cadence to content hash
- sign binding hash
- emit `signature.json`
- refuse when provenance is weak (paste / too short / noisy)

## Deliverables
### A) `signature.json` schema (must)
Fields:
- session_id
- created_at (ISO8601)
- content_hash (sha256)
- cadence_hash (sha256 of serialized feature vector)
- binding_hash (sha256(content_hash || cadence_hash || session_id))
- public_key_id
- signature (base64)
- verification_level (A/B/C/D)
- refusal_state (nullable)
- notes (optional)

### B) v0 verifier tool (must)
`tools/verify_signature.py`:
- input: text file + signature.json + public key
- output: PASS/FAIL + computed hashes + level + refusal state

### C) Refusal states (must)
- REFUSE_NO_CADENCE (paste detected OR < N keystrokes)
- REFUSE_LOW_CONFIDENCE (noise too high OR sample too short)
- REFUSE_POLICY (opt-out / unsafe context)

## Acceptance criteria
- [ ] Given normal typed input: emits `signature.json` with verification_level=A and refusal_state=null
- [ ] Given pasted input: emits refusal_state=REFUSE_NO_CADENCE and verification_level=D
- [ ] `verify_signature.py` returns PASS for a valid bundle (text + signature.json + pubkey)
- [ ] `verify_signature.py` returns FAIL if text changes by 1 character
- [ ] No raw keystroke logs stored by default (feature vector only)
- [ ] All outputs deterministic for a given (text, cadence features, session_id)

## Notes / Non-negotiables
- No silent rewrites: bump version field if schema changes.
- Keep privacy: do not store literal keystrokes unless in explicit audit mode.
