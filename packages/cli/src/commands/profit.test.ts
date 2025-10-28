/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildProfitPlan } from './profit.js';

describe('profit command planning model', () => {
  it('computes a leverage plan with bounded inputs', () => {
    const plan = buildProfitPlan({
      teamSize: 2,
      hourlyRate: 120,
      automationHours: 5,
      conversionRate: 0.25,
      offerValue: 8000,
      automationInvestment: 10000,
    });

    expect(plan.weeklyTeamCapacity).toBeCloseTo(10);
    expect(plan.annualHoursRedeployed).toBeCloseTo(480);
    expect(plan.annualLaborValue).toBeCloseTo(57600);
    expect(plan.quarterlyOpportunitiesCreated).toBeCloseTo(21.67, 2);
    expect(plan.quarterlyDealsClosed).toBeCloseTo(5.42, 2);
    expect(plan.annualNewRevenue).toBeCloseTo(173333.33, 2);
    expect(plan.paybackWeeks).toBeCloseTo(8.33, 2);
    expect(plan.roiMultiple).toBeGreaterThan(20);
  });

  it('guards against invalid values', () => {
    const plan = buildProfitPlan({
      teamSize: -1,
      hourlyRate: -50,
      automationHours: -3,
      conversionRate: 2,
      offerValue: -4000,
      automationInvestment: -2000,
    });

    expect(plan.weeklyTeamCapacity).toBe(0);
    expect(plan.annualHoursRedeployed).toBe(0);
    expect(plan.annualLaborValue).toBe(0);
    expect(plan.quarterlyOpportunitiesCreated).toBe(0);
    expect(plan.quarterlyDealsClosed).toBe(0);
    expect(plan.annualNewRevenue).toBe(0);
    expect(plan.paybackWeeks).toBe(Number.POSITIVE_INFINITY);
    expect(plan.roiMultiple).toBe(Number.POSITIVE_INFINITY);
  });
});
