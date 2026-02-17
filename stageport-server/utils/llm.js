import fetch from 'node-fetch';

/**
 * callLLM(systemInstruction, userPrompt)
 * - If GEMINI_API_KEY exists, calls Gemini endpoint (server-side).
 * - Otherwise falls back to OpenAI chat completion.
 */
export async function callLLM(systemInstruction, userPrompt) {
  if (process.env.GEMINI_API_KEY) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    };
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error('Gemini error: ' + t);
    }
    const json = await r.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // fallback to OpenAI chat completion
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('OpenAI error: ' + t);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content || '';
}

export async function embedText(text) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-large', input: text }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('Embeddings error: ' + t);
  }
  const j = await r.json();
  return j.data?.[0]?.embedding;
}
