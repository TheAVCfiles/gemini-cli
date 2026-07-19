---
capture_date: 2026-07-18
source: user-provided conversation material
status: raw
---

This is another useful seed, but important: **as pasted, it is still only conversation context. It has not been saved to GitHub.**

To persist it, say:

```text
Archive this verbatim as:
vault/inbox/raw/2026-07-18-compliance-tracking-skill.md

Do not alter existing files. Add it to vault/INDEX.md and commit it separately.
```

You would also need to identify the target repository the first time.

Structurally, this is an **evidence and readiness skill**, but it is much too thin for actual compliance work. It currently describes topics, not an enforceable workflow.

## What it needs before production

### Scope and applicability

The system must establish:

* Organization and legal entity
* Product or system boundary
* Jurisdictions
* Data types
* Customers and contractual obligations
* Framework edition or effective version
* Whether the framework is mandatory, contractual or voluntary
* Who is qualified to approve applicability conclusions

It cannot assume every named framework applies.

### Control-level records

```json
{
  "framework": "SOC 2",
  "framework_version": "current_verified_version",
  "control_id": "CC6.1",
  "requirement": "Approved requirement text or licensed reference",
  "applicability": "applicable",
  "control_owner": "admin_user_id",
  "implementation_status": "implemented",
  "operating_status": "needs_testing",
  "evidence_refs": ["evidence_123"],
  "last_tested_at": null,
  "approved_by": null
}
```

### Evidence provenance

A file existing somewhere is not audit evidence. Each evidence item needs:

* Control relationship
* Source system
* Collection period
* Collector
* Collection method
* Integrity hash
* Access restrictions
* Retention period
* Reviewer
* Acceptance or rejection
* Superseded evidence relationship

### Honest status states

Use defined states:

```text
not_assessed
not_applicable_pending_approval
gap_identified
control_designed
implemented_not_tested
operating_effectiveness_pending
evidence_ready
exception_open
remediation_in_progress
reviewed
```

Avoid fake percentages like “87% compliant” unless the weighting methodology is explicit. Compliance theater loves a progress bar. Auditors love asking what it means.

## House Operator boundary

This should be admin-only or operator-assisted, never an unrestricted public room.

The model may:

* Inventory requirements
* Collect and classify evidence
* Draft control descriptions
* Identify apparent gaps
* Build calendars and checklists
* Prepare material for review

The model must not:

* Declare Global AVC Systems legally compliant
* Determine legal applicability conclusively
* Invent missing evidence
* Mark a control effective without authorized testing
* Interpret ambiguous regulatory duties as settled
* Submit material to an auditor or regulator without approval

Mandatory escalation topics should include:

```text
legal interpretation
framework applicability
control exceptions
breach determination
regulatory notification
formal attestation
auditor communication
claims of certification or compliance
```

The accurate product language is:

> Compliance Tracking supports readiness, evidence organization and human review. It does not independently issue legal conclusions, certifications or attestations.

## Stronger workflow

```text
Identify system boundary
→ Verify framework and version
→ Determine preliminary applicability
→ Human approves scope
→ Import requirements
→ Map existing controls
→ Identify evidence requirements
→ Collect evidence references
→ Test completeness
→ Flag gaps and exceptions
→ Draft remediation plan
→ Human reviews conclusions
→ Issue readiness receipt
```

This belongs in your growing skill taxonomy as:

**Compliance Tracking = controlled evidence assembly and readiness orchestration.**

It is also highly aligned with the Constitution of the Sandbox, particularly versioned authority, purpose-bound telemetry, role separation, human redress and receipts. But the current draft should be archived as a source specimen, not mistaken for production-grade compliance machinery.No, not directly.

For your use case, **push to a new branch, then merge into `main` only after reviewing the diff**. Main should represent the last known-good, intentionally approved version.

Use this rule:

| Change                        | Where it goes first     |
| ----------------------------- | ----------------------- |
| Raw information dump          | `archive/...` branch    |
| New product idea              | `experiment/...` branch |
| Application change            | `feature/...` branch    |
| Canonical architecture update | `docs/...` branch       |
| Approved, reviewed work       | Merge into `main`       |

A good workflow:

```text
main
  └── archive/2026-07-18-compliance-tracking
```

Then:

1. Codex creates the branch.
2. Saves the dump as a new file.
3. Commits it.
4. Pushes that branch to GitHub.
5. Opens a draft pull request.
6. You inspect the “Files changed” tab.
7. Merge only if nothing valuable was overwritten.

Use this instruction:

```text
Do not push directly to main.

Create a new branch from the latest main:
archive/2026-07-18-[short-name]

Make only the requested additive changes.
Do not modify or delete existing files.
Commit and push the branch.
Open a draft pull request.
Report:
- branch name
- commit SHA
- files added
- files modified
- lines added
- lines deleted

Stop before merging.
```

For implementation work, add:

```text
If the diff contains unexpected deletions or replaces an existing interface,
stop and show me the conflict. Do not commit the replacement.
```

Even as a solo founder, pull requests are worthwhile. They are your approval gate and visual receipt. You do not need another engineer to approve them. You are using the PR to separate:

> Codex proposed this
> from
> Allison approved this as company canon

Raw archive additions could technically go directly to main, but I would not create that exception yet. Consistency is cheaper than recovering another 530 deleted lines.
