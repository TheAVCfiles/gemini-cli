# Deploying the MWRA Glossary demo to Firebase Hosting

This guide documents "Option C" — deploying the ready-to-run `mwra-glossary-firebase.zip` package into a single Firebase/GCP
project (for example, a personal "codex" sandbox) that hosts multiple front-ends under a single umbrella identity. The package
contains everything required to serve the static glossary UI and proxy `/ask` requests through a token-protected Cloud Function.

> **At a glance**
>
> * Works with the Firebase Spark (free) plan — no paid resources are required for the default configuration.
> * One download, one install command, one `firebase deploy` to launch.
> * Cloud Functions are only invoked for `/ask` so static page views stay on the free Hosting tier.
>
> The archive layout is:
>
> ```text
> mwra-glossary-firebase/
> ├── firebase.json          # Hosting rewrites `/ask` to the HTTPS function
> ├── functions/index.js     # Implements the `/ask` HTTPS function with shared-token guard
> ├── functions/package.json # Minimal dependencies for the function runtime
> ├── functions/.runtimeconfig.json (generated)
> ├── web/                   # Static UI already wired to call `/ask`
> └── README_FIREBASE.md     # Copy/paste quick start used below
> ```

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 18+ | Matches the Firebase Functions runtime used by the package. |
| [Firebase CLI](https://firebase.google.com/docs/cli) | Install with `npm install -g firebase-tools` if needed. |
| Firebase project | Re-use the personal `codex` project or create one in the Firebase console. |
| Hosting site target | Each app in the project should have its own Hosting target (for example `codex-mwra`). |
| Shared secret | A short passphrase that every authorized user will supply before the Function forwards the request. |

## 2. Download and unpack the starter kit

```bash
curl -L -o mwra-glossary-firebase.zip \
  "https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a/mwra-glossary-firebase.zip?download=1"
unzip mwra-glossary-firebase.zip
cd mwra-glossary-firebase
```

The `README_FIREBASE.md` inside the archive mirrors the next sections for quick reference.

## 3. Install the Cloud Function dependencies

```bash
cd functions
npm install
cd ..
```

The package only pulls the HTTPS Function runtime dependencies, so this step completes quickly even on the free tier. For
reference, the bundled `functions/package.json` declares the following production dependencies:

```json
"dependencies": {
  "js-yaml": "4.1.0",
  "firebase-admin": "12.6.0",
  "firebase-functions": "5.0.1",
  "google-generative-ai": "0.11.1"
}
```

They cover YAML parsing for the glossary dataset, the Firebase Admin and Functions SDKs used by the HTTPS endpoint, and the
Google Generative AI SDK that powers the `/ask` responses.

## 4. Configure project aliases and Hosting target

Tell the Firebase CLI which project to use and create a Hosting target name so you can deploy multiple apps under one project:

```bash
firebase login                           # Skip if you already authenticated
firebase use <codex-project-id>          # Alias to your existing project
firebase target:apply hosting codex-mwra <site-id>
```

* `<codex-project-id>` is the Firebase project you want to reuse.
* `<site-id>` is the Hosting site inside that project (create it once in the console). Each app you ship (glossary, lab, etc.)
  can map to a different target while still sharing the same billing/quota pool.

The downloaded `firebase.json` already declares a Hosting configuration named `codex-mwra`, so applying the target is a one-time
setup step.

## 5. Set required runtime secrets

The HTTPS function protects `/ask` behind a shared token. Configure that token (and optionally an OpenAI API key if you plan to
forward traffic to OpenAI instead of Gemini) before deploying:

```bash
firebase functions:config:set ask.shared_token="<shared-token>"
# Optional if you plan to toggle OpenAI mode from `functions/index.js`
firebase functions:config:set ask.openai_api_key="<sk-...>"
```

When the Cloud Function executes it will read `functions.config().ask.shared_token` (and `ask.openai_api_key` when present). Using
Function config avoids checking secrets into version control.

## 6. Deploy

With dependencies installed and configuration applied, deploy both Hosting and Functions in one command:

```bash
firebase deploy --only hosting:codex-mwra,functions
```

The CLI will upload the `web/` assets to Firebase Hosting and deploy the `/ask` HTTPS function. Because only `/ask` traffic hits
the Function, most requests stay on the free Hosting tier.

## 7. Test the deployment

1. Visit `https://<site-id>.web.app/` (or your custom domain) and ensure the glossary UI loads.
2. Submit a test question — the frontend prompts for the shared token before relaying to the function.
3. Inspect the Firebase Console → Functions logs to confirm the request path (`/ask`) and that token validation succeeds.

## 8. Iterate with additional apps

Repeat the same workflow for each additional experience you want to add under the `codex` umbrella:

1. Download its Firebase-ready package.
2. Apply a new Hosting target name, for example `firebase target:apply hosting codex-lab <another-site-id>`.
3. Deploy with `firebase deploy --only hosting:codex-lab,functions` (or rename the `functions` folder if each app needs its own
   backend).

Using Hosting targets keeps everything inside a single Firebase project while presenting each experience at a clean URL. This is
ideal for the 10-site allowance in the free tier: you can deploy multiple demos without juggling extra projects.

## 9. Clean up

When you are done testing, you can remove the deployed resources:

```bash
firebase hosting:disable --site <site-id>
firebase functions:delete ask --region=us-central1
```

Because the project never leaves the free tier, you will not incur charges if you forget this step. It simply keeps your
"codex" project tidy for future demos.
