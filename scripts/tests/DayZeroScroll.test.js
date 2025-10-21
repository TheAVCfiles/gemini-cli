/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { runDayZeroUnitTests, runEphemerisUnitTests } from './DayZeroScroll.js';

describe('DayZero Scroll data validations', () => {
  it('validates the MWRA glossary dataset', async () => {
    const summary = await runDayZeroUnitTests();
    expect(summary.totalEntries).toBeGreaterThan(0);
    expect(summary.minimumDefinitionLength).toBeGreaterThanOrEqual(40);
  });

  it('validates the Decrypt the Future ephemeris sample', async () => {
    const summary = await runEphemerisUnitTests();
    expect(summary.transitCount).toBeGreaterThan(0);
    expect(summary.dailyScoreCount).toBeGreaterThan(0);
    expect(summary.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(summary.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
