K-Pop Choreography Planner — StagePort Linked
============================================

This deliverable bundles a Netlify-ready single-page app with StagePort
integration for credential scoring and sales forwarding.

Key interactions
----------------
- Credential → coins: >=85 → +25, >=70 → +10
- Record Sale → StagePort /purchase (server forwards to Airtable payouts)

Deployment notes
----------------
1. Deploy to Netlify.
2. Set `GEMINI_API_KEY` in the Netlify environment.
3. Open on mobile or desktop, then paste your StagePort base URL into
   **Settings → StagePort API URL**.
