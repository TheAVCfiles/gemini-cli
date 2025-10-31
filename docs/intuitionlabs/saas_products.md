# IntuitionLabs SaaS Product Catalog

IntuitionLabs offers a focused suite of software subscriptions tailored for teams working at the intersection of ethics, motion intelligence, and narrative computing. This catalog provides operational details for each offer so product, sales, and compliance teams can publish synchronized listings across storefronts.

## Shared operations

- **Payment processor:** Stripe (production key stored in `STRIPE_SECRET_KEY`).
- **Authentication hooks:**
  - `stripe_key` → `${{ secrets.STRIPE_SECRET_KEY }}`
  - `mythos_api_key` → `${{ secrets.MYTHOS_API_KEY }}` (used for MythOS environment provisioning)
- **Publishing targets:**
  - GitHub Pages microsite (marketing landing page + gated download links)
  - Notion storefront (pricing table and fulfillment automation)
- **Asset vault:** [Vector store snapshot](https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a) containing reference prompts, compliance checklists, and onboarding scripts shared across all products.

## Product line

### Private Cloud Pilot (Vertex AI Blueprint)

- **Category:** Six-week, fixed-scope private cloud deployment using Kinesthetic AI modules.
- **Price:** $7,500,000 USD (one-time service engagement).
- **Fulfillment:**
  - Deployment milestones scheduled through the IntuitionLabs calendaring stack.
  - Compliance artifacts and onboarding scripts sourced from the shared vector store snapshot.
- **Delivery channel:** White-glove onboarding supported by Supabase client ledgering and concierge scheduling.
- **Highlights:**
  - Mirrors Google Vertex AI blueprint requirements while layering IntuitionLabs' proprietary governance controls.
  - Establishes parity between internal Kinesthetic AI environments and customer-managed infrastructure.
  - Automations capture contract status and immediately route welcome messaging once Stripe confirms payment.

### 8765 Resilience Program

- **Category:** AI-powered cohort wellness and resilience curriculum for technical teams.
- **Price:** $1,500,000 USD (cohort purchase; automation provisions a 50-seat checkout session at $15,000 each).
- **Fulfillment:** Typeform intake stands up a Stripe checkout session and stages cohort metadata in Google Sheets for onboarding.
- **Delivery channel:** Blended asynchronous curriculum with optional live facilitation powered by IntuitionLabs' coaching agents.
- **Highlights:**
  - Cohort size, payment status, and onboarding timestamp roll into shared dashboards for program operations.
  - Wellness prompts and daily practice scripts reference the shared vector store for consistent tone and neuro-inclusive language.
  - Designed for resilience officers supporting high-pressure engineering and research teams.

### Founder Alignment Retainer

- **Category:** Ongoing intuitive, technical, and strategic advisory retainer for founders.
- **Price:** $150,000 USD per month (recurring Stripe subscription).
- **Fulfillment:** Concierge follow-ups provide Stripe enrollment links after alignment reports are delivered.
- **Delivery channel:** Monthly strategic sessions, asynchronous signal checks, and curated prompt packs distributed via secure mail.
- **Highlights:**
  - Couples qualitative alignment assessments with IntuitionLabs' technical oversight of roadmap execution.
  - Uses the shared vector store to personalize founder briefings with current market signals and proprietary heuristics.
  - Automated touchpoints ensure timely retainer renewal outreach without manual scheduling overhead.

### Legacy software subscriptions

The Adaptive Ethics Framework (AE-001), Glissé Engine (GL-002), and MythOS Cloud Access (MY-003) remain available for teams that
require direct access to IntuitionLabs' software bundles. Contact the product operations team to align their fulfillment plans
with the service-led offers above.

## Automation playbooks

Each product line is paired with a low-touch automation so fulfillment and customer success teams can focus on high-value
interactions.

- **PrivateCloudPilot_Onboard**
  - **Trigger:** `checkout.session.completed` event from Stripe, filtered for products containing "Cloud".
  - **Actions:** Upserts the client into Supabase (`clients` table) with payment confirmation and dispatches a concierge welcome
    email containing the scheduling link.
- **8765Resilience_Onboard**
  - **Trigger:** New Typeform entry.
  - **Actions:** Generates a Stripe checkout session for 50 seats at $15,000 each and appends intake details to the `8765_Cohorts`
    Google Sheet for cohort operations.
- **FoundersAlignment_RetainerOffer**
  - **Trigger:** Gmail attachment sent with "Launch Alignment Report" in the subject.
  - **Actions:** Delays 24 hours before sending a follow-up email that includes the Stripe enrollment link for the retainer.

## Publishing workflow

1. **Update assets:** Refresh deliverables in secure storage and ensure the shared vector store reflects the latest compliance and onboarding scripts.
2. **Stripe setup:**
   - Confirm product IDs and pricing in the Stripe dashboard match the Private Cloud Pilot, 8765 Resilience Program, Founder
     Alignment Retainer, and legacy SKUs (`AE-001`, `GL-002`, `MY-003`).
   - Rotate API keys quarterly and store them as GitHub/Netlify secrets referenced above.
3. **GitHub Pages refresh:**
   - Regenerate marketing pages with updated pricing and CTA buttons for the three flagship service offers and archive pages for
     legacy software bundles.
   - Upload the latest downloadable assets for Adaptive Ethics and Glissé Engine behind authenticated links and ensure service
     playbooks link to the correct scheduling or checkout flows.
4. **Notion storefront sync:**
   - Mirror pricing, deliverables, and fulfillment checklists.
   - Ensure database automations trigger Stripe webhook updates (license key issuance, credential emails).
5. **Post-launch QA:** Run Gemini CLI scripts that simulate each purchase path, verifying download link integrity, license key delivery, and MythOS credential provisioning.

Maintaining this catalog alongside the curriculum materials ensures that IntuitionLabs' narrative learning offerings and SaaS products stay aligned under a single operational playbook.
