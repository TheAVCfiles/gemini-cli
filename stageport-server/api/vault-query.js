import crypto from 'node:crypto';
import { PineconeClient } from '@pinecone-database/pinecone';
import { callLLM, embedText } from '../utils/llm.js';

const pinecone = new PineconeClient();
let pineconeReady;

async function ensurePineconeReady() {
  if (!pineconeReady) {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENV) {
      throw new Error('Pinecone env vars are required');
    }
    pineconeReady = pinecone.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENV,
    });
  }
  await pineconeReady;
  return pinecone.Index(process.env.PINECONE_INDEX_NAME);
}

function buildAuditHash(slices) {
  const hash = crypto.createHash('sha256');
  slices.forEach((slice) =>
    hash.update(`${slice.id}|${slice.excerpt || ''}|${slice.score || ''}`),
  );
  return hash.digest('hex');
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    const { facultyId, query, topK = 5 } = req.body || {};
    if (!facultyId || !query) {
      return res.status(400).json({ error: 'facultyId and query required' });
    }

    const vector = await embedText(query);

    const index = await ensurePineconeReady();
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
      excerpt: (m.metadata?.text || '').slice(0, 800),
      url: m.metadata?.url || null,
      author: m.metadata?.author || facultyId,
      createdAt: m.metadata?.createdAt || null,
    }));

    const systemInstruction = `You are a conservatory-grade pedagogy summarizer. Given a query and source excerpts, produce JSON with keys:\n    - summary (max 120 words)\n    - blurb (2 sentences, program-note friendly)\n    - citations: array [{sourceId, excerptUsed, reason}]\n    If answer cannot be supported by sources, return {"insufficient": true, "sources": [...]}.
    `;
    const context = sources
      .map(
        (s, i) =>
          `[[SRC ${i + 1} | id:${s.id} | score:${s.score}]]\n${s.excerpt}\n---`,
      )
      .join('\n');
    const userPrompt = `Query: "${query}"\n\nContext:\n${context}\n\nReturn JSON only.`;

    const llmText = await callLLM(systemInstruction, userPrompt);
    const auditHash = buildAuditHash(sources);

    return res.json({
      facultyId,
      query,
      sources,
      llmText,
      provenanceAuditHash: auditHash,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
