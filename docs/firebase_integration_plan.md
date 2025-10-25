# Firebase Integration Plan

## Repository Audit
- The repository already includes the Gemini CLI packages under `packages/` (for example, `packages/cli`, `packages/core`, and supporting utilities), along with supporting configuration such as `package.json` and `tsconfig.json`.
- The `web/` directory provides the existing frontend assets (for instance `web/index.html`).
- Firebase-specific scaffolding—such as `functions/`, `public/`, or `firebase.json`—is not currently present. These pieces will need to be added before connecting to Firebase Hosting or Cloud Functions.

## Recommended Next Steps
1. **Scaffold Firebase:** Add `firebase.json`, create a `functions/` directory with TypeScript configuration, and move or duplicate the frontend into a `public/` directory aligned with Firebase Hosting expectations.
2. **Wrap Gemini CLI:** Expose the relevant Gemini CLI capabilities through a callable HTTPS function (e.g., `functions/src/chat.ts`) that can invoke the CLI or call the Gemini API directly.
3. **Configure Frontend:** Update the frontend (currently in `web/`) to call the new Firebase Function endpoint (e.g., `fetch('/api/chat')`) and deploy the static assets via Firebase Hosting.
4. **Deploy Through Firebase Studio:** Link the GitHub repository within Firebase Studio, enable continuous deployment, and verify the full flow (frontend request → Cloud Function → Gemini response → Firestore/Storage logging).
5. **Plan for Scaling:** Monitor usage against Gemini free-tier quotas and decide whether to switch to a paid key or alternative model hosting as traffic increases.
