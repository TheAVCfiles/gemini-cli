const MODEL = "gemini-2.5-flash-preview-tts";

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders
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

  const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  if (!text) {
    return jsonResponse(400, { error: "Missing text" });
  }

  const voiceName =
    typeof parsed.voiceName === "string" && parsed.voiceName.trim()
      ? parsed.voiceName.trim()
      : "Charon";

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
        contents: [{ parts: [{ text: `Say informatively: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          }
        }
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message || `Gemini request failed (${response.status})`;
      return jsonResponse(502, { error: message });
    }

    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;

    if (!audioData || !mimeType) {
      return jsonResponse(502, { error: "Gemini returned no audio data" });
    }

    return jsonResponse(200, { audioData, mimeType, voiceName });
  } catch (error) {
    console.error("rebuttal-tts error", error);
    return jsonResponse(500, { error: "Failed to contact Gemini", details: error.message });
  }
};
