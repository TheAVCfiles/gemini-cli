# Build a realtime voice agent with ephemeral client secrets

This guide walks through the fastest way to test OpenAI's Realtime API from an iPad or laptop. It follows the workflow shared in ChatGPT and focuses on keeping secrets safe by minting short-lived client credentials on a tiny proxy server.

## 1. Pin the correct Google Cloud project

The Marketplace trial that funds your OpenAI usage is tied to the project visible in the Gemini console. In the screenshot referenced in ChatGPT the project was `starry-argon-463819-a2`, so the first step is to make sure every `gcloud` command targets that project.

```bash
gcloud config set project YOUR_PROJECT_ID
```

If you want to double-check the services that are already enabled, list them explicitly:

```bash
gcloud services list --enabled --project=starry-argon-463819-a2 | grep cloudaicompanion
```

## 2. Create a lightweight token server

Realtime sessions require an ephemeral key that is safe to share with the browser. You can mint the key from a minimal Node.js server that runs next to your static files.

Create `server.mjs`:

```javascript
import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/token', async (_req, res) => {
  const body = {
    session: {
      type: 'realtime',
      model: 'gpt-realtime',
      audio: { output: { voice: 'marin' } },
    },
  };

  const response = await fetch(
    'https://api.openai.com/v1/realtime/client_secrets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  res.json(await response.json());
});

app.listen(8787, () => console.log('Token server on :8787'));
```

Install the dependencies and run the server:

```bash
npm i express node-fetch
export OPENAI_API_KEY="sk-..." # your real key
node server.mjs
```

## 3. Host a minimal browser client

With the token server online you can render a single HTML page that imports the Agents SDK directly from a CDN. The browser fetches the ephemeral key, connects, and handles microphone and speaker permissions automatically.

Create `index.html` alongside the server file:

```html
<!doctype html>
<html>
  <body>
    <button id="start">Start voice agent</button>
    <script type="module">
      import {
        RealtimeAgent,
        RealtimeSession,
      } from 'https://cdn.jsdelivr.net/npm/@openai/agents@latest/+esm';

      document.getElementById('start').onclick = async () => {
        try {
          const response = await fetch('/token');
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              'Failed to get token: ' + response.status + ' ' + errorText,
            );
          }
          const { value: ephemeralKey } = await response.json();
          const agent = new RealtimeAgent({
            name: 'Assistant',
            instructions: 'Be clear, kind, fast.',
          });
          const session = new RealtimeSession(agent);
          await session.connect({ apiKey: ephemeralKey });
        } catch (error) {
          console.error('Failed to start voice agent:', error);
          alert('Failed to start voice agent: ' + error.message);
        }
      };
    </script>
  </body>
</html>
```

Serve both files from the same origin (for example Cloud Shell web preview or a VM). Then open `http://VM_IP:8787/index.html` in Safari on your iPad, press **Start voice agent**, and begin speaking.

## 4. Run a WebSocket-only sanity check

If you want to validate the Realtime API before touching the browser stack, use a barebones WebSocket client:

Create `ws.mjs`:

```javascript
import WebSocket from 'ws';

const ws = new WebSocket(
  'wss://api.openai.com/v1/realtime?model=gpt-realtime',
  {
    headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
  },
);

ws.on('open', () => {
  ws.send(
    JSON.stringify({ type: 'session.update', session: { type: 'realtime' } }),
  );
  ws.send(
    JSON.stringify({
      type: 'response.create',
      input: 'Say one sentence of encouragement.',
    }),
  );
});

ws.on('message', (data) => console.log(data.toString()));
```

Run it with:

```bash
npm i ws
export OPENAI_API_KEY="sk-..."
node ws.mjs
```

This approach gives you the quickest confirmation that the credentials and network routing are correct.

## 5. (Optional) Archive transcripts to Cloud Storage

To keep an audit trail, you can log each request and response to a Google Cloud Storage bucket that lives in the same project.

First, create the bucket:

```bash
gcloud storage buckets create gs://realtime-artifacts --location=us-central1
```

Then extend `server.mjs` to write logs:

```javascript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const BUCKET = 'realtime-artifacts';

async function logSession(payload) {
  await storage
    .bucket(BUCKET)
    .file(`logs/${Date.now()}.json`)
    .save(JSON.stringify(payload));
}
```

Call `logSession` with the payload you want to persist—for example, whenever you mint a token or receive a transcript.

## 6. Recap checklist

1. Point `gcloud` at the Marketplace-backed project (`starry-argon-463819-a2`).
2. Run the token-minting server with your long-lived API key.
3. Open the HTML client and start the voice agent from your browser.
4. Use the WebSocket script for low-latency text-only tests when needed.
5. Optionally mirror transcripts into `gs://realtime-artifacts` for safekeeping.

Following these steps replicates the workflow highlighted in ChatGPT: you get a realtime voice agent with ephemeral secrets, minimal infrastructure, and optional persistence for debugging or compliance.
