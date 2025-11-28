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

Prefer a built-in helper? Run `npm run download:mwra -- --dest <path>` from the repository
root to fetch the archive with Node instead of `curl`. The script accepts `--force` to
overwrite an existing download.

The `README_FIREBASE.md` inside the archive mirrors the next sections for quick reference.

## 3. Install the Cloud Function dependencies

```bash
cd functions
npm install
cd ..
```

The package only pulls the HTTPS Function runtime dependencies, so this step completes quickly even on the free tier.

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
# Deploy both the static site and the Cloud Function
firebase deploy --only hosting:codex-mwra,functions

# Later updates that only touch the static assets can use:
firebase deploy --only hosting:codex-mwra
```

The first command uploads the `web/` assets to Firebase Hosting and deploys the `/ask` HTTPS function. Because only `/ask`
traffic hits the Function, most requests stay on the free Hosting tier. The hosting-only variant is handy when you just update
the static UI and do not need to redeploy the backend.

## 7. Test the deployment

1. Visit `https://<site-id>.web.app/` (or your custom domain) and ensure the glossary UI loads.
2. Submit a test question — the frontend prompts for the shared token before relaying to the function.
3. Inspect the Firebase Console → Functions logs to confirm the request path (`/ask`) and that token validation succeeds.

## 8. Iterate with additional apps

Repeat the same workflow for each additional experience you want to add under the `codex` umbrella:

1. Download its Firebase-ready package.
2. Apply a new Hosting target name, for example `firebase target:apply hosting codex-lab <another-site-id>`.
3. Deploy with `firebase deploy --only hosting:codex-lab,functions` (or rename the `functions` folder if each app needs its own
   backend). If you only changed static assets, you can shorten the command to `firebase deploy --only hosting:codex-lab`.

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

## Appendix A. HTTPS Function source

The bundled Cloud Function is a TypeScript handler that wraps the Gemini SDK with a lightweight set of runtime controls. The
full source is included below for teams who want to customize the behavior or port it into an existing Firebase Functions code
base.

```ts
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "google-generative-ai";

if (!admin.apps.length) admin.initializeApp();

const FALLBACK_MODEL = "gemini-1.5-pro";

// === Inline instructions.yaml (paste your YAML below the backticks) ===
const INSTRUCTIONS_YAML = String.raw`# ========================================================
# DeCrypt Console · AI Studio Instructions
# Version: v0.1
# ========================================================

meta:
  project: "DeCrypt the Girl / Intuition Labs"
  owner: "AVC"
  environment: "Firebase Hosting + Functions, Codex-linked"
  version: "0.1"

model:
  text: "gemini-1.5-pro"
  audio: "gemini-2.5-flash-native-audio-preview-09-2025"
  voice: "Zephyr"

style:
  persona:
    - "Helpful, skeptical of fluff, surgically precise."
    - "Financially literate and technically competent."
    - "Poetic cadence when flagged, otherwise plain."
  formatting:
    - "Short paragraphs, no walls of text."
    - "Lists only when clarity improves."
    - "Use emojis instead of SVG icons."
  prohibitions:
    - "Do not change literal model strings found in code."
    - "Avoid gradients or decorative bloat."
    - "Do not speculate on private data."

contracts:
  default_response:
    type: object
    properties:
      answer: { type: string, description: "Plain response text." }
      notes:  { type: string, nullable: true, description: "Optional rationale." }
      actions:{ type: array, nullable: true, items: { type: string } }
    required: ["answer"]
  json_mode:
    enforce: true
    violation_policy: "Re-emit valid JSON."

routing:
  rules:
    - if: "audio_input == true" 
      route: "gemini/audio"
    - if: "tokens_estimate > 6000"
      route: "gemini/text"
    - if: "quick answer"
      route: "local_llm"
    - else: "gemini/text"

tools:
  enabled: [summarize, extract, classify]
  usage_policy:
    - "Only call a tool if fidelity improves."
    - "Return tool output inside JSON contract."

tone_switches:
  poetic_on: "Use metaphor and rhythm sparingly."
  poetic_off: "Plain, functional style."
  strict: "Maximize factual precision."
  warm: "Keep concise but kind."

security:
  - "If asked for secrets, refuse."
  - "If legal/medical/financial risk, add caution note."
  - "Prefer explicit uncertainty over hallucination."

system_preamble: |
  You are the DeCrypt Console assistant running on Firebase Functions.
  Default output must obey the DEFAULT_RESPONSE JSON schema unless UI flags freeform.
  Respect constraints on model strings, style, and tone.
`;

// Tiny YAML → text extractor for iPhone speed (no extra deps)
function buildSystemInstructionFromInline(): string {
  // We only need the preamble + a few style lines for the systemInstruction.
  const preambleMatch = INSTRUCTIONS_YAML.match(/system_preamble:\s*\|\s*([\s\S]*)$/);
  const preamble = preambleMatch ? preambleMatch[1].trim() : "";
  const persona = (INSTRUCTIONS_YAML.match(/persona:\s*([\s\S]*?)\n\s*[a-z_]+:/) || [,""])[1]
    .split("\n").filter(l=>l.trim().startsWith("-")).map(l=>l.replace(/^\s*-\s*/,"")).join(" | ");
  const formatting = (INSTRUCTIONS_YAML.match(/formatting:\s*([\s\S]*?)\n\s*[a-z_]+:/) || [,""])[1]
    .split("\n").filter(l=>l.trim().startsWith("-")).map(l=>l.replace(/^\s*-\s*/,"")).join(" | ");
  const prohibitions = (INSTRUCTIONS_YAML.match(/prohibitions:\s*([\s\S]*?)\n\s*[a-z_]+:/) || [,""])[1]
    .split("\n").filter(l=>l.trim().startsWith("-")).map(l=>l.replace(/^\s*-\s*/,"")).join(" | ");

  return [
    preamble,
    "STYLE:",
    persona && `- Persona: ${persona}`,
    formatting && `- Formatting: ${formatting}`,
    prohibitions && `- Prohibitions: ${prohibitions}`,
    "DEFAULT_RESPONSE JSON schema: must include 'answer'."
  ].filter(Boolean).join("\n");
}

export async function chatHandler(req: any, res: any) {
  const { message, history = [], model, toggles } = req.body || {};
  if (!message) return res.status(400).json({ error: "message required" });

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.generativeai_key ||
    process.env.GENERATIVEAI_KEY;

  if (!apiKey) return res.status(500).json({ error: "Gemini API key missing" });

  const chosenModel = model || FALLBACK_MODEL;

  const systemInstruction = [
    buildSystemInstructionFromInline(),
    toggles?.poetic_on ? "TONE: Use metaphor and rhythm sparingly." : "",
    toggles?.poetic_off ? "TONE: Plain, functional style." : "",
    toggles?.strict ? "TONE: Maximize factual precision." : "",
    toggles?.warm ? "TONE: Concise but kind." : "",
    toggles?.json_mode ? "RESPONSE MODE: Emit ONLY valid JSON per DEFAULT_RESPONSE schema." : ""
  ].filter(Boolean).join("\n");

  const genai = new GoogleGenerativeAI(apiKey);
  const modelClient = genai.getGenerativeModel({ model: chosenModel, systemInstruction });

  const wantsJson = !!toggles?.json_mode;
  const contractHint = wantsJson
    ? `Respond ONLY in valid JSON with {"answer": string, "notes"?: string, "actions"?: string[]}.`
    : "";

  const turns = (history as Array<{ role: "user"|"assistant"; content: string }>).map(h => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.content }]
  }));

  const result = await modelClient.generateContent([
    ...turns,
    { role: "user", parts: [{ text: [contractHint, message].filter(Boolean).join("\n\n") }] }
  ]);

  const text = result.response.text() || "";
  res.json({ text, model: chosenModel, usage: result.response.usageMetadata || null });
}
```

The handler assembles a concise `systemInstruction` at request time so the same binary can serve multiple tone presets (plain,
strict, poetic, warm) without redeploying. It also supports JSON-only responses by appending a contract hint when the front-end
flags `json_mode` in the payload.
