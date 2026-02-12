/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { CommandModule } from 'yargs';
import {
  createSmlEvents,
  parseSml,
  type SmlEvent,
  type SmlBlock,
} from '../utils/sml/parseSml.js';
import { FatalInputError } from '@google/gemini-cli-core';

interface HandlerArgs {
  target: string;
  render?: boolean;
  output?: string;
  pretty?: boolean;
  python?: string;
}

async function readSmlTargets(targetPath: string): Promise<string[]> {
  let stat;
  try {
    stat = await fs.stat(targetPath);
  } catch (error) {
    throw new FatalInputError(`Unable to read SML target: ${String(error)}`);
  }

  if (stat.isDirectory()) {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sml'))
      .map((entry) => path.join(targetPath, entry.name))
      .sort((a, b) => a.localeCompare(b));
  }

  if (stat.isFile()) {
    return [targetPath];
  }

  throw new FatalInputError('Target path must be a file or directory.');
}

async function parseFiles(files: readonly string[]): Promise<SmlBlock[]> {
  const blocks: SmlBlock[] = [];
  for (const file of files) {
    const contents = await fs.readFile(file, 'utf-8');
    const source = path.relative(process.cwd(), file) || path.basename(file);
    blocks.push(...parseSml(contents, source));
  }
  return blocks;
}

function emitEvents(events: readonly SmlEvent[], pretty: boolean | undefined) {
  const indent = pretty ? 2 : undefined;
  for (const event of events) {
    process.stdout.write(`${JSON.stringify(event, null, indent)}\n`);
  }
}

async function maybeRender(
  events: readonly SmlEvent[],
  pythonExecutable: string | undefined,
): Promise<void> {
  if (!events.length) {
    return;
  }

  const rendererPath = fileURLToPath(
    new URL('../resources/sml_renderer.py', import.meta.url),
  );

  const executable = pythonExecutable ?? 'python3';
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, [rendererPath], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.stdin.write(JSON.stringify(events));
    child.stdin.end();

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new FatalInputError('Renderer exited with an error.'));
      }
    });
  });
}

export const smlCommand: CommandModule<unknown, HandlerArgs> = {
  command: 'sml <target>',
  describe:
    'Parse Sourcery Markup Language files and emit JSON events. Optionally render via Tkinter.',
  builder: (yargs) =>
    yargs
      .positional('target', {
        type: 'string',
        describe: 'Path to an .sml file or a directory of .sml files',
      })
      .option('render', {
        type: 'boolean',
        describe: 'Render the events using the Tkinter-based tiny stage (requires Python with Tk).',
        default: false,
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        describe: 'Write JSONL output to a file instead of stdout.',
      })
      .option('pretty', {
        type: 'boolean',
        describe: 'Pretty-print JSON output.',
        default: false,
      })
      .option('python', {
        type: 'string',
        describe: 'Python executable to use for rendering (default: python3).',
      })
      .example(
        '$0 sml examples/bloom_in_quiet.sml',
        'Emit JSON events for a single spell.',
      )
      .example(
        '$0 sml examples --render',
        'Play every spell in a directory through the Tkinter renderer.',
      )
      .version(false),
  handler: async (argv) => {
    const { target, render, output, pretty, python } = argv;
    if (!target) {
      throw new FatalInputError('A target file or directory is required.');
    }

    const files = await readSmlTargets(path.resolve(String(target)));
    if (files.length === 0) {
      throw new FatalInputError('No .sml files were found in the provided target.');
    }

    const blocks = await parseFiles(files);
    const events = createSmlEvents(blocks);

    if (output) {
      const indent = pretty ? 2 : undefined;
      const lines = events.map((event) => JSON.stringify(event, null, indent));
      await fs.writeFile(output, `${lines.join('\n')}\n`, 'utf-8');
    } else {
      emitEvents(events, pretty);
    }

    if (render) {
      try {
        await maybeRender(events, python);
      } catch (error) {
        throw new FatalInputError(
          `Failed to launch renderer: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  },
};
