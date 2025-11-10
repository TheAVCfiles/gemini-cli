# StagePort — Director's Chair (Notion Master Template)
**Date:** 2025-11-08

Create the following databases and link them into a single dashboard page ("Director's Chair").

---

## 1) People — Clients & Faculty CRM
**Properties**
- Name (Title)
- Role (Select: Student, Parent, Faculty, Guardian, Partner, Investor)
- Status (Select: Lead, Active, Alumni, Prospect, Pause)
- Email (Email)
- Phone (Phone)
- Studio / Company (Text)
- Tags (Multi-select)
- Consent on File (Checkbox)
- Linked: Projects (Relation → Projects)
- Linked: Credentials (Relation → Credentials)
- Linked: Transactions (Relation → Ledger)

## 2) Projects / Productions
- Title (Title)
- Type (Select: Class, Workshop, Residency, Production, Audit, Implement)
- Stage (Select: Idea, Alpha, MVP, Live)
- Start / End (Date)
- Owner (Person)
- Linked: People (Relation → People)
- Linked: Offers (Relation → Offers)
- Linked: Credentials (Relation → Credentials)
- Linked: Transactions (Relation → Ledger)

## 3) Franchise & Sales Pipeline
- Studio / Territory (Title)
- Stage (Select: Prospect, Discovery, Proposal, Legal, Launch, Live)
- Expected Value (Number) — USD
- Next Action (Text)
- Next Date (Date)
- Contact (Relation → People)
- Linked: Offers (Relation → Offers)
- Linked: Projects (Relation → Projects)

## 4) Offers (Catalog / Vending)
- Name (Title)
- Type (Select: SaaS, Service, IP, Course, Deck, Report, Script)
- Status (Select: Idea, Alpha, MVP, Live)
- Tiers (Multi-select: Free, B2C, B2B, White-label)
- Price (Number or Formula)
- URL (URL)
- Repo (URL)
- Thumbnail (Files)
- Linked: Projects (Relation → Projects)

## 5) Credentials (StageCred)
- Name (Title)
- Level (Select: Bronze, Silver, Gold)
- CTID (Text)
- CTDL JSON (Files)
- Issued On (Date)
- Evidence Hash (Text)
- Linked: People (Relation → People)
- Linked: Projects (Relation → Projects)

## 6) Ledger (Sentient Cents / Payments)
- Date (Date)
- Party (Relation → People)
- Project (Relation → Projects)
- Amount (Number)
- Currency (Select: USD, SCC)
- Type (Select: Payment, Allocation, Tip, Grant, Share)
- Tags (Multi-select)
- Note (Text)
- Attachment (Files)

## 7) Safety / Title IX
- Incident ID (Title)
- Type (Select: Conduct, Access, Facility, Harassment, Other)
- Status (Select: New, In Review, Resolved)
- Severity (Select: Low, Medium, High)
- Reported By (Relation → People)
- Linked: Project (Relation → Projects)
- Evidence (Files)
- Actions (Text)

---

# Director's Chair (Dashboard views)
- **Today Panel:** Calendar of Projects; Open Leads; Safety Alerts.
- **Vending Panel:** Gallery view of Offers, grouped by Status; tier badges visible.
- **Faculty Panel:** Saved filter on `Role = Faculty`, grouped by credential level.
- **Franchise Panel:** Pipeline Kanban by `Stage` with sum of `Expected Value`.
- **Credentials Panel:** Table of issued credentials with CTID search.
- **Ledger Panel:** 7‑day / 30‑day totals + Sentient Cents allocations.
- **Safety Panel:** Incidents by Status/Severity with quick actions.
