/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWeeklyReport } from '../buildWeeklyReport.ts';

describe('buildWeeklyReport', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateWeeklyReport', () => {
    it('should return a valid report structure', () => {
      const report = generateWeeklyReport();

      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('weekStart');
      expect(report).toHaveProperty('weekEnd');
      expect(report).toHaveProperty('gitCommit');
      expect(report).toHaveProperty('version');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('staticEndpoints');
    });

    it('should have valid date format for generatedAt', () => {
      const report = generateWeeklyReport();

      const date = new Date(report.generatedAt);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should have valid week bounds', () => {
      const report = generateWeeklyReport();

      const weekStart = new Date(report.weekStart);
      const weekEnd = new Date(report.weekEnd);

      expect(weekStart.toString()).not.toBe('Invalid Date');
      expect(weekEnd.toString()).not.toBe('Invalid Date');
      expect(weekEnd.getTime()).toBeGreaterThan(weekStart.getTime());
    });

    it('should have metrics object with expected properties', () => {
      const report = generateWeeklyReport();

      expect(report.metrics).toHaveProperty('staticRoutes');
      expect(report.metrics).toHaveProperty('dynamicRoutes');
      expect(report.metrics).toHaveProperty('totalAssets');
      expect(typeof report.metrics.staticRoutes).toBe('number');
      expect(typeof report.metrics.dynamicRoutes).toBe('number');
      expect(typeof report.metrics.totalAssets).toBe('number');
    });

    it('should have static endpoints as an array', () => {
      const report = generateWeeklyReport();

      expect(Array.isArray(report.staticEndpoints)).toBe(true);
      expect(report.staticEndpoints.length).toBeGreaterThan(0);
    });

    it('should include report-latest.json in static endpoints', () => {
      const report = generateWeeklyReport();

      expect(report.staticEndpoints).toContain('/data/report-latest.json');
    });
  });
});
