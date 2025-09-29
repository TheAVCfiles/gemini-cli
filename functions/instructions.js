import * as fs from 'node:fs';
import * as path from 'node:path';

const DEFAULT_SYSTEM_INSTRUCTION =
  'You are the MWRA glossary assistant. Provide precise, well-sourced answers based on the official glossary dataset.';

let cachedInstructions;

function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Failed to read instructions from ${filePath}:`, error);
    }
    return {};
  }
}

function normaliseSystemInstruction(source) {
  if (typeof source === 'string' && source.trim()) {
    return source.trim();
  }
  if (typeof source === 'object' && source !== null) {
    if (typeof source.system === 'string' && source.system.trim()) {
      return source.system.trim();
    }
    if (typeof source.text === 'string' && source.text.trim()) {
      return source.text.trim();
    }
  }
  return undefined;
}

function extractModelText(source) {
  if (typeof source === 'string' && source.trim()) {
    return source.trim();
  }
  if (typeof source === 'object' && source !== null) {
    if (typeof source.text === 'string' && source.text.trim()) {
      return source.text.trim();
    }
    if (typeof source.model === 'string' && source.model.trim()) {
      return source.model.trim();
    }
  }
  return undefined;
}

export function loadInstructions() {
  if (cachedInstructions) {
    return cachedInstructions;
  }

  const candidatePaths = [
    process.env.GLOSSARY_INSTRUCTIONS_PATH,
    process.env.GEMINI_INSTRUCTIONS_PATH,
    process.env.INSTRUCTIONS_PATH,
    path.join(process.cwd(), 'instructions.json'),
    path.join(process.cwd(), 'instructions', 'instructions.json'),
  ].filter(Boolean);

  let resolvedSystem;
  let resolvedModel;

  for (const candidate of candidatePaths) {
    const parsed = readJsonFile(candidate);
    if (!Object.keys(parsed).length) {
      continue;
    }
    if (!resolvedSystem) {
      resolvedSystem = normaliseSystemInstruction(parsed.system ?? parsed.base ?? parsed);
    }
    if (!resolvedModel) {
      resolvedModel = extractModelText(parsed.model ?? parsed.defaultModel ?? parsed);
    }
    if (resolvedSystem && resolvedModel) {
      break;
    }
  }

  const envSystem = normaliseSystemInstruction(
    process.env.GEMINI_SYSTEM_INSTRUCTION ?? process.env.SYSTEM_INSTRUCTION,
  );
  const envModel = extractModelText(
    process.env.GEMINI_MODEL ?? process.env.GEMINI_TEXT_MODEL ?? process.env.DEFAULT_GEMINI_MODEL,
  );

  const finalSystem = envSystem ?? resolvedSystem ?? DEFAULT_SYSTEM_INSTRUCTION;
  const finalModel = envModel ?? resolvedModel;

  cachedInstructions = {
    system: finalSystem,
    ...(finalModel ? { model: { text: finalModel } } : {}),
  };

  return cachedInstructions;
}

export function buildSystemInstruction(options = {}) {
  const instructions = loadInstructions();
  const parts = [instructions.system];

  const directives = [];

  const poeticOn = Boolean(options.poetic_on);
  const poeticOff = Boolean(options.poetic_off);
  const strict = Boolean(options.strict);
  const warm = Boolean(options.warm);
  const jsonMode = Boolean(options.json_mode);

  if (poeticOff) {
    directives.push('Use clear, direct language without poetic flourishes.');
  } else if (poeticOn) {
    directives.push('Feel free to use a poetic, lyrical tone while staying faithful to the glossary.');
  }

  if (strict) {
    directives.push(
      'Ground every answer in the glossary content. If the glossary lacks information, say so plainly rather than speculating.',
    );
  }

  if (warm) {
    directives.push('Adopt a warm, encouraging tone that remains professional.');
  }

  if (jsonMode) {
    directives.push(
      'Return each response as valid JSON with an "answer" field and optional "notes" or "actions" arrays as appropriate.',
    );
  }

  if (directives.length) {
    parts.push(directives.join(' '));
  }

  return parts.join('\n\n');
}

export function resetInstructionCache() {
  cachedInstructions = undefined;
}
