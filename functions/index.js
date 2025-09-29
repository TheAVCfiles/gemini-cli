import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { buildSystemInstruction, loadInstructions } from './instructions.js';

if (!admin.apps.length) {
  admin.initializeApp();
}

const FALLBACK_MODEL = 'gemini-1.5-pro';

function normaliseHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .filter((turn) =>
      turn && typeof turn === 'object' && typeof turn.content === 'string' && turn.content.trim(),
    )
    .map((turn) => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.content }],
    }));
}

function parseRequestBody(req) {
  const body = req?.body;
  if (!body || typeof body !== 'object') {
    return {};
  }
  return body;
}

export async function chatHandler(req, res) {
  try {
    const body = parseRequestBody(req);
    const {
      message,
      history = [],
      userId: rawUserId = 'anon',
      model,
      toggles = {},
    } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message required' });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.generativeai_key ||
      process.env.GENERATIVEAI_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key missing' });
    }

    const instr = loadInstructions();
    const chosenModel = model || instr.model?.text || FALLBACK_MODEL;

    const userId =
      typeof rawUserId === 'string' && rawUserId.trim() ? rawUserId.trim() : 'anon';

    const systemInstruction = buildSystemInstruction({
      poetic_on: Boolean(toggles?.poetic_on),
      poetic_off: Boolean(toggles?.poetic_off),
      strict: Boolean(toggles?.strict),
      warm: Boolean(toggles?.warm),
      json_mode: Boolean(toggles?.json_mode),
    });

    const genai = new GoogleGenerativeAI(apiKey);
    const modelClient = genai.getGenerativeModel({
      model: chosenModel,
      systemInstruction,
    });

    const wantsJson = Boolean(toggles?.json_mode);
    const contractHint = wantsJson
      ? 'Respond ONLY in valid JSON with {"answer": string, "notes"?: string, "actions"?: string[]}.'
      : '';

    const turns = normaliseHistory(history);
    const prompt = [contractHint, message.trim()].filter(Boolean).join('\n\n');

    const result = await modelClient.generateContent([
      ...turns,
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ]);

    const responseText =
      typeof result?.response?.text === 'function' ? result.response.text() : '';

    return res.json({
      text: responseText || '',
      model: chosenModel,
      usage: result?.response?.usageMetadata ?? null,
      userId,
    });
  } catch (error) {
    console.error('[chatHandler] Gemini request failed', error);
    const status =
      typeof error?.status === 'number'
        ? error.status
        : typeof error?.response?.status === 'number'
          ? error.response.status
          : 500;
    const message =
      typeof error?.message === 'string' && error.message
        ? error.message
        : 'Gemini request failed';
    return res.status(status).json({ error: message });
  }
}

export default chatHandler;
