# StagePort / StudioOS — Governed Founder Stack

## Core Invariants
- Append-only behavior for governance events and ledger records.
- Receipts-first architecture: actions are only considered complete when a receipt exists.
- No silent state changes; state transitions must be explicit, auditable, and observable in UI/API output.
- Fail closed on notarization-dependent flows: never show a success state if notarization fails.

## Routes
- `/founder`
- `/founder/onboarding`
- `/startup-studios`

## APIs
- `GET /api/documents`
  - Returns system documents available for governance context.
- `POST /api/documents/hash`
  - Hashes canonical payload text and returns a deterministic digest output for receipt anchoring.
- `GET /api/ledger`
  - Returns the global ledger feed.
- `GET /api/ledger/founder_journey`
  - Returns founder-journey scoped ledger entries.
- `POST /api/ledger/notarize`
  - Notarizes an event/document hash into the ledger.

### `eventType` behavior
- `eventType` is required for semantic classification of notarized actions.
- `eventType` should remain explicit and human-readable for audits.
- `eventType` should map directly to user action/transition intent (no opaque internal aliases in public ledger payloads).

## Seeded Doctrine
- `founder_reality_kit_v1`
  - Canonical starting doctrine used for founder onboarding and governance framing.

## Pricing Tiers
- Systems Triage™: `$12,000`
- Governance Install™: `$25,000`
- Institutional / advanced architecture tiers: `$35,000` and `$50,000–$75,000`
- Add-on lane available (scope-based, quoted)

## Manual Test Checklist
- Founder onboarding route loads and progresses through expected states.
- Founder dashboard renders current state and associated receipts.
- Document list resolves from `GET /api/documents`.
- Hash endpoint returns digest for representative payload via `POST /api/documents/hash`.
- Notarization writes to ledger via `POST /api/ledger/notarize`.
- Global ledger view reflects new entries from `GET /api/ledger`.
- Founder-journey ledger view reflects scoped entries from `GET /api/ledger/founder_journey`.
- Error path check: force a notarization failure and verify UI does **not** display success.

## Graceful Degradation Rules
- If notarization fails, keep UI in non-success state and present actionable retry feedback.
- If ledger refresh fails, retain last known-good state and clearly label it stale.
- If hash service fails, block receipt-dependent transitions and surface the failure.
- Never imply persisted governance state without corresponding receipt evidence.

## Repo Safety
- No force pushes.
- Follow append-only ledger philosophy.
- Docs must reflect shipped behavior only.
- If push fails, local commits remain valid; retry push later without history rewrite.
