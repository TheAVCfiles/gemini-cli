# ADR 005: Delete all location and signal data immediately after session closure

**Status**: Accepted  
**Deciders**: Lilly Simpson, Tech Lead  
**Date**: 2026-03-02

## Context

Location data is among the most sensitive categories collected by the app. Retaining it after the immediate safety need ends provides no ongoing user benefit while significantly increasing privacy and security risk.

## Decision

All location coordinates, timestamps, check-in signals, and associated metadata will be deleted from both client device and any temporary buffers within 5 minutes of session closure (user ends session or timeout occurs).

Exceptions:
- User explicitly exports to Evidence Vault (opt-in, encrypted, user-controlled)
- Minimal anonymized success/failure counters for app health monitoring (no PII linkage)

## Consequences

Positive:
- Drastically reduces data retention footprint
- Strong alignment with data minimization principle
- Easier to explain in privacy policy and campus outreach

Negative:
- Cannot offer historical “walk replay” or long-term safety insights
- Support/debugging relies more on user cooperation

Risks mitigated:
- No long-lived location history to subpoena or leak
- No temptation to monetize historical data
