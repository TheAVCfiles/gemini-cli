const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

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
  return `Stub response (set GEMINI_API_KEY or OPENAI_API_KEY to enable live answers):\n${trimmed}`;
}

function normaliseBody(body) {
  if (typeof body !== "object" || body === null) return {};
  return body;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  let parsedBody = {};
  try {
    parsedBody = normaliseBody(JSON.parse(event.body || "{}"));
  } catch (error) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON payload", details: error.message }),
    };
  }

  const prompt = (parsedBody.prompt || "").toString();
  const glossary = Array.isArray(parsedBody.glossary) ? parsedBody.glossary : [];

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

  if (!hasGeminiKey && !hasOpenAIKey) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: stubAnswer(prompt),
        offline: true,
      }),
    };
  }

  try {
    let provider = "openai";
    let answer = "";

    if (hasGeminiKey) {
      provider = "gemini";
      try {
        answer = await callGemini({ prompt, glossary });
      } catch (geminiError) {
        console.warn("Gemini request failed, considering OpenAI fallback", geminiError);
        if (hasOpenAIKey) {
          provider = "openai";
          answer = await callOpenAI({ prompt, glossary });
        } else {
          throw geminiError;
        }
      }
    } else if (hasOpenAIKey) {
      answer = await callOpenAI({ prompt, glossary });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: answer || "No response generated.",
        provider,
      }),
    };
  } catch (error) {
    console.error("Netlify ask function error", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Failed to reach the language model API",
        details: error.message,
      }),
    };
  }
};

async function callOpenAI({ prompt, glossary }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const payload = {
    model: DEFAULT_OPENAI_MODEL,
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

  if (Array.isArray(data.output) && data.output.length) {
    return data.output
      .map((item) => item.content?.[0]?.text || "")
      .join("\n")
      .trim();
  }

  return data.output_text || data.content?.[0]?.text || "";
}

async function callGemini({ prompt, glossary }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  );
  url.searchParams.set("key", process.env.GEMINI_API_KEY);

  const systemInstruction =
    "You are the MWRA glossary assistant. Answer using only the glossary context provided. Respond clearly and concisely.";

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${buildContext(glossary)}\nPrompt: ${prompt}`.trim(),
          },
        ],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.3,
    },
  };

  const response = await globalThis.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini request failed (${response.status})`);
  }

  const parts = data.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
}
