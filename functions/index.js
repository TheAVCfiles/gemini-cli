import * as functions from "firebase-functions";
import fetch from "node-fetch";

// Proxy to local agent runner (Gemini CLI wrapper) you’ll host on Cloud Functions later.
// For now it echoes so deploy works out-of-the-box.
export const agent = functions.https.onRequest(async (req, res) => {
  const { prompt } = req.body || {};
  res.set('Content-Type','text/plain');
  res.send(`Agent received: ${prompt ?? "(no prompt)"}\n→ Wire to Gemini soon.`);
});
