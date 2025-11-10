/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SmlBlock {
  cast: string;
  fields: Record<string, string>;
  effects: string[];
  source?: string;
}

export interface SmlEvent extends SmlBlock {
  timestamp: string;
}

const BLOCK_HEADER = /^\[Cast:\s*([^\]]+)\]\s*$/i;
const FIELD_LINE = /^([A-Za-z][A-Za-z0-9_.-]*):\s*(.*)$/;

/**
 * Parse SML text into structured blocks.
 */
export function parseSml(text: string, source?: string): SmlBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: SmlBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? '';
    const match = BLOCK_HEADER.exec(line);
    if (!match) {
      index += 1;
      continue;
    }

    const cast = match[1].trim();
    index += 1;

    const fields: Record<string, string> = {};
    const effects: string[] = [];

    let collectingField = false;
    let currentFieldKey: string | null = null;
    let currentFieldLines: string[] = [];
    let inEffectBlock = false;

    const finalizeField = () => {
      if (collectingField && currentFieldKey) {
        const value = currentFieldLines.join('\n');
        fields[currentFieldKey] = value;
      }
      collectingField = false;
      currentFieldKey = null;
      currentFieldLines = [];
    };

    while (index < lines.length) {
      const rawLine = lines[index] ?? '';
      const trimmed = rawLine.trim();

      if (BLOCK_HEADER.test(trimmed)) {
        finalizeField();
        break;
      }

      if (trimmed === '') {
        if (collectingField) {
          finalizeField();
        }
        if (inEffectBlock) {
          inEffectBlock = false;
        }
        index += 1;
        continue;
      }

      if (trimmed.startsWith('#')) {
        index += 1;
        continue;
      }

      if (inEffectBlock) {
        if (trimmed.startsWith('->')) {
          effects.push(trimmed.slice(2).trim());
          index += 1;
          continue;
        }

        if (FIELD_LINE.test(trimmed)) {
          inEffectBlock = false;
          continue;
        }

        // Ignore other lines inside Effect block for now.
        index += 1;
        continue;
      }

      if (collectingField) {
        if (/^[ \t]/.test(rawLine)) {
          currentFieldLines.push(trimmed);
          index += 1;
          continue;
        }

        finalizeField();
        continue;
      }

      if (trimmed === 'Effect:') {
        finalizeField();
        inEffectBlock = true;
        index += 1;
        continue;
      }

      const fieldMatch = FIELD_LINE.exec(trimmed);
      if (fieldMatch) {
        finalizeField();
        currentFieldKey = fieldMatch[1];
        const initialValue = fieldMatch[2] ?? '';
        currentFieldLines = initialValue ? [initialValue] : [];
        collectingField = true;
        index += 1;
        continue;
      }

      // Unhandled content outside a known section. Advance to prevent infinite loops.
      index += 1;
    }

    finalizeField();

    blocks.push({
      cast,
      fields,
      effects,
      source,
    });
  }

  return blocks;
}

export interface CreateEventOptions {
  timestamp?: string;
}

export function createSmlEvents(
  blocks: readonly SmlBlock[],
  options: CreateEventOptions = {},
): SmlEvent[] {
  const timestamp = options.timestamp ?? new Date().toISOString();
  return blocks.map((block) => ({
    ...block,
    timestamp,
  }));
}
