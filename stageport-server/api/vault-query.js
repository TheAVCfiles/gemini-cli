import { PineconeClient } from '@pinecone-database/pinecone';
import { callLLM, embedText } from '../utils/llm.js';

const pinecone = new PineconeClient();
if (process.env.PINECONE_API_KEY) {
  pinecone.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENV,
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST')
      return res.status(405).json({ error: 'Method Not Allowed' });
    const { facultyId, query, topK = 5 } = req.body;
    if (!facultyId || !query)
      return res.status(400).json({ error: 'facultyId and query required' });

    // 1) embed query
    const vector = await embedText(query);

    // 2) query pinecone index in faculty namespace/filter
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const qres = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter: { facultyId },
    });

    const matches = qres.matches || [];
    const sources = matches.map((m) => ({
      id: m.id,
      score: m.score,
      title: m.metadata?.title || m.id,
      excerpt: (m.metadata?.text || '').slice(0, 1200),
      url: m.metadata?.url || null,
      author: m.metadata?.author || facultyId,
    }));

    // 3) Assemble LLM prompt (force citation, JSON output)
    const systemInstruction = `You are a conservatory-level pedagogy summarizer. Given a query and source excerpts, produce JSON with:
  - summary (max 120 words),
  - blurb (2 sentences, program-note friendly),
  - citations: array of {sourceId, excerptUsed (trimmed), reason}.
If the answer cannot be supported, return {"insufficient": true, "sources": [...] }.
Return only valid JSON.`;

    const context = sources
      .map(
        (s, i) =>
          `[[SRC ${i + 1} | id:${s.id} | score:${s.score}]]\n${s.excerpt}\n---`,
      )
      .join('\n');
    const userPrompt = `Query: "${query}"\n\nContext:\n${context}\n\nReturn JSON only.`;

    const llmText = await callLLM(systemInstruction, userPrompt);

    // 4) provenance audit hash
    const crypto = await import('crypto');
    const h = crypto.createHash('sha256');
    sources.forEach((s) =>
      h.update(s.id + '|' + (s.excerpt || '') + '|' + (s.score || '')),
    );
    const auditHash = h.digest('hex');

    res.json({
      facultyId,
      query,
      sources,
      llmText,
      provenanceAuditHash: auditHash,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
