/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const coreSrcDir = fileURLToPath(new URL('../core/src', import.meta.url));
const toPosixPath = (value: string) => value.split(path.sep).join(path.posix.sep);

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@google\/gemini-cli-core\/(.+)$/,
        replacement: toPosixPath(path.join(coreSrcDir, '$1')),
      },
      {
        find: '@google/gemini-cli-core',
        replacement: toPosixPath(path.join(coreSrcDir, 'index.ts')),
      },
    ],
  },
  test: {
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'junit.xml',
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: [
        ['text', { file: 'full-text-summary.txt' }],
        'html',
        'json',
        'lcov',
        'cobertura',
        ['json-summary', { outputFile: 'coverage-summary.json' }],
      ],
    },
  },
});
