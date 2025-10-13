/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const RESPONSES = {
  who: 'first',
  what: 'second',
  idk: 'third',
} as const;

type Caller = keyof typeof RESPONSES;

type Response = (typeof RESPONSES)[Caller];

/**
 * Returns the correct Abbott and Costello routine response for a caller.
 *
 * The previous implementation appended a question mark to every response,
 * which made even valid calls look incorrect (e.g. `first?`). This helper
 * returns the exact scripted line instead.
 *
 * @throws {Error} If an unknown caller is provided.
 */
export function whosOnFirst(call: string): Response {
  if (!Object.hasOwn(RESPONSES, call)) {
    throw new Error('API Qui? Unknown caller');
  }

  return RESPONSES[call as Caller];
}
