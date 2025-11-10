# Decrypt the Future — Late Edition

**Purpose**  
A production-ready template and runbook for the *Late Edition* — a newspaper-style, client-facing publication that combines astrological intelligence, market signals, and a playful yet authoritative editorial voice (the Gossip RAG). This guide documents the format, data contracts, templates, and end-to-end flow for creating and delivering the Late Edition both offline and via a lightweight hosting stack (Firebase or static hosting).

**Build date:** 2025-11-10T00:38:50Z

---

## 1. Overview & Product Intent
The Late Edition is a daily or weekly *issue* that reads like a late-night financial paper but decodes planetary movement, market sentiment, and proprietary prediction metrics. Its goals:
- Make dense astro/market analysis instantly digestible for clients and prospects.
- Create shareable artifacts (PDF/HTML) that look professional and collectible.
- Demonstrate predictive accuracy as a product differentiator.
- Provide private, token-gated delivery for clients (no self-serve natal inputs).

**Key UX assets**: headline masthead, ticker strip, lead story (Gossip RAG), prediction index (CCI + buckets), Market Café menu, and Client Locker (unlock code/parcel).

---

## 2. Anatomy of the Late Edition (Template)
A Late Edition issue is a single HTML page and optional PDF export. Sections:

1. **Masthead / Ticker** — brand lockup, time stamp, planetary & market ticker.
2. **Lead Story** — a satire/feature driven by a major transit (e.g., Jupiter square Uranus) written in pop-culture voice.
3. **Gossip RAG** — 3–6 short items (headline + blurb), each mapped to a real-world news event or market move.
4. **Prediction Index** — CCI overall, four buckets, prediction grade (A / A- / B+ ...), and short explanation.
5. **Market Café** — curated menu of purchasable micro-reads (zodiac pastries → product SKUs).
6. **Client Locker** — token unlock UI for deliverables and attachments.
7. **Footer / Metadata** — issue date, data sources and confidence note, legal copy.

**Output formats**: responsive HTML (for client viewing) plus PDF export (printable Late Edition).

---

## 3. Data Contracts
Files used in the client-side preview and production pipelines:

- **Edition JSON (daily)** — inputs consumed by the rendering template.

```json
{
  "date": "2025-11-09T07:00:00Z",
  "lead": {"headline": "Zeus argues with Poseidon",
             "blurb": "Uranus sparks volatility in Aquarian tech sectors..."},
  "gossip": [{"headline": "Mercury texts the Fed",
              "blurb": "Short-term noise, long-term threads..."}],
  "signals": {
    "CCI_overall": 86.2,
    "buckets": {"Relational": 86.5, "Creative": 89.2, "Strategic": 86.7, "Expansion": 82.5},
    "window": "Next 5 days: favorable"
  },
  "client": {
    "id": "client_avc_19920225",
    "name": "Allison Van Cura",
    "tier": "Premier"
  },
  "locker": {"code": "SPHINX-042", "assets": ["weekly-report.pdf", "voice-note.mp3"]},
  "meta": {"issue_number": 142, "editor": "Oracle A-Team"}
}
```

- **Signals CSV (rolling)** — optional dataset with raw CCI window points, ingestible by the forecasting service.
- **Asset manifest (yaml)** — lists downloadables placed in the Client Locker, keyed by unlock code.

Each contract should live in `late-edition/data/{issue-id}/` to make preview builds reproducible and auditable.

---

## 4. Template Assets
| Artifact | Location | Notes |
| --- | --- | --- |
| HTML template | `docs/examples/templates/late-edition.html` | Responsive, flexbox layout with ticker animation. |
| CSS bundle | `docs/examples/templates/late-edition.css` | System font stack, supports dark-mode override class. |
| PDF layout script | `docs/examples/decrypt_the_future_late_edition.py` | Uses ReportLab to mirror HTML sections and render printable handbill. |
| Component partials | `docs/examples/templates/partials/` | Optional Nunjucks/EJS partials for use in Netlify build. |
| Client Locker widget | `packages/client-locker` | Lightweight web component that handles token entry + asset links. |

Ensure templates read from Edition JSON via environment variable `LATE_EDITION_DATA_PATH`.

---

## 5. Production Workflow
1. **Data prep (T-1 day)**
   - Run astro + market ingestion job (`scripts/astro_ingest.ts`) to refresh planetary ephemeris and key tickers.
   - Export summarized signals to `late-edition/data/{issue}/edition.json`.
2. **Editorial draft (T-12h)**
   - Author lead story + Gossip RAG blurbs inside Notion template.
   - Peer review voice & compliance, then sync text into JSON contract.
3. **Design QA (T-6h)**
   - Execute `python docs/examples/decrypt_the_future_late_edition.py --output-dir build/late-edition/{issue}`.
   - Validate HTML responsiveness (Chrome + Safari) and check PDF typography.
4. **Publishing (T-0)**
   - Deploy HTML to Firebase Hosting via `firebase deploy --only hosting:late-edition`.
   - Upload PDF to secure storage and link through Client Locker manifest.
5. **Post-launch**
   - Track click + unlock metrics in Segment (`event: late_edition_unlock`).
   - Archive assets in cold storage (`gs://late-edition-archive/{issue}`).

---

## 6. Hosting & Delivery
- **Static preview**: Netlify deploy from `build/late-edition/{issue}` for internal QA.
- **Client distribution**: Firebase Hosting with Cloud Functions proxy that validates `x-client-token` header before serving the HTML.
- **PDF delivery**: Signed Cloud Storage URLs surfaced in the Client Locker after successful token entry.
- **Email summary**: Drip campaign via Customer.io with hero image, CTA button, and fallback text linking to the hosted issue.

---

## 7. Automation & Integrations
- CI workflow (`.github/workflows/late-edition.yml`) checks JSON schema, lints templates, and triggers the ReportLab build.
- Slack notifier posts #late-edition-ready with preview links when the CI run succeeds.
- Optional Zapier automation posts a teaser to LinkedIn once the issue unlock window opens.
- Analytics instrumentation uses Segment + BigQuery to correlate unlocks with product usage.

---

## 8. Security, Privacy & Compliance
- Client Locker tokens rotate every issue; store salted hashes in Firestore (`collection: lateEditionTokens`).
- Restrict PDF assets to `Authenticated` Firebase Storage rules and expire signed URLs after 48 hours.
- Include disclaimer + consent language in the footer referencing market-risk disclaimers and astrological interpretation caveats.
- Maintain audit log of edits in Git to support compliance requests.

---

## 9. Future Enhancements
- Expand Gossip RAG with auto-generated charts (D3 sparkline overlay).
- Integrate voice-over audio track for accessibility (Text-to-Speech pipeline).
- Introduce personalization modules that swap sections based on client tier.
- Build mobile push notifications (Expo) for unlock reminders.

---

## 10. Appendix
### 10.1 CLI Helpers
- `npm run late-edition:preview` — builds HTML with live reload.
- `npm run late-edition:deploy -- --issue=<id>` — wraps Firebase deploy + manifest upload.
- `python docs/examples/tools/sign_manifest.py` — signs locker manifest entries with HMAC key.

### 10.2 Sample Locker Manifest (YAML)
```yaml
issue: 142
locker_code: SPHINX-042
assets:
  - file: weekly-report.pdf
    label: Week-in-Review Forecast
  - file: voice-note.mp3
    label: Oracle Hotline Recap
  - file: premium-chart.png
    label: Saturn Cycle Visual
```

### 10.3 QA Checklist
- [ ] Validate JSON schema via `npm run late-edition:lint`.
- [ ] Confirm ticker timestamps match publication date.
- [ ] Check that all locker assets resolve with token gate enabled.
- [ ] Spell-check lead story + Gossip RAG headlines.
- [ ] Ensure footer disclaimers match latest legal guidance.

---

## 11. Related Files
- `docs/examples/decrypt_the_future_late_edition.py` — ReportLab + HTML bundler script.
- `docs/examples/templates/` — HTML/CSS assets referenced above.
- `docs/examples/redaction-text-pdf.md` — pattern for PDF layout automation.
- `docs/architecture.md` — broader system overview for Decrypt the Future.

Ship the Late Edition with confidence knowing editorial, automation, and delivery workflows are captured in this runbook.
