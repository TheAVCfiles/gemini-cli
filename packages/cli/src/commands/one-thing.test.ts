/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import process from 'node:process';
import {
  formatMicroBrief,
  generateMicroBrief,
  pickCandidate,
  scoreTask,
} from './one-thing.js';

describe('scoreTask', () => {
  it('returns -1 for blocked tasks', () => {
    expect(scoreTask({ title: 'Blocked', blocked: true })).toBe(-1);
  });

  it('defaults missing values to 1', () => {
    expect(scoreTask({ title: 'Defaults' })).toBe(1);
  });

  it('calculates score using impact, urgency, and effort', () => {
    expect(
      scoreTask({
        title: 'Scored',
        impact: 3,
        urgency: 2,
        effort: 2,
      }),
    ).toBeCloseTo(3);
  });
});

describe('pickCandidate', () => {
  it('returns undefined when no projects are provided', () => {
    expect(pickCandidate(undefined)).toBeUndefined();
  });

  it('skips blocked tasks and selects the highest score', () => {
    const projects = [
      {
        name: 'Alpha',
        tasks: [
          { title: 'Blocked', blocked: true },
          { title: 'Top', impact: 4, urgency: 2, effort: 2 },
          { title: 'Lower', impact: 2, urgency: 1, effort: 2 },
        ],
      },
    ];
    const candidate = pickCandidate(projects, () => 0.5);
    expect(candidate?.task.title).toBe('Top');
  });

  it('uses the provided rng for tie-breaking', () => {
    const projects = [
      {
        name: 'Alpha',
        tasks: [
          { title: 'First', impact: 2, urgency: 2, effort: 2 },
          { title: 'Second', impact: 2, urgency: 2, effort: 2 },
        ],
      },
    ];
    const candidate = pickCandidate(projects, () => 0.25);
    expect(candidate?.task.title).toBeDefined();
  });
});

describe('formatMicroBrief', () => {
  it('renders the expected micro brief text', () => {
    const now = new Date('2025-02-14T10:00:00Z');
    const brief = formatMicroBrief(
      'Project X',
      'Launch the flagship UI.',
      { title: 'Write release notes' },
      now,
    );
    expect(brief).toContain('ONE THING TODAY  —  2025-02-14');
    expect(brief).toContain('Project: Project X');
    expect(brief).toContain('Goal:    Launch the flagship UI.');
    expect(brief).toContain('Task:    Write release notes');
    expect(brief).toContain('- [ ] Write release notes');
  });
});

describe('generateMicroBrief', () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  afterEach(() => {
    process.chdir(originalCwd);
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates a brief and logs progress using defaults', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'one-thing-'));
    process.chdir(tempDir);
    fs.writeFileSync(
      'projects.json',
      JSON.stringify({
        projects: [
          {
            name: 'Alpha',
            goal: 'Ship the analytics report.',
            tasks: [
              { title: 'Draft outline', impact: 3, urgency: 2, effort: 2 },
            ],
          },
        ],
      }),
      { encoding: 'utf8' },
    );

    const now = new Date('2025-02-14T10:00:00Z');
    const brief = generateMicroBrief({ now, rng: () => 0.42 });

    expect(brief).toContain('Alpha');
    expect(brief).toContain('Draft outline');

    const logContents = fs.readFileSync('progress.log', 'utf8').trim();
    expect(logContents).toBe('2025-02-14T10:00:00.000Z\tAlpha\tDraft outline');
  });

  it('throws when the projects file is missing', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'one-thing-'));
    process.chdir(tempDir);

    expect(() => generateMicroBrief({ rng: () => 0.5 })).toThrow(
      /Missing projects/,
    );
  });
});
