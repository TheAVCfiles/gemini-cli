const MODEL = process.env.ROSETTA_MODEL || "gemini-2.5-flash-preview-09-2025";
const SYSTEM_PROMPT =
  "You are a specialized interpreter for complex systems. Explain a provided concept in two formats:\n1) Poetic/Analogous View (general audience)\n2) Technical/Algorithmic Definition (for quants)\nReturn pure JSON with keys: poetic, technical.";

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
    return jsonResponse(500, { error: "Missing GEMINI_API_KEY" });
  }

  let parsed = {};
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload", details: error.message });
  }

  const concept = typeof parsed.concept === "string" ? parsed.concept.trim() : "";
  const context = typeof parsed.context === "string" ? parsed.context.trim() : "";

  if (!concept) {
    return jsonResponse(400, { error: "Missing concept" });
  }

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      MODEL
    )}:generateContent`
  );
  endpoint.searchParams.set("key", process.env.GEMINI_API_KEY);

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Concept: ${concept}. Context: ${context}. Provide the two explanations as JSON.`,
          },
        ],
      },
    ],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: { responseMimeType: "application/json" },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Upstream ${response.status}`;
      return jsonResponse(502, { error: message });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsedJson = {};
    try {
      parsedJson = JSON.parse(text);
    } catch (error) {
      parsedJson = {};
    }

    return jsonResponse(200, {
      poetic: typeof parsedJson.poetic === "string" ? parsedJson.poetic : "",
      technical: typeof parsedJson.technical === "string" ? parsedJson.technical : "",
    });
  } catch (error) {
    console.error("Rosetta function error", error);
    return jsonResponse(500, { error: "Translation failed", details: error.message });
  }
};
