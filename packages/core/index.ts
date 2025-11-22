/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './src/index.ts';
export { Storage } from './src/config/storage.ts';
export {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_FLASH_MODEL,
  DEFAULT_GEMINI_FLASH_LITE_MODEL,
  DEFAULT_GEMINI_EMBEDDING_MODEL,
} from './src/config/models.ts';
export { logIdeConnection } from './src/telemetry/loggers.ts';
export {
  IdeConnectionEvent,
  IdeConnectionType,
} from './src/telemetry/types.ts';
export { makeFakeConfig } from './src/test-utils/config.ts';
export * from './src/utils/pathReader.ts';
