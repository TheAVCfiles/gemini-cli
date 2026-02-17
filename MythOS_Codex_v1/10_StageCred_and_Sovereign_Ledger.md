# StageCred + Sovereign Ledger

StageCred is the credential skin; Sovereign Ledger is the custody spine.

## StageCred

- Issues performance credentials with embedded provenance and safety attestations.
- Multi-format: PDF for humans, JSON for systems, hash for ledgers.
- Credentials expire by design; renewal requires fresh consent + fresh motion.
- Revocation is public, signed, and cascades to wallets and badges.

## Sovereign Ledger

- Immutable-ish log with human override triggers; no silent edits.
- Entry types: `UAL_EVENT`, `CONSENT`, `ROUTINE`, `SCORECARD`, `STAGECRED`, `SAFETY`, `TREASURY`.
- Every entry must cite model versions, humans involved, and custody rules.
- Supports multi-sig releases for high-risk narratives or legal exhibits.

## Interlock

- No StageCred without a Ledger entry; no Ledger entry without consent proof.
- Investor + regulator views share the same data, filtered by clearance band.
- Ledger keys rotate quarterly; rotation events are themselves logged.
