# Decrypt the Future — Late Edition

**Purpose**  
A production-ready template and runbook for the *Late Edition* — a newspaper-style, client-facing publication that combines your astrological intelligence, market signals, and playful / authoritative editorial voice (the Gossip RAG). This file documents the format, data contracts, templates, and end-to-end flow for creating and delivering the Late Edition both offline and via a lightweight hosting stack (Firebase or static hosting).

**Build date:** 2025-11-10T00:32:43Z

---

## 1. Overview & Product Intent
The Late Edition is a daily/weekly *issue* that reads like a late-night financial paper but decodes planetary movement, market sentiment, and your prediction metrics. Its goals:
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
4. **Prediction Index** — CCI overall, 4 buckets, prediction-grade (A / A- / B+ ...), and short explanation.
5. **Market Café** — curated menu of purchasable micro-reads (zodiac pastries → product SKUs).
6. **Client Locker** — token unlock UI for deliverables and attachments.
7. **Footer / Metadata** — issue date, data sources and confidence note, legal copy.

**Output formats**: responsive HTML (for client viewing) + PDF export (printable Late Edition).

---

## 3. Data Contracts
Files used in the client-side preview and production pipelines:

- **Edition JSON (daily)** — inputs used by templates:

```json
{
  "date": "2025-11-09T07:00:00Z",
  "lead": {
    "headline": "Zeus argues with Poseidon",
    "blurb": "Uranus sparks volatility in Aquarian tech sectors..."
  },
  "gossip": [
    {
      "headline": "Mercury texts the Fed",
      "blurb": "Short-term noise, long-term threads..."
    }
  ],
  "signals": {
    "CCI_overall": 86.2,
    "buckets": {
      "Relational": 86.5,
      "Creative": 89.2,
      "Strategic": 86.7,
      "Expansion": 82.5
    },
    "window": "Next 5 days: favorable"
  },
  "client": {
    "id": "client_avc_19920225",
    "name": "Allison Van Cura",
    "tier": "Premier"
  }
}
```

- **Transit Feed (hourly)** — normalized CSV/JSON of key planetary positions, aspects, dignities.
- **Market Pulse (hourly)** — equities, crypto, macro indicators, and sentiment scores.
- **Creative Brief (per issue)** — editorial prompts, voice guidelines, embargo notes.
- **Client Locker manifest (per client)** — array of downloadable assets + token requirements.

### 3.1 Validation Rules
| Field | Type | Validation | Notes |
| --- | --- | --- | --- |
| `date` | ISO timestamp | Required; must be >= publish window start | Drives masthead and caching keys |
| `lead.headline` | string | Required, <= 80 chars | Displayed in hero |
| `gossip` | array | 3–6 items | Each item needs headline + blurb |
| `signals.CCI_overall` | number | 0–100 | Displayed as % / gauge |
| `client.tier` | enum | `Premier`, `Standard`, `Trial` | Impacts Market Café upsell |

---

## 4. Content Workflow
1. **Data ingest** pulls transit + market feeds into a staging bucket (`gs://late-edition/staging`).
2. **Signal synthesis** (Python notebook or Cloud Function) computes CCI and bucket deltas.
3. **Editorial drafting** uses the Creative Brief and Edition JSON to produce copy (Lead Story + Gossip RAG).
4. **Layout render** runs the templating engine to generate HTML, with fallback PDF using Playwright.
5. **Client Locker bundling** maps deliverables to the manifest and encrypts gated assets.
6. **QA + approvals** confirm calculations, copy tone, and legal review.
7. **Publish + notify** deploys to Firebase Hosting and sends client email/SMS with gated link.

---

## 5. Template & Code Architecture
- **Template stack**: Astro components + Tailwind CSS, compiled to static HTML.
- **Component folders**:
  - `components/Masthead.tsx` — renders logo, timestamp, ticker scroller.
  - `components/LeadStory.tsx` — stylized hero layout with image slot.
  - `components/GossipList.tsx` — card grid with gradient ribbons.
  - `components/PredictionIndex.tsx` — gauge + bucket cards.
  - `components/MarketCafe.tsx` — menu table with SKU CTAs.
  - `components/ClientLocker.tsx` — gated download and unlock input.
- **Styling**: CSS variables for night-mode palette (`--ink`, `--moonlight`, `--ticker`).
- **Localization**: string tables in `i18n/en.json` (English) with optional `i18n/ja.json` extension.
- **Export**: `scripts/build-late-edition.ts` compiles HTML + triggers PDF render via Playwright.

---

## 6. Hosting & Delivery
- **Firebase Hosting**: use `firebase.json` rewrites to serve `/late-edition/<issueId>`; configure basic auth or token gating via Cloud Functions.
- **Static Hosting**: export to `/public/late-edition/<issueId>/index.html` and sync to Netlify/Cloudflare.
- **Client Locker**: store gated files in Firebase Storage (`/locker/<clientId>/<issueId>`) with signed URLs.
- **Notifications**: integrate with SendGrid for email and Twilio for SMS to share access links.
- **Analytics**: embed Google Analytics 4 with custom events (`locker_unlock`, `menu_cta_click`).

---

## 7. Automation & Scheduling
- **Cron**: Cloud Scheduler triggers `publishLateEdition` Cloud Function at 06:00 UTC.
- **Versioning**: commit Edition JSON and Creative Brief in `/content/late-edition/<YYYY-MM-DD>/`.
- **Rollback**: maintain previous 7 issues with diff-friendly JSON for quick revert.
- **Secrets**: store API keys in Secret Manager; never in the repo.
- **Monitoring**: set up uptime checks for `/late-edition/latest` and Slack alerts on failures.

---

## 8. QA & Publishing Checklist
- [ ] All data feeds up to date (transits < 1h old, market pulse < 15m).
- [ ] JSON schema validated (`npm run validate:late-edition`).
- [ ] Copy reviewed for tone and compliance.
- [ ] Client Locker assets uploaded and token gating tested.
- [ ] PDF export verified on desktop + mobile preview.
- [ ] Publish + send notifications.
- [ ] Archive assets to cold storage bucket.

---

## 9. Security & Compliance
- **PII handling**: client IDs and names limited to Locker context; anonymize analytics.
- **Token gating**: use short-lived JWT (<15 minutes) issued by Firebase Auth service account.
- **Legal**: include horoscope disclaimer + investment risk statement in footer.
- **Access logs**: retain for 30 days for incident investigation.

---

## 10. Appendix
```
late-edition/
├── content/
│   └── 2025-11-09/
│       ├── edition.json
│       └── creative-brief.md
├── scripts/
│   └── build-late-edition.ts
├── public/
│   └── late-edition/
│       └── 2025-11-09/
│           └── index.html
└── locker/
    └── client_avc_19920225/
        └── 2025-11-09/
            ├── prediction-report.pdf
            └── voice-note.mp3
```

**Next steps**
1. Build out the component library using the directories above.
2. Connect live data feeds and schedule nightly ETL.
3. Automate PDF export and notification delivery.
4. Run a private beta with 3 clients before public launch.
