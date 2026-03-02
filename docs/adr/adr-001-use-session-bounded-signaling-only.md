# ADR 001: Use Session-Bounded Human-Escalation Signaling Instead of Predictive or Always-On Monitoring

**Status**: Accepted  
**Deciders**: Lilly Simpson (CEO), Engineering Lead, AVC Governance Consultant  
**Date**: 2026-02-20  
**Consulted**: AVC Systems Studio (Allison Van Cura)  
**Informed**: Future investors / diligence partners

## Context

We are building an everyday safety app for college women, with features including location sharing, risk awareness, discreet alerts, and community connections. Early user interviews and campus feedback highlight the need for reliable, low-friction safety signaling during high-risk walks (library → dorm, party → ride, etc.).

Several architectural patterns are common in the personal safety category:

- Predictive risk scoring (machine learning on crime data + user behavior)
- Always-on background GPS/sensor monitoring with anomaly detection
- Direct 911/emergency services integration
- Continuous ambient tracking with automated escalation

These approaches promise proactive protection but carry significant early-stage risks for a pre-launch startup.

## Considered Options

### Option 1: Predictive Safety Intelligence (ML-based risk scoring + proactive alerts)

- Pros: High perceived value; aligns with “AI-powered” marketing language
- Cons: Requires large, clean datasets (unavailable at MVP); high false-positive/negative risk; creates implied duty of care; substantial legal/regulatory exposure (privacy, discrimination, accuracy claims)

### Option 2: Always-On Background Monitoring + Auto-Escalation

- Pros: “Set it and forget it” user experience; potential for faster response
- Cons: Severe battery drain; persistent location tracking raises privacy consent issues; shifts responsibility from user to system; high liability for missed detections or false alarms

### Option 3: Direct Emergency Services Integration

- Pros: Fastest path to real help in clear emergencies
- Cons: Jurisdictional complexity; very high liability for false positives; inflexible for ambiguous situations (bad date, uncomfortable walk, etc.); requires significant compliance/certification effort

### Option 4: Session-Bounded Human-Escalation Signaling (Chosen)

- Description: User starts a session manually (e.g., “I’m walking home”); system emits time-scoped signals/check-ins; missed responses escalate only to pre-configured trusted human contacts; minimal event logging; no prediction, no automation, no continuous tracking.
- Pros:
  - Aligns authority with explicit user intent
  - Keeps humans in the loop (context-aware interpretation)
  - Minimal data collection → easier privacy story
  - Low battery/privacy impact
  - Reversible and auditable
  - Scales governance before features
  - Defensible under scrutiny (no false authority claims)
- Cons:
  - Requires user to remember to start session
  - Less “magical” than always-on or predictive alternatives
  - Slower escalation in truly unconscious emergencies

## Decision

**We will build the MVP as a session-bounded, human-escalation signaling layer only.**

- No predictive risk scoring or behavioral inference
- No continuous background monitoring
- No autonomous contact with authorities or third parties
- Escalation only to user-defined trusted contacts
- All signals and logs are session-scoped and purpose-limited

This decision is load-bearing: it reduces false authority, legal exposure, and irreversible coupling at the earliest stage.

## Consequences

- Positive
  - Clear consent model (user starts/stops session)
  - Lower privacy and battery concerns
  - Easier to explain and defend in diligence, app store review, campus partnerships
  - Governance and audit logic can evolve independently (externalized to AVC in Phase I)
  - Future augmentation possible without contradicting MVP claims

- Negative
  - User must actively initiate protection mode
  - No automatic detection of unconscious/high-risk states
  - Marketing must avoid over-promising “AI” or “always-on” capabilities

- Neutral / Trade-off
  - Responsibility remains primarily with the user and their trusted circle
  - Expansion to predictive or automated features requires explicit re-evaluation and new governance boundaries

## References

- TDC-01 Architecture Overview
- TDC-01-ARCH-BD Boundary Decisions
- TDC-01-ARCH-DR Design Rationale
- Phase I Safety Signal Artifact ZIP v0.1 (non-production demo)

## Related ADRs

- (Future) ADR-XXX: Adding optional predictive routing layer (post-MVP, separate governance review required)
