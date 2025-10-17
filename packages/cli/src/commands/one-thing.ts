/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import type { CommandModule } from 'yargs';

interface Task {
  readonly title: string;
  readonly impact?: number;
  readonly urgency?: number;
  readonly effort?: number;
  readonly blocked?: boolean;
}

interface Project {
  readonly name: string;
  readonly goal?: string;
  readonly tasks?: Task[];
}

interface Candidate {
  readonly score: number;
  readonly tieBreaker: number;
  readonly project: Project;
  readonly task: Task;
}

export interface GenerateOptions {
  readonly dataPath?: string;
  readonly logPath?: string | false;
  readonly rng?: () => number;
  readonly now?: Date;
}

const DEFAULT_DATA_FILE = 'projects.json';
const DEFAULT_LOG_FILE = 'progress.log';

export function scoreTask(task: Task): number {
  if (task.blocked) {
    return -1;
  }
  const impact = isFiniteNumber(task.impact) ? task.impact : 1;
  const urgency = isFiniteNumber(task.urgency) ? task.urgency : 1;
  const effortRaw = isFiniteNumber(task.effort) ? task.effort : 1;
  const effort = Math.max(effortRaw, 1);
  return (impact * urgency) / effort;
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function pickCandidate(
  projects: Project[] | undefined,
  rng: () => number = Math.random,
): Candidate | undefined {
  if (!Array.isArray(projects)) {
    return undefined;
  }
  const candidates: Candidate[] = [];
  for (const project of projects) {
    if (!Array.isArray(project.tasks)) {
      continue;
    }
    for (const task of project.tasks) {
      const score = scoreTask(task);
      if (score > 0) {
        candidates.push({
          score,
          tieBreaker: rng(),
          project,
          task,
        });
      }
    }
  }
  if (candidates.length === 0) {
    return undefined;
  }
  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.tieBreaker - a.tieBreaker;
  });
  return candidates[0];
}

export function formatMicroBrief(
  projectName: string,
  goal: string | undefined,
  task: Task,
  now: Date = new Date(),
): string {
  const today = now.toISOString().slice(0, 10);
  const title = task.title;
  const steps = [
    'Open repo/docs for this project',
    `Draft the asset for: ${title}`,
    'Self-check against Definition of Done',
    'Save/commit and log result',
  ];
  const dod = [
    'Clear, shippable artifact produced (doc/section/file)',
    'No TODOs left in text',
    'Stored in the right folder/repo with sensible name',
  ];
  const goalLine = goal?.trim().length ? goal : '(not specified)';
  const firstKeystrokes = `- [ ] ${title}\n\n# Notes\n`;
  return [
    `ONE THING TODAY  —  ${today}`,
    `Project: ${projectName}`,
    `Goal:    ${goalLine}`,
    `Task:    ${title}`,
    '',
    'Why this: highest Impact×Urgency with doable effort (25–45 min).',
    '',
    'Steps:',
    ...steps.map((step) => `- ${step}`),
    '',
    'Definition of Done:',
    ...dod.map((item) => `- ${item}`),
    '',
    'First keystrokes (paste into your doc):',
    firstKeystrokes,
  ].join('\n');
}

export function logTask(
  projectName: string,
  taskTitle: string,
  logPath: string,
  now: Date = new Date(),
): void {
  const line = `${now.toISOString()}\t${projectName}\t${taskTitle}\n`;
  fs.appendFileSync(logPath, line, { encoding: 'utf8' });
}

export function generateMicroBrief({
  dataPath,
  logPath,
  rng = Math.random,
  now = new Date(),
}: GenerateOptions = {}): string {
  const resolvedDataPath = path.resolve(
    process.cwd(),
    dataPath ?? DEFAULT_DATA_FILE,
  );
  if (!fs.existsSync(resolvedDataPath)) {
    throw new Error(
      `Missing projects JSON file at ${resolvedDataPath}. Provide --data to override.`,
    );
  }
  const raw = fs.readFileSync(resolvedDataPath, { encoding: 'utf8' });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to parse ${resolvedDataPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const projects =
    typeof parsed === 'object' && parsed !== null
      ? (parsed as { projects?: Project[] }).projects
      : undefined;
  const candidate = pickCandidate(projects, rng);
  if (!candidate) {
    throw new Error(
      'No unblocked tasks found. Mark something small as unblocked and rerun.',
    );
  }
  if (logPath !== false) {
    const resolvedLogPath = path.resolve(
      process.cwd(),
      logPath ?? DEFAULT_LOG_FILE,
    );
    logTask(candidate.project.name, candidate.task.title, resolvedLogPath, now);
  }
  return formatMicroBrief(
    candidate.project.name,
    candidate.project.goal,
    candidate.task,
    now,
  );
}

interface OneThingArgs {
  readonly data?: string;
  readonly log?: string;
  readonly noLog?: boolean;
}

export const oneThingCommand: CommandModule<
  Record<string, unknown>,
  OneThingArgs
> = {
  command: 'one-thing',
  describe:
    'Generate a micro brief for the highest priority unblocked task in projects.json.',
  builder: (yargsInstance) =>
    yargsInstance
      .option('data', {
        type: 'string',
        describe: 'Path to the projects JSON file.',
      })
      .option('log', {
        type: 'string',
        describe:
          'Path to append the completion log. Defaults to progress.log in the CWD.',
      })
      .option('no-log', {
        type: 'boolean',
        describe: 'Skip writing to the progress log.',
        default: false,
      })
      .example('$0 one-thing', 'Generate a micro brief using projects.json')
      .example(
        '$0 one-thing --data ~/projects.json --log ~/progress.log',
        'Use custom data and log paths.',
      )
      .version(false),
  handler: (args) => {
    try {
      const brief = generateMicroBrief({
        dataPath: args.data,
        logPath: args.noLog ? false : args.log,
      });
      console.log(brief);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred.';
      console.error(message);
      process.exitCode = 1;
    }
  },
};
