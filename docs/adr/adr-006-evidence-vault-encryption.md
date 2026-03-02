# ADR 006: Adopt end-to-end client-side encryption for Evidence Vault with user-controlled keys

**Status**: Accepted  
**Deciders**: Lilly Simpson (CEO), Engineering Lead, AVC Governance Consultant  
**Consulted**: External Security & Privacy Advisor  
**Informed**: Future investors, legal counsel, campus compliance partners  
**Date**: 2026-03-03

## Context and Problem Statement

The Evidence Vault allows users to securely store photos, videos, voice notes, timestamps, and GPS metadata from safety incidents for potential future use (e.g., reporting to campus authorities, law enforcement, or personal records).

This is among the most sensitive data the app will ever handle: visual/auditory evidence of harassment, assault, unsafe situations, or crimes. Any compromise (server breach, insider access, subpoena without user consent) could cause severe harm to users.

Standard cloud storage with server-side encryption is common in competitor apps but fails to provide meaningful protection against provider access, compelled disclosure, or misconfiguration. We must design the Vault to survive a full server compromise while still being usable on mobile devices.

## Considered Options

### Option 1: Server-side encryption only (provider manages keys)
- Pros: Simple implementation, easy recovery if user loses device, seamless cross-device sync
- Cons: Provider (or government via subpoena) can access plaintext; single point of failure; violates meaningful end-to-end protection; weak privacy story for a safety app

### Option 2: Hybrid — client encrypts, server stores encrypted blobs + recovery key escrow
- Pros: Some user protection, possible account recovery
- Cons: Escrow introduces trusted third-party risk; recovery key still allows compelled access; complex consent model

### Option 3: Full client-side encryption with user-controlled keys, no server decryption capability (Chosen)
- Description:
  - All Vault content encrypted/decrypted exclusively on-device using keys derived from user passphrase or device-bound biometrics.
  - Server stores only opaque encrypted blobs (no metadata readable by server).
  - No backdoor, no recovery by app provider.
  - Optional export to user-controlled locations (iCloud Drive, Google Drive, local files) for backup.
- Pros:
  - True end-to-end protection — even full server breach yields only ciphertext
  - Strongest possible privacy and security posture
  - Aligns with safety-app trust promise (“your evidence is yours alone”)
  - Defensible under privacy laws and campus partner scrutiny
  - Minimal server-side liability
- Cons:
  - User loses access if they forget passphrase / lose device without backup
  - No automatic cross-device sync without user action
  - Slightly higher UX friction (passphrase entry on access)

## Decision Outcome

**Chosen option:** "Full client-side encryption with user-controlled keys, no server decryption capability"

## Positive Consequences

- Extremely strong privacy narrative for marketing, app store review, campus partnerships
- Reduced legal exposure for the company (no ability to produce plaintext even under court order)
- Breach impact limited to metadata only (no content exposure)
- Builds long-term user trust in a category where trust is fragile

## Negative Consequences

- Account recovery impossible without user-managed backups
- Users must understand passphrase importance (onboarding education required)
- Cross-device access requires manual export/import or cloud-drive sync (user responsibility)
- Slightly increased implementation complexity (secure key derivation, secure enclave usage on iOS/Android)
