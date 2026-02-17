# StagePort MVP Module Plan (Private IP Track)

## Purpose

This brief converts the existing StagePort memnode and product specs into a practical module roadmap for the MVP while minimizing IP exposure. It assumes mobile-first delivery for the Director's Chair surfaces (HOME, CALLBOARD, STUDY, SALON, SOVEREIGN) and integrates the pre-defined engines (PyRouette, SafetyEngine, DestinyEngine, DescentEngine, LedgerShield).

## Design Principles

- **Surface-first orchestration:** Treat each navigation surface as a StagePort node with explicit inputs/outputs and safety grades to constrain scope and speed integration.
- **Evidence-backed telemetry:** Pair motion/biomech data and rehearsal artifacts with explainable scoring (e.g., GOE, fatigue) and audit trails before automation.
- **Privacy by design:** Default to pseudonymous event storage, redact raw motion captures after derived features land, and keep partner IP (curricula, casting notes, ledger metadata) in isolated buckets with per-tenant encryption.
- **Operator-in-the-loop:** Every automation path must surface a human approval checkpoint before modifying safety, casting, or ledger states.

## Module Outlines

### PyRouette Engine (movement + scoring)

- **Inputs:** Motion capture sessions, rehearsal footage, judge/coach notes, somatic safety logs.
- **Processing:** Pose estimation → phase detection → GOE capping based on floor stability → bias detection flags.
- **Outputs:** GOE timeline, fatigue alerts, bias-adjusted coach review packet, Title IX-ready audit trail for stability and bias checks.
- **Infra hooks:** Stream capture events to a feature-extraction worker; persist only derived GOE and stability metrics. Route audit logs to SafetyEngine for IX traceability.

### SafetyEngine / Mercy Gate IX (ethics firewall)

- **Inputs:** Judge/coach notes, somatic safety micro-memos, casting schedules.
- **Processing:** Divergence detection between safety rules and casting/policy decisions; auto-tag high-risk schedules (late rehearsals, high-load casting).
- **Outputs:** Audit trail entries, IX-conscious casting flags, escalation to director for override.
- **Infra hooks:** Policy rules stay in a private repository; deploy as signed bundles to avoid leaking rule IP. Use append-only ledger for overrides.

### Sovereign Ledger & LedgerShield (economy + custody)

- **Inputs:** Ledger summaries, move-mint events, tuition payments, royalty splits.
- **Processing:** Tokenize receipts as micro-dividends, apply residual/royalty rails, calculate archival dividends (Scroll Coins/Keys) without exposing payer identity.
- **Outputs:** Dashboard cards for students/attendance/revenue, payout queues, downloadable audit receipts.
- **Infra hooks:** Keep identity vault separate from transaction ledger; expose only hashed payer IDs to UI. Run LedgerShield checks before external payouts.

### Ghost Labor Stack (ops visibility)

- **Inputs:** Unpaid artistry signals, rehearsal conflicts, scheduling gaps.
- **Processing:** Detect invisible labor patterns; recommend crediting or compensation events.
- **Outputs:** Sovereign alerts (triage-needed), whisper cues for directors, contract addenda suggestions.
- **Infra hooks:** Store detection heuristics privately; surface only aggregated risk scores to UI cards.

### Casting Wall + Destiny/Descent Engines (roles + risk)

- **Inputs:** Casting wall FSM state, roles, risk thresholds, receipts of consent.
- **Processing:** Match roles to talent with risk-aware scoring; lock schedule changes when risk crosses thresholds; require receipts for coercion-sensitive changes.
- **Outputs:** Role assignments, IX-friendly change log, receipts bundle for legal/archive.
- **Infra hooks:** Keep FSM and risk weights server-side; ship only signed decisions to clients. Maintain per-surface node schema for HOME/CALLBOARD rollups.

## Implementation Steps (MVP)

1. **Wire node schemas:** Apply the StagePort node schema to HOME and CALLBOARD to define inputs/outputs, owners, and safety grades for the first release.
2. **Data minimization pass:** Implement pipelines that drop raw capture media after feature extraction; retain only derived metrics and IX audit hashes.
3. **Audit + ledger spine:** Stand up append-only audit log shared by SafetyEngine and LedgerShield; enforce operator approval before state changes.
4. **Whisper + alert surfaces:** Populate magenta whisper cues and sovereign gold alerts from aggregated risk/ledger events; avoid embedding raw policy text client-side.
5. **Closed beta loop:** Pilot with one studio, collecting only anonymized telemetry and manual overrides to tune risk/ledger heuristics before broader release.

## Notes on IP Protection

- Store policy bundles, casting heuristics, and scoring thresholds in private repos with signed release artifacts.
- Keep per-tenant encryption keys in an HSM-backed vault; never mix customer data across tenants in analytics jobs.
- Provide red-team style audits on audit trail integrity and IX coverage before exposing automation externally.
