/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { handler } from '../../netlify/functions/kpi.js';

function buildEvent(overrides = {}) {
  return {
    httpMethod: 'GET',
    queryStringParameters: {},
    ...overrides,
  };
}

describe('kpi Netlify function', () => {
  it('returns fallback data for the default period', async () => {
    const response = await handler(buildEvent());
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.storefront.left.kpis.global_active_labs).toBe(15000);
  });

  it('respects explicit period selection', async () => {
    const response = await handler(
      buildEvent({ queryStringParameters: { period: '2023-q4' } }),
    );
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.storefront.left.kpis.global_active_labs).toBe(6);
  });

  it('returns 404 for unknown periods when no supabase data exists', async () => {
    const response = await handler(
      buildEvent({ queryStringParameters: { period: '1999-Q1' } }),
    );
    expect(response.statusCode).toBe(404);
    const payload = JSON.parse(response.body);
    expect(payload.availablePeriods).toContain('2025-Q4');
  });

  it('rejects unsupported methods', async () => {
    const response = await handler(
      buildEvent({ httpMethod: 'POST', body: '{}' }),
    );
    expect(response.statusCode).toBe(405);
  });
});
