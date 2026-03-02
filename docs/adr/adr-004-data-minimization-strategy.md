# ADR 004: Enforce strict data minimization and purpose limitation for all safety signals

**Status**: Accepted  
**Deciders**: Lilly Simpson (CEO), Engineering Lead, AVC Governance Consultant  
**Consulted**: Privacy & Legal Advisor (external review)  
**Informed**: Future investors, campus partners  
**Date**: 2026-03-02

## Context and Problem Statement

The app collects location, check-in timestamps, and user-initiated signals during active safety sessions. Any unnecessary retention, secondary use, or over-collection creates disproportionate privacy risk, regulatory exposure (GDPR, CCPA, COPPA if under-18 users are possible), and liability in the event of a breach or subpoena.

Competitors have faced scrutiny for indefinite location history, analytics misuse, or sharing with advertisers. We must design from day one to collect the absolute minimum data required for the core safety function.

## Considered Options

### Option 1: Collect full session telemetry + long-term analytics storage
- Pros: Rich data for future ML improvements, usage insights, incident reconstruction
- Cons: High privacy risk, large attack surface, difficult to justify necessity, violates data minimization principle

### Option 2: Minimal retention per session, but cloud-sync everything for backup
- Pros: Some redundancy, easier debugging
- Cons: Unnecessary transmission of sensitive data, persistent cloud storage increases breach impact

### Option 3: Session-scoped, client-side only retention with immediate deletion after session ends (Chosen)
- Pros: Strongest minimization, explicit purpose limitation (safety signaling only), low breach impact, defensible under privacy laws
- Cons: No historical analytics, harder post-mortem if incidents occur outside app, no cross-session patterns

## Decision Outcome

**Chosen option:** "Session-scoped, client-side only retention with immediate deletion after session ends"

**Main reasons:**
- Data minimization is a legal and ethical first principle for safety apps handling sensitive location data.
- Purpose limitation: data exists only to enable real-time trusted-contact escalation.
- Breach impact minimized: at most one active session per user is vulnerable.
- Aligns with TDC-01 boundaries (minimal event log, no continuous surveillance).

## Positive Consequences

- Clear, defensible privacy story for app store review, campus partnerships, and user trust
- Lower regulatory risk (easier Article 5 GDPR / CCPA §1798.100 compliance)
- Smaller attack surface and faster incident response
- Supports offline-first design (no cloud dependency for core function)

## Negative Consequences

- No long-term incident analytics or cross-user pattern detection
- Debugging / support limited to live sessions or user-submitted evidence vault exports
- Future ML features (if pursued) require explicit re-evaluation and new consent model

## Risks & Mitigations

- Risk: User loses important evidence if session ends prematurely  
  Mitigation: Evidence Vault (encrypted, user-controlled export) remains available as opt-in Pro feature

- Risk: Support team cannot assist without historical data  
  Mitigation: Rely on user screenshots, vault exports, and session logs shared directly by user

## More Information

- Related ADRs: ADR 001 (Session-bounded signaling), ADR 003 (No cloud sync in MVP)
- TDC-01-ARCH-BD Boundary 3: No Continuous Surveillance
- Privacy-by-Design reference: NIST SP 800-53, OWASP Mobile Top 10 (M9 – Improper Session Handling)
