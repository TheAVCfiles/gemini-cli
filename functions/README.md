# Firebase chat handler

This directory contains a reusable chat handler that proxies requests to the
Gemini API. It mirrors the logic used by the MWRA glossary demo so that Firebase
users can deploy the same backend without downloading the pre-built bundle.

## Usage

1. Install the dependencies inside the `functions` folder:

   ```bash
   cd functions
   npm install firebase-admin firebase-functions @google/generative-ai
   ```

2. Export the handler from your Firebase Functions entry point:

   ```js
   import * as functions from 'firebase-functions';
   import { chatHandler } from './index.js';

   export const chat = functions.https.onRequest(chatHandler);
   ```

3. Provide a Gemini API key via one of these environment variables:

   - `GEMINI_API_KEY`
   - `generativeai_key`
   - `GENERATIVEAI_KEY`

   If none of the variables is set the handler returns a 500 error.

4. (Optional) Create an `instructions.json` file alongside this directory to
   override the default model or system instruction:

   ```json
   {
     "system": "You are the MWRA glossary assistant.",
     "model": { "text": "gemini-2.0-flash" }
   }
   ```

   Environment variables (`GEMINI_SYSTEM_INSTRUCTION`, `GEMINI_MODEL`) take
   precedence over the file.

The handler accepts the following JSON payload:

```json
{
  "message": "Explain inflow infiltration",
  "history": [{ "role": "user", "content": "Hello" }],
  "toggles": { "strict": true, "json_mode": false }
}
```

If `json_mode` is enabled the handler prepends a contract that asks Gemini to
respond with a JSON object containing `answer`, `notes`, and/or `actions` keys.
