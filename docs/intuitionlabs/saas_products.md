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

### Adaptive Ethics Framework (AE-001)

- **Category:** Portable ethics compliance engine for AI & media teams.
- **Price:** $299 USD (one-time purchase per organization, annual refresh upsell handled via Stripe subscription add-on).
- **Deliverable:** `Adaptive_Ethics_Vol1_SecureEdition_FINAL.zip`
- **Delivery channel:** Secure download link distributed after successful Stripe charge.
- **Highlights:**
  - Playbooks for algorithmic transparency, creative rights, and media provenance.
  - Automated checklist generator that syncs with the shared vector store to keep policy guidance current.
  - Recommended pairing with Cache Up glossary workflows when deploying within the MWRA ecosystem.

### Glissé Engine (GL-002)

- **Category:** Motion capture → data intelligence model tuned for dance and performance analytics.
- **Price:** $599 USD (annual license).
- **Deliverables:**
  - `glisse_engine_repo.zip` source bundle.
  - Stripe-issued license key surfaced via customer portal and mirrored to the Notion storefront fulfillment database.
- **Delivery channel:** License key + repository download. Customers authenticate via Stripe Customer Portal for renewals or key rotation.
- **Highlights:**
  - Converts raw mocap data into choreography-ready feature sets.
  - Bundles Ballet Bots calibration presets and sample Jupyter notebooks.
  - Supports integration with Gemini CLI realtime agents for creative coaching overlays.

### MythOS Cloud Access (MY-003)

- **Category:** Private deployment environment for narrative systems and story-driven agents.
- **Price:** $999 USD (annual subscription).
- **Deliverables:**
  - `MythOS_Access_Onboarding.pdf`
  - Credential pack issued through secure channel using `${{ secrets.MYTHOS_API_KEY }}`.
- **Delivery channel:** Credential handoff; onboarding PDF links to tenant provisioning checklist.
- **Highlights:**
  - Dedicated story graph instances with rehearsal sandboxes for scripted agents.
  - Ties into the vector store for canonical lore, character sheets, and continuity tests.
  - Includes optional concierge setup where IntuitionLabs staff pre-load Ballet Bots or APop Allstars curricula.

## Publishing workflow

1. **Update assets:** Refresh deliverables in secure storage and ensure the shared vector store reflects the latest compliance and onboarding scripts.
2. **Stripe setup:**
   - Confirm product IDs and pricing in the Stripe dashboard match `AE-001`, `GL-002`, and `MY-003`.
   - Rotate API keys quarterly and store them as GitHub/Netlify secrets referenced above.
3. **GitHub Pages refresh:**
   - Regenerate marketing pages with updated pricing and CTA buttons for each product.
   - Upload the latest downloadable assets for Adaptive Ethics and Glissé Engine behind authenticated links.
4. **Notion storefront sync:**
   - Mirror pricing, deliverables, and fulfillment checklists.
   - Ensure database automations trigger Stripe webhook updates (license key issuance, credential emails).
5. **Post-launch QA:** Run Gemini CLI scripts that simulate each purchase path, verifying download link integrity, license key delivery, and MythOS credential provisioning.

Maintaining this catalog alongside the curriculum materials ensures that IntuitionLabs' narrative learning offerings and SaaS products stay aligned under a single operational playbook.
