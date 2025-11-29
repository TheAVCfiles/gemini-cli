/**
 * Netlify Serverless Function: /api/gemini
 *
 * QUOTA IMPACT: This function makes external API calls to Google Gemini.
 * Each invocation consumes serverless function execution time.
 *
 * OPTIMIZATION NOTES:
 * - Consider caching common responses in static JSON files
 * - Use client-side caching for repeated queries
 * - For read-only data, prefer static JSON from /data/ directory
 *
 * @see https://docs.netlify.com/functions/overview/
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-09-2025";

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];

const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 150,
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse(503, {
      error: "Gemini API unavailable",
      details: "Missing GEMINI_API_KEY environment variable.",
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload", details: error.message });
  }

  const prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
  if (!prompt) {
    return jsonResponse(400, { error: "Missing prompt" });
  }

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent`
  );
  endpoint.searchParams.set("key", process.env.GEMINI_API_KEY);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }], role: "user" }],
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message || `Gemini request failed (${response.status})`;
      return jsonResponse(502, { error: message });
    }

    return jsonResponse(200, data ?? {});
  } catch (error) {
    console.error("Gemini function error", error);
    return jsonResponse(500, { error: "Failed to contact Gemini", details: error.message });
  }
};
