# House Operator Architecture

House Operator is the governed intake, Q&A, and routing layer for Global AVC Systems. It is not a persona. It operates inside defined rooms with delegated, limited authority, and escalates anything outside that authority to a human review queue.

## Core Model: Rooms

A **room** is a permission boundary. Every request is evaluated inside exactly one room.

A room defines:

| Field | Purpose |
| --- | --- |
| `role_required` | Minimum access level to enter the room. |
| `knowledge_ref` | Pointer to a versioned, approved knowledge base, not inline in code. |
| `allowed_actions` | What the operator may do: answer, link, guide, ask clarifying questions, classify, or draft. |
| `restricted_topics` | Topics that always escalate regardless of confidence. |
| `escalation_rules` | Conditions that force a hold instead of an answer. |
| `logging_requirements` | What must be written to the audit log for this room. |

Rooms are data, not code. Adding another public-facing room, such as Press, should mean adding a configuration entry rather than rewriting routing logic.

## Rooms in v1

| Room | Role required | Knowledge scope | Can do | Cannot do |
| --- | --- | --- | --- | --- |
| Public | `visitor` | Product overview, public demo links, approved bio. | Answer, link, guide. | Pricing, legal, titles, investor terms, disputes, anything not in the knowledge base. |
| Investor / Judge | `visitor` self-declared | Business case, market framing, public technical posture. | Answer, link. | Valuation, cap table, fundraising terms, securities language, unlabeled traction claims. |
| Partner / Client | `visitor` self-declared | Product overview and qualification logic. | Ask clarifying questions, classify, draft intake record. | Quote price, promise timeline, approve scope, grant rights, accept terms. |
| Review Queue | `admin` Allison only | Full: held items and drafts. | Approve, edit, reject, respond. | Not applicable; this is the human authority layer. |

## Role-Based Access Control

House Operator v1 uses three roles:

- **visitor**: anyone with no login. A visitor can self-declare an investor or partner framing, but this is a UX hint rather than authorization. The restriction changes; no privilege is granted.
- **operator**: future team member role that can view non-sensitive logs but cannot access the review queue.
- **admin**: Allison. This is the only role that can see the review queue, edit knowledge bases, or approve a held item into a sent response.

Access control must be enforced server-side, not by hiding UI elements. A visitor's browser must never receive the admin knowledge base, review queue contents, or raw system prompts.

## Escalation Rules

The following topics always trigger a hold, regardless of room or confidence:

- Pricing, discounts, or payment terms.
- Licensing or IP terms.
- Legal matters, contracts, or disputes.
- Equity, investment terms, or securities language.
- Any title or role claim, including CTO, advisor, employee, or similar designations.
- Private client matters.
- Custom deliverable or implementation commitments.
- Anything not found in the room's approved knowledge base.
- Anything the model's own confidence check flags.

When a hold triggers, the operator responds with this fixed line:

> That question needs Allison / Global AVC Systems to review directly, so I've queued it instead of guessing.

## Data Model

### Knowledge Base Entry

Knowledge base entries are versioned per room. Old versions are retained instead of overwritten so the system has an audit trail of what House Operator was allowed to say on any given date.

```json
{
  "room": "public",
  "version": "2026-01-01.1",
  "effective_date": "2026-01-01",
  "content": {},
  "approved_by": "admin_user_id",
  "supersedes": null
}
```

### Audit Log Entry

An audit log entry is written once per interaction, with no exceptions.

```json
{
  "id": "audit_123",
  "timestamp": "2026-01-01T00:00:00Z",
  "room": "public",
  "action": "answered",
  "question": "What does Global AVC Systems do?",
  "response_given": "Approved response text.",
  "reason_held": null,
  "kb_version_used": "2026-01-01.1",
  "session_id": "session_123"
}
```

### Review Queue Item

A review queue item is created whenever an audit log action is `held` or `routed`.

```json
{
  "id": "queue_123",
  "timestamp": "2026-01-01T00:00:00Z",
  "room": "partner_client",
  "question": "Can you build this custom implementation by March?",
  "reason_held": "custom_deliverable_commitment",
  "contact": {
    "name": "Example Contact",
    "email": "contact@example.com",
    "org": "Example Org",
    "role": "Founder"
  },
  "inquiry_type": "client",
  "proposed_next_action": "Admin review required before response.",
  "status": "needs_review",
  "founder_response": null,
  "resolved_at": null,
  "resolved_by": null
}
```

### Intake Record

The Partner / Client room can build an intake record over the conversation.

```json
{
  "organization": "Example Org",
  "contact_role": "Founder",
  "problem": "Needs governed intake and routing.",
  "timeline": "Q2",
  "budget_range": null,
  "requested_deliverable": "Implementation support",
  "inquiry_type": "client"
}
```

When enough fields are filled in, the intake record is classified as research, licensing, consulting, or implementation and attached to a review queue item automatically. The operator never quotes a number; it hands Allison a qualified lead.

## Human-in-the-Loop Review Panel

For each queued item, the admin panel needs four actions. Each action writes to the audit log.

- **Approve**: send the drafted response as-is.
- **Edit**: modify the draft before sending.
- **Reject**: dismiss with no response sent.
- **Respond**: write a fresh reply, bypassing any draft.

Nothing leaves the system as a response to a visitor without one of these four actions happening first for anything that was held.

## Prototype-to-Production Gaps

The prototype `house-operator.html` demonstrates the room model, escalation logic, and admin-panel interaction design. It is not production-ready when running entirely in-browser because:

- System prompts and knowledge base text are visible to anyone who opens developer tools.
- Any client-side model request and response are inspectable.
- A passphrase-based admin gate is cosmetic, not authentication.
- Shared key-value storage is not a private database; anyone with the link may technically read queue contents.

## Production Path

House Operator can be implemented as a standard three-tier web application.

1. **Backend**: a serverless function, such as Cloud Run, Cloud Functions, or Lambda, holds system prompts, knowledge bases, and model API keys. The browser calls only the Global AVC Systems endpoint.
2. **Database**: Postgres or Firestore stores knowledge base versions, audit logs, review queue items, and intake records. Firestore is a lower-setup option for an existing GCP environment.
3. **Auth**: Firebase Auth or Google sign-in restricted to Allison replaces the passphrase gate. Visitors remain unauthenticated; only the review panel requires login.
4. **Knowledge base editing**: an admin form writes a new versioned knowledge base entry instead of editing code. This keeps knowledge bases versioned and room-scoped while allowing updates without a deploy.
