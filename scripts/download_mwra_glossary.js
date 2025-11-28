/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createWriteStream } from 'node:fs';
import { mkdirSync, existsSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const DOWNLOAD_URL = 'https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a/mwra-glossary-firebase.zip?download=1';
const DEFAULT_FILENAME = 'mwra-glossary-firebase.zip';

const HELP_MESSAGE = `Download the Firebase-ready MWRA glossary bundle.\n\n` +
  `Usage:\n` +
  `  node scripts/download_mwra_glossary.js [options]\n\n` +
  `Options:\n` +
  `  -d, --dest <dir>   Destination directory (defaults to current working directory)\n` +
  `  -f, --force        Overwrite an existing archive\n` +
  `  -h, --help         Show this help message`;

function parseArgs(argv) {
  const options = {
    dest: process.cwd(),
    force: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '-d':
      case '--dest': {
        const next = argv[index + 1];
        if (!next || next.startsWith('-')) {
          throw new Error('Expected a directory path after --dest');
        }
        options.dest = next;
        index += 1;
        break;
      }
      case '-f':
      case '--force':
        options.force = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function ensureDestinationDirectory(path) {
  mkdirSync(path, { recursive: true });
}

async function downloadArchive(targetPath, force) {
  if (existsSync(targetPath)) {
    if (!force) {
      throw new Error(
        `${targetPath} already exists. Use --force to overwrite the existing archive.`,
      );
    }
    rmSync(targetPath);
  }

  console.log(`Downloading bundle from ${DOWNLOAD_URL}`);
  const response = await fetch(DOWNLOAD_URL);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Download stream is not available.');
  }

  const tempPath = `${targetPath}.download`;
  await pipeline(response.body, createWriteStream(tempPath));
  renameSync(tempPath, targetPath);
  console.log(`Saved archive to ${targetPath}`);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(String(error));
    console.log();
    console.log(HELP_MESSAGE);
    process.exit(1);
  }

  if (options.help) {
    console.log(HELP_MESSAGE);
    return;
  }

  const destinationDirectory = resolve(options.dest);
  ensureDestinationDirectory(destinationDirectory);
  const targetPath = join(destinationDirectory, DEFAULT_FILENAME);

  try {
    await downloadArchive(targetPath, options.force);
  } catch (error) {
    const tempPath = `${targetPath}.download`;
    if (existsSync(tempPath)) {
      console.warn(`Removing partial download at ${tempPath}`);
      try {
        rmSync(tempPath);
      } catch {
        // Ignore cleanup errors.
      }
    }
    throw error;
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
