const MODEL = process.env.NARRATOR_MODEL || "gemini-2.5-flash-preview-tts";
const VOICE_NAME = process.env.NARRATOR_VOICE || "Charon";

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

  const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  if (!text) {
    return jsonResponse(400, { error: "Missing text" });
  }

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      MODEL
    )}:generateContent`
  );
  endpoint.searchParams.set("key", process.env.GEMINI_API_KEY);

  const payload = {
    contents: [{ parts: [{ text }], role: "user" }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE_NAME },
        },
      },
    },
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

    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data || "";
    const mimeType = part?.inlineData?.mimeType || "";

    if (!audioData || !mimeType) {
      return jsonResponse(500, { error: "No audio data returned" });
    }

    return jsonResponse(200, { audioData, mimeType });
  } catch (error) {
    console.error("Narrator function error", error);
    return jsonResponse(500, { error: "Audio generation failed", details: error.message });
  }
};
