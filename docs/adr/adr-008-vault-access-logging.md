# ADR 008: Implement minimal, local-only, tamper-evident access logging for Evidence Vault

**Status**: Accepted  
**Deciders**: Lilly Simpson (CEO), Engineering Lead, AVC Governance Consultant  
**Consulted**: External Security & Privacy Advisor  
**Informed**: Future investors, legal counsel, campus compliance partners  
**Date**: 2026-03-04

## Context and Problem Statement

The Evidence Vault stores highly sensitive user-generated content. Users and institutions may need to verify when the Vault was accessed, whether content was viewed/exported/modified, and whether a chain of custody remains intact.

Full server-side logging is unacceptable due to centralization risk. No logging creates credibility gaps.

## Considered Options

### Option 1: No access logging
- Pros: Maximum privacy
- Cons: No chain-of-custody proof; weak evidentiary credibility

### Option 2: Full server-side access logging
- Pros: Centralized audit trail
- Cons: Creates a sensitive centralized dataset; contradicts offline-first and minimization principles

### Option 3: Minimal, local-only, tamper-evident logging inside encrypted Vault (Chosen)
- Description:
  - Append-only log entries stored inside the encrypted Vault.
  - Entries record timestamp, action type, entry ID, and optional hashed device identifier.
  - Entries are cryptographically chained for tamper detection.
  - No log data leaves device unless user explicitly exports it.
- Pros:
  - Preserves offline-first client-side model
  - Enables chain-of-custody verification without company access
  - Minimal data footprint
- Cons:
  - Relies on device trust and user-managed export

## Decision Outcome

**Chosen option:** "Minimal, local-only, tamper-evident logging stored inside the encrypted Vault itself"
