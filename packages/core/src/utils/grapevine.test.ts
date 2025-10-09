import { describe, expect, it } from 'vitest';

import { grapevine, type GrapevineSignal } from './grapevine';

describe('grapevine', () => {
  it('analyzes past, present, and future for an upward trend', () => {
    const signal: GrapevineSignal = {
      values: [1, 2, 3, 4, 5],
    };

    const report = grapevine(signal);

    expect(report.behind.mean).toBeCloseTo(2.5, 5);
    expect(report.behind.trend).toBe('upward');
    expect(report.step.classification).toBe('spike');
    expect(report.step.delta).toBeCloseTo(1, 5);
    expect(report.front.forecast).toBeGreaterThan(5);
    expect(report.front.confidence).toBeGreaterThan(0.7);
    expect(report.front.confidence).toBeLessThanOrEqual(1);
  });

  it('provides sensible defaults when only a single value is available', () => {
    const signal: GrapevineSignal = {
      values: [3],
    };

    const report = grapevine(signal);

    expect(report.behind.mean).toBe(3);
    expect(report.behind.variance).toBe(0);
    expect(report.behind.trend).toBe('flat');
    expect(report.step.classification).toBe('steady');
    expect(report.step.delta).toBe(0);
    expect(report.front.forecast).toBe(3);
    expect(report.front.confidence).toBe(0);
    expect(report.front.horizon).toBe(1);
  });

  it('detects a downward move when the latest value drops sharply', () => {
    const signal: GrapevineSignal = {
      values: [10, 9.5, 9.25, 8],
    };

    const report = grapevine(signal);

    expect(report.behind.trend).toBe('downward');
    expect(report.step.classification).toBe('dip');
    expect(report.step.delta).toBeCloseTo(-1.25, 5);
    expect(report.front.forecast).toBeLessThan(8);
    expect(report.front.confidence).toBeGreaterThanOrEqual(0);
    expect(report.front.confidence).toBeLessThanOrEqual(1);
  });
});
