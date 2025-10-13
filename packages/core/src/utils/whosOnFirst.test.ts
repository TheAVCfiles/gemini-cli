/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { whosOnFirst } from './whosOnFirst.js';

describe('whosOnFirst', () => {
  it('returns the expected response for known callers', () => {
    expect(whosOnFirst('who')).toBe('first');
    expect(whosOnFirst('what')).toBe('second');
    expect(whosOnFirst('idk')).toBe('third');
  });

  it('throws for an unknown caller', () => {
    expect(() => whosOnFirst('why')).toThrowError('API Qui? Unknown caller');
  });
});
