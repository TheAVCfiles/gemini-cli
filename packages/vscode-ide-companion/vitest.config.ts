/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@google/gemini-cli-core': path.resolve(
        dirname,
        '../core/src/index.ts',
      ),
      '../../generated/git-commit.js': path.resolve(
        dirname,
        '../core/generated/git-commit.js',
      ),
    },
  },
  test: {
    reporters: [['default'], ['junit', { outputFile: 'junit.xml' }]],
    passWithNoTests: true,
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
  server: {
    fs: {
      allow: [dirname, path.resolve(dirname, '../core'), path.resolve(dirname, '../core/generated')],
    },
  },
});
