/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const generatedPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../generated/git-commit.js',
);

let gitCommitInfo = 'N/A';
let cliVersion = 'UNKNOWN';

if (existsSync(generatedPath)) {
  const generated = await import(pathToFileURL(generatedPath).href);
  gitCommitInfo = generated.GIT_COMMIT_INFO ?? gitCommitInfo;
  cliVersion = generated.CLI_VERSION ?? cliVersion;
}

export const GIT_COMMIT_INFO = gitCommitInfo;
export const CLI_VERSION = cliVersion;
