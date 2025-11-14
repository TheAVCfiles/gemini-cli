/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const coreEntry = fileURLToPath(new URL('../core/index.ts', import.meta.url));

export default defineConfig({
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
  resolve: {
    alias: {
      '@google/gemini-cli-core': coreEntry,
      '@google/gemini-cli-core/index.js': coreEntry,
    },
  },
});
