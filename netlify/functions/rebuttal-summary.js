const MODEL = process.env.GEMINI_REBUTTAL_MODEL || "gemini-2.5-flash-preview-09-2025";

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, {
      error: "Gemini API unavailable",
      details: "Missing GEMINI_API_KEY environment variable."
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload", details: error.message });
  }

  const sectionText = typeof parsed.sectionText === "string" ? parsed.sectionText.trim() : "";
  if (!sectionText) {
    return jsonResponse(400, { error: "Missing sectionText" });
  }

  const systemPrompt =
    typeof parsed.systemPrompt === "string" && parsed.systemPrompt.trim()
      ? parsed.systemPrompt.trim()
      : "You are an analyst summarising rebuttal pillars into concise bullet points.";

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      MODEL
    )}:generateContent`
  );
  endpoint.searchParams.set("key", apiKey);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sectionText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        safetySettings: SAFETY_SETTINGS
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message || `Gemini request failed (${response.status})`;
      return jsonResponse(502, { error: message });
    }

    const candidate = data?.candidates?.[0]?.content?.parts ?? [];
    const html = candidate
      .map((part) => part?.text ?? "")
      .join("")
      .trim();

    if (!html) {
      return jsonResponse(502, { error: "Gemini returned no summary" });
    }

    return jsonResponse(200, { html });
  } catch (error) {
    console.error("rebuttal-summary error", error);
    return jsonResponse(500, { error: "Failed to contact Gemini", details: error.message });
  }
};
