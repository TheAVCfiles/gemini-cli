const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

function buildContext(glossary = []) {
  if (!Array.isArray(glossary) || !glossary.length) {
    return "";
  }
  const items = glossary
    .slice(0, 25)
    .map((entry) => `- ${entry.term}: ${entry.definition}`)
    .join("\n");
  return `Reference glossary entries:\n${items}\n`;
}

function stubAnswer(prompt) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return "Provide a prompt and I will summarize the requested glossary content.";
  }
  return `Stub response (set OPENAI_API_KEY to enable live answers):\n${trimmed}`;
}

function normaliseBody(body) {
  if (typeof body !== "object" || body === null) return {};
  return body;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }

  let parsedBody = {};
  try {
    parsedBody = normaliseBody(JSON.parse(event.body || "{}"));
  } catch (error) {
    return jsonResponse(400, { message: "Invalid JSON payload", details: error.message });
  }

  const prompt = (parsedBody.prompt || "").toString();
  const glossary = Array.isArray(parsedBody.glossary) ? parsedBody.glossary : [];

  if (!prompt.trim()) {
    return jsonResponse(400, { message: "Prompt is required" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(200, {
      answer: stubAnswer(prompt),
      offline: true,
    });
  }

  try {
    const payload = {
      model: DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are the MWRA glossary assistant. Answer using only the glossary context provided. Respond clearly and concisely.",
        },
        {
          role: "user",
          content: `${buildContext(glossary)}\nPrompt: ${prompt}`,
        },
      ],
      max_output_tokens: 600,
    };

    const response = await globalThis.fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI request failed (${response.status})`);
    }

    const answer = Array.isArray(data.output) && data.output.length
      ? data.output.map((item) => item.content?.[0]?.text || "").join("\n").trim()
      : data.output_text || data.content?.[0]?.text || "";

    return jsonResponse(200, { answer: answer || "No response generated." });
  } catch (error) {
    console.error("Netlify ask function error", error);
    return jsonResponse(500, { message: "Failed to reach the OpenAI API", details: error.message });
  }
};
