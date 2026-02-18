/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const coreEntryPoint = fileURLToPath(new URL('../core/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@google/gemini-cli-core': coreEntryPoint,
    },
  },
});
