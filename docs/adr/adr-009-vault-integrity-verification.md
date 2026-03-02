# ADR 009: Implement cryptographic integrity verification for Evidence Vault contents and access log

**Status**: Accepted  
**Deciders**: Lilly Simpson (CEO), Engineering Lead, AVC Governance Consultant  
**Consulted**: External Security & Privacy Advisor  
**Informed**: Future investors, legal counsel, campus compliance partners  
**Date**: 2026-03-05

## Context and Problem Statement

Evidence Vault artifacts may be used for formal reports and legal processes. Users and third parties need to verify content has not been altered, access logs are authentic, and the full Vault maintains integrity over time.

## Considered Options

### Option 1: No integrity verification
- Pros: Zero implementation effort
- Cons: No tamper resistance; poor evidentiary value

### Option 2: Server-side hashing/signatures on upload
- Pros: Centralized attestation
- Cons: Contradicts offline-first model; increases provider liability and metadata exposure

### Option 3: Per-entry hashing + Merkle-tree root in signed Vault manifest (Chosen)
- Description:
  - Hash each Vault entry at capture time (SHA-256 or BLAKE3).
  - Store hashes in append-only manifest; chain access log hashes.
  - Build Merkle root and sign it with per-Vault key.
  - Verification tool recomputes root and checks signature offline.
- Pros:
  - Detects tampering to content, metadata, and logs
  - Preserves user-controlled, offline verification
  - Minimal storage overhead
- Cons:
  - More implementation complexity
  - Verification depends on key management and exports

## Decision Outcome

**Chosen option:** "Cryptographic per-entry hashing + Merkle-tree root stored in Vault manifest"
