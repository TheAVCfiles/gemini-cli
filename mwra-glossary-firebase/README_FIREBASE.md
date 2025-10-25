# MWRA Glossary Firebase Starter

This directory mirrors the archive described in `docs/firebase-hosting.md`. It contains a minimal Cloud Function that guards the
`/ask` endpoint with a shared token and rewrites Firebase Hosting traffic to that function.

## Setup

1. Install dependencies for the Cloud Function:

   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   ```

2. Deploy to Firebase (requires the Firebase CLI to be authenticated and a project to be selected):

   ```bash
   firebase deploy --only functions,hosting
   ```

Set the `MWRA_SHARED_TOKEN` environment variable during deployment or through the Firebase console to enable the token guard.
