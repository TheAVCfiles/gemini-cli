# Bootstrap Google Cloud for Gemini CLI

Use `gcp-setup.sh` to create or configure a Google Cloud project that is ready for
Vertex AI and Gemini CLI. The helper script checks for the Google Cloud CLI,
ensures you are authenticated, creates the project if needed, enables Vertex AI
services, links billing (optional), and writes a `.gemini/.env` file with the
required environment variables.

## Prerequisites

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed.
- Run `gcloud auth login` (and `gcloud auth application-default login` if you
  plan to use Application Default Credentials).

## Interactive setup

```bash
./gcp-setup.sh
```

The script prompts for a project ID, billing account (optional), and writes the
`.gemini/.env` file. It defaults to the `us-central1` Vertex AI location; supply
`--location` to override it.

## Provide the project on the command line

```bash
./gcp-setup.sh my-ai-project
```

When a project already exists the script skips creation and only enables the
necessary APIs, configures `gcloud`, and updates your `.gemini/.env` file.

## Fully automated bootstrap

```bash
./gcp-setup.sh my-ai-project 01ABCD-234EFG-567HIJ
```

Provide both the project ID and billing account ID to run end-to-end without
prompts. If the billing account is already linked, the script leaves it in
place.

You can also run this non-interactively with the accompanying npm script:

```bash
npm run gcp:bootstrap -- my-ai-project 01ABCD-234EFG-567HIJ
```

## npm helpers

The repository exposes npm scripts that wrap `gcp-setup.sh`:

- `npm run gcp:setup` — starts the interactive flow (`./gcp-setup.sh`).
- `npm run gcp:bootstrap` — runs in CI/non-interactive mode (`./gcp-setup.sh --ci`).
  Pass the project and optional billing account after `--`.

## What the script configures

Running the script performs the following steps:

1. Verifies that the Google Cloud CLI and Python 3 are available.
2. Confirms you are authenticated with `gcloud`.
3. Creates the project (if it does not already exist) and sets it as the active project.
4. Optionally links a billing account.
5. Enables required services: `serviceusage`, `cloudresourcemanager`, `iam`,
   `iamcredentials`, and `aiplatform`.
6. Sets the active Vertex AI location.
7. Updates `.gemini/.env` with `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`,
   and `GOOGLE_CLOUD_LOCATION`.
8. Reports whether Application Default Credentials are already configured and
   reminds you to run `gcloud auth application-default login` if not.

With these steps complete you can start Gemini CLI in Vertex AI mode immediately
(using either ADC or a Vertex AI API key).
