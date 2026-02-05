# StagePort

**StagePort: memory with governance.**

StagePort is a provenance-first writing and verification system designed to make authored work
recognizable, auditable, and hard to counterfeit. It combines content hashing, cadence-derived
signatures, cryptographic verification, and refusal states when provenance is weak.

## Why this repo exists

Most verification pipelines only validate *files*. StagePort is built to validate *authorship
signals plus files* while preserving privacy.

This repository is organized to keep:
- public-facing positioning concise,
- implementation details executable,
- long-form research readable,
- repeatable operational templates reusable.

## Non-negotiables

1. **Refuse weak provenance.** If there is no reliable cadence signal, verification must return a
   refusal state instead of a false certainty.
2. **No silent rewrites.** Schema and protocol changes require explicit version bumps.
3. **Privacy by default.** Store derived feature vectors, not raw keystroke logs, unless audit mode
   is explicitly enabled.
4. **Deterministic verification.** Given the same text, cadence features, and session metadata,
   outputs must be reproducible.

## Current status

- Spec: ✅ `specs/CADENCE_SIGNATURE_SPEC_v0.1.md`
- v0 capture/sign/verify: ⏳ in progress
- Next ship: **Issue #1** (`.github/ISSUES/issue-0001-v0-cadence-signature.md`)

## Repo map

- `docs/FOUNDER_COPY.md` — founder voice, pinned copy, narrative framing.
- `docs/BIOMETRIC_SIGNATURES_OVERVIEW.md` — trimmed research overview.
- `specs/CADENCE_SIGNATURE_SPEC_v0.1.md` — implementable protocol contract.
- `templates/SESSION_CLOSEOUT_PACK.md` — closeout template for large chat conversion.
- `templates/README_HEADER_KIT.md` — reusable header/status block kit.
- `tools/verify_signature.py` — minimal verifier for v0 bundles.
- `examples/` — placeholder structure for sample bundles.

## Quickstart (verifier)

```bash
python tools/verify_signature.py \
  --text examples/text.txt \
  --sig examples/signature.json \
  --pub examples/public_key.pem
```

## Notes

This README is intentionally tight. Long-form framing and research live under `docs/`.
