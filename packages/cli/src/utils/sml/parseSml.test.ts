/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { createSmlEvents, parseSml } from './parseSml.js';

const SAMPLE = `# Minimal spell — console only
[Cast: Glitch.Glissade]
Domain: Movement
Phase: PREP -> JETÉ
Intent: Stabilize Structure / Confirm Glitch
Trigger:
    when tri_score > 4.5 and structure_ok = true
Effect:
    -> narrate("Structure confirmed. Preparing for potential Jeté.")
    -> cue_state("GlisséEngineFSM", to="PREP")
Tone: Quiet, Elastic
`;

describe('parseSml', () => {
  it('parses a basic block', () => {
    const blocks = parseSml(SAMPLE, 'glitch_glissade.sml');
    expect(blocks).toHaveLength(1);
    const [block] = blocks;
    expect(block.cast).toBe('Glitch.Glissade');
    expect(block.source).toBe('glitch_glissade.sml');
    expect(block.effects).toEqual([
      'narrate("Structure confirmed. Preparing for potential Jeté.")',
      'cue_state("GlisséEngineFSM", to="PREP")',
    ]);
    expect(block.fields['Trigger']).toBe(
      'when tri_score > 4.5 and structure_ok = true',
    );
    expect(block.fields['Tone']).toBe('Quiet, Elastic');
  });

  it('handles multiple blocks', () => {
    const blocks = parseSml(`${SAMPLE}\n${SAMPLE}`);
    expect(blocks).toHaveLength(2);
  });
});

describe('createSmlEvents', () => {
  it('applies a consistent timestamp', () => {
    const blocks = parseSml(SAMPLE);
    const events = createSmlEvents(blocks, {
      timestamp: '2025-11-08T00:00:00Z',
    });
    expect(events).toHaveLength(1);
    expect(events[0].timestamp).toBe('2025-11-08T00:00:00Z');
  });
});
