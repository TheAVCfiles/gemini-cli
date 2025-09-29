import * as functions from "firebase-functions";
import { getAIConfig, chooseProvider } from "./config.js";

// Vertex AI (Gemini)
import { VertexAI } from "@google-cloud/vertexai";

// OpenAI (Responses API)
import OpenAI from "openai";

/**
 * POST /agent/run
 * Body: { prompt: string, provider?: "gemini"|"openai", model?: string }
 * Selects provider via body.query?provider OR defaults from config.
 * Region kept in us-central1 so Functions + Vertex live together.
 */
export const agent = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    try {
      const prompt: string = (req.body?.prompt || "").toString();
      const overrideModel: string | undefined = req.body?.model;

      if (!prompt.trim()) {
        res.status(400).send("Missing 'prompt' in request body.");
        return;
      }

      const cfg = await getAIConfig();
      const sel = chooseProvider(req, cfg);
      const model = overrideModel || sel.model;

      if (sel.provider === "openai") {
        if (!sel.apiKey) {
          res.status(500).send("OpenAI key not configured.");
          return;
        }
        const client = new OpenAI({ apiKey: sel.apiKey });
        const resp = await client.responses.create({
          model,
          input: prompt
        });
        const text = (resp as any)?.output_text || "";
        res.set("Content-Type", "text/plain");
        res.send(text || "[no text from OpenAI]");
        return;
      }

      // Default: Gemini (Vertex AI)
      const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
      const location = "us-central1";
      if (!project) {
        res.status(500).send("Missing GCP project env (GCLOUD_PROJECT).");
        return;
      }

      // If using API key (optional for Developer API style), you could pass it via headers to REST.
      // Here we rely on ADC (service account) because we're inside Functions.
      const vertex = new VertexAI({ project, location });
      const modelClient = vertex.getGenerativeModel({ model });

      const result = await modelClient.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      const parts = result?.response?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p.text || "").join("").trim();

      res.set("Content-Type", "text/plain");
      res.send(text || "[no text from Gemini]");
    } catch (err: any) {
      console.error(err);
      res
        .status(500)
        .send("Agent error: " + (err?.message || JSON.stringify(err)));
    }
  });
