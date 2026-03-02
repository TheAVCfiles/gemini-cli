# Architecture Decision Records (ADR)

This folder stores architecture decisions for safety-critical product boundaries (privacy, consent, escalation, retention, cryptographic integrity).

## Naming convention

- `adr-001-<short-title>.md`
- Zero-padded sequence numbers for stable sorting.

## Recommended template (MADR)

```md
# ADR XXX: <Title>

**Status**: Accepted / Proposed / Deprecated / Superseded
**Deciders**: <names/roles>
**Consulted**: <optional>
**Informed**: <optional>
**Date**: YYYY-MM-DD

## Context and Problem Statement

## Considered Options

### Option 1: <name>
- Pros:
- Cons:

### Option 2: <name>
- Pros:
- Cons:

## Decision Outcome

**Chosen option:** "<name>"

## Positive Consequences

## Negative Consequences

## Risks & Mitigations

## More Information
```

## Current ADR set

- ADR 001: Session-bounded human escalation
- ADR 004: Data minimization and purpose limitation
- ADR 005: Immediate post-session deletion
- ADR 006: Client-side encryption with user-controlled keys
- ADR 007: Offline-first local-only Vault storage
- ADR 008: Minimal local tamper-evident access logging
- ADR 009: Cryptographic integrity verification
