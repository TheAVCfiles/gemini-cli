# ADR 007: Adopt offline-first, local-only storage for Evidence Vault (no automatic cloud sync)

**Status**: Accepted  
**Deciders**: Lilly Simpson (CEO), Engineering Lead, AVC Governance Consultant  
**Consulted**: External Security & Privacy Advisor  
**Informed**: Future investors, legal counsel, campus compliance partners  
**Date**: 2026-03-03

## Context and Problem Statement

The Evidence Vault is designed to let users securely capture and store photos, videos, voice notes, timestamps, and GPS metadata from safety incidents for potential future use (personal records, campus reports, law enforcement).

This data is extremely sensitive. Automatic cloud upload/sync (even encrypted) introduces unacceptable risks at MVP stage: persistent server-side storage, compelled disclosure risk, metadata leakage, accidental sync to shared accounts, and internet dependency during high-stress moments.

## Considered Options

### Option 1: Automatic encrypted cloud sync
- Pros: Seamless cross-device access, automatic backup, easier recovery
- Cons: Data leaves device, metadata exposure, weakens strict minimization and user sovereignty

### Option 2: Opt-in cloud backup after explicit user consent + manual export
- Pros: Balances convenience with control
- Cons: Still creates server-side presence; adds consent complexity and UX burden

### Option 3: Fully offline-first, local-only storage with manual user export (Chosen)
- Description:
  - All Vault content stored exclusively on-device.
  - No automatic upload or sync to any cloud service.
  - Users can manually export Vault items to their own storage.
- Pros:
  - Zero server-side presence for Vault data
  - Strong privacy and sovereignty posture
  - No internet dependency during capture or review
- Cons:
  - No automatic cross-device access
  - Risk of data loss without user backup

## Decision Outcome

**Chosen option:** "Fully offline-first, local-only storage with manual user export"
