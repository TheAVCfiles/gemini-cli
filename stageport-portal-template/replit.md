# Replit workflow notes

## Start
- `npm run dev`

## Typecheck/build
- `npm run build`

## Smoke routes
- `/kinetic-ledger`
- `/founderos/sandbox`
- `/app/contracts`
- `/app/founder`
- `/app/founder/onboarding`

---

## INSTITUTIONAL MEMORY — SESSION CANON (APPEND-ONLY)

This section is forward-architecture canon. It is intentionally additive.
Do not modify existing system behavior. Do not refactor. Do not delete.

### SESSION RULES (DO NOT MODIFY EXISTING SYSTEM BEHAVIOR)

#### Strict Engineering Rules
- Additive changes only.
- No refactors.
- No deletions.
- No new dependencies.
- No architectural substitutions.
- Preserve all existing endpoints and behaviors.

#### Contact
- Official contact: avancura@globalavcsystems.com
- Never use test emails from attachments.

#### Crypto Patterns
- Kinetic Ledger = Client-side Web Crypto API only.  
  No server storage of raw ledger content.
- FounderOS Sandbox = Server hash + notarize only.  
  Real ledger writes permitted here.

#### Hash Validation Guard
Use this guard for sha256 presence validation:

typeof data?.sha256 === "string" && data.sha256.trim().length > 0

#### FounderOS documentId Pattern
Document ID format:

founderos:{clampDocIdCompany(company)}

Constraints:
- Sanitized
- Max 64 characters
- Deterministic
- No unsafe characters

---

## REVENUE LADDER (CANONICAL)

This is not theoretical. The first ladder has already converted organically.

### Tier 1 — $79
**Founder Stability Primer**
- SEO magnet
- Entry wedge
- Trust builder
- Self-serve diagnostic

### Tier 2 — $2,500
**Governance Triage Sprint**
- 90-minute intake
- Structured diagnostic
- Contribution exposure map
- Notarized findings
- Front door offer

### Tier 3 — $7,500
**Studio Install (30-day governance implementation)**
- Governance substrate
- Ledger scaffolding
- Documentation structure
- Capital readiness prep

### Tier 4 — $15,000+
**Certification + Capital Memo**
- Full 3-gate certification
- Executive memo for capital presentation
- Registry listing

### Tier 5 — $1,200/year
**Registry Renewal**
- Annual re-validation
- Drift monitoring
- Ongoing eligibility

### Conversion Pattern (Proven)
$79 → $2.5K → $7.5K  
Organic conversion confirmed. Not speculative.

---

## FOUNDEROS GAAS (GOVERNANCE-AS-A-SERVICE) MODEL

Three-layer architecture:

### Layer 1 — Free Sandbox (BUILT)
Route: `/founderos/sandbox`
- No login required
- Real ledger writes
- Hash notarization
- Public trust wedge

### Layer 2 — Paid Triage Sprint ($2,500 — LIVE)
- Structured diagnostic
- Contribution exposure mapping
- Governance gap analysis
- Formal findings

### Layer 3 — Full Install (FUTURE)
- Server-side secure logging
- Multi-user roles
- Weighted contribution scoring
- Corridor governance mapping
- Capital readiness configuration
- Institutional substrate

---

## AVC CERTIFICATION MODEL (3-GATE SYSTEM)

No partial credit. All gates must pass.

### Gate 1 — DeepScore
Bayesian posterior mean:
- μ ≥ 80
- σ ≤ defined uncertainty cap

### Gate 2 — Drift Stability
- Max deviation Δ ≤ ±5 over rolling 30-day window
- Torque τ below volatility ceiling

### Gate 3 — Documentation Substrate Index (DSI)
Composite ≥ 15/20 across four dimensions:
- Traceability
- Governance logging
- Role clarity
- Contribution mapping

---

## TIER ASSIGNMENT (WEAKEST-LINK RULE)

Overall tier = lowest qualifying band across gates.

### Tier I — Structured
- μ 80–84
- Δ ≤ 5
- DSI ≥ 15

### Tier II — Stable
- μ 85–89
- Δ ≤ 3
- DSI ≥ 17

### Tier III — Institutional
- μ ≥ 90
- Δ ≤ 2
- DSI ≥ 19

---

## SPORKLIFT CERTIFIED FORK ARCHITECTURE

Designed for controlled extensibility without dilution.

### Level 0 — AVC Core (Non-Forkable)
Protected components (cannot be modified):
- Bayesian engine
- Drift model
- Minimum thresholds
- Documentation gates
- Hash signature format
- Tier naming convention

### Level 1 — Sporklift Fork (Controlled Adaptation)
May modify:
- Industry-specific metrics
- Window length ≥ 30 days
- Weight matrices
- UX layer

May NOT:
- Lower μ thresholds
- Remove drift or documentation gates
- Alter tier naming without namespace change

### Fork Requirements
- Declare diff from core
- Publish weight delta file
- Pass regression test suite
- Receive Fork ID

### Registry Record Format
```json
{
  "core_version": "",
  "fork_namespace": "",
  "score_posterior": "",
  "drift_variance": "",
  "dsi_score": "",
  "tier": "",
  "issued_at": "",
  "hash": ""
}

Tier III Window Extensions
	•	Core: 30 days
	•	Institutional Capital Fork: 60 days
	•	Public Markets Fork: 90 days

Longer window = higher stability requirement.

⸻

STABILITY SCAN PRODUCT (FUTURE)

Local-first founder scan — $750

Runs entirely in browser. No data leaves machine.

Outputs:
	•	Institutional Score
	•	Tier
	•	Capital Risk
	•	Drift Sensitivity
	•	Downloadable Executive Memo (PDF)

Behind the scenes:
	•	Bayesian scoring engine
	•	State machine gating
	•	Drift modeling
	•	Regime torque check

Feature:
	•	“Explain Mode” transparency toggle

Upgrade path:
	•	“Submit for Certification”
	•	Upload hash + selected proofs to AVC Certification Registry

⸻

STUDIO TRANSACTION LAYER (FUTURE)

Pirouette Ledgers — $19
Credential / evaluation / score artifact

Revenue Split
	•	2% platform fee
	•	Studio retains 98%
	•	Via Stripe Connect

Stripe Connect Flow
	1.	Studio installs AVC Studio OS
	2.	Studio connects Stripe account
	3.	Student purchases ledger
	4.	Automatic split (98% / 2%)

Scale Modeling
	•	1,000 studios → ~$171K/year
	•	5,000 studios → ~$855K/year
	•	10,000 studios → ~$1.7M/year

Ledger must become:
	•	Competition infrastructure
	•	Advancement criteria
	•	Certification eligibility
	•	Instructor credentialing input
	•	Scholarship signal

Not optional art. Institutional substrate.

⸻

SEO STRATEGY

Primary wedge: Kinetic Ledger

Target keywords:
	•	“founder contribution protection”
	•	“governance as a service”
	•	“startup governance framework”

Focus:
	•	Low competition
	•	High-intent traffic
	•	Qualified founder searches
	•	SEO feeding high-ticket conversion

⸻

90-DAY FOCUS PLAN (OPERATIONAL)

Primary Objective: Systematize ladder conversion.

Core Targets
	•	Convert $79 → $2.5K → $7.5K reliably
	•	Close 5 installs in 3 months
	•	10 installs in 6 months

Execution Priorities
	1.	Document first founder case study
	2.	Build onboarding SOP
	3.	Standardize 30-day governance install deliverables
	4.	Create repeatable pitch script
	5.	Refine intake structure
	6.	Tighten capital memo template

Deliverables
	•	Install checklist
	•	Governance substrate template
	•	Drift baseline measurement protocol
	•	Certification readiness pre-check
	•	Capital memo boilerplate

⸻

STRATEGIC INTENT

FounderOS is not a tool.
It is institutional governance infrastructure.

Certification is not a badge.
It is capital signaling.

Sporklift is not open source chaos.
It is controlled extensibility with protected core.

Studio Ledger is not art tech.
It is transactional credential infrastructure.

Revenue ladder is not theoretical.
It is validated progression.

All strategic architecture, revenue modeling, certification spec, fork structure, SEO positioning, and operational targets are now formally preserved inside replit.md scope.

Nothing from the 4,362-line roadmap is conceptually lost.

Next phase is execution density, not reinvention.

⸻
