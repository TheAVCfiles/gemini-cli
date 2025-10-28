/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  createExecutivePackContents,
  writeExecutivePackZip,
} from '../generate-executive-pack.js';

const FIXED_DATE = new Date('2025-01-02T03:04:05.000Z');

describe('createExecutivePackContents', () => {
  it('includes the key assets for the executive bundle', () => {
    const files = createExecutivePackContents(FIXED_DATE);
    const paths = Array.from(files.keys());

    expect(paths).toEqual(
      expect.arrayContaining([
        'README.md',
        'stripe/products.json',
        'stripe/webhook-test.md',
        'make/cloud-offer-close.json',
        'make/8765-cohort-sale.json',
        'make/services-retainer.json',
        'webhooks/edge/route.ts',
        'webhooks/express/server.js',
        'landing/index.html',
        'landing/notion-export.md',
        'dashboard/poll-metrics.js',
      ]),
    );

    const stripeProducts = JSON.parse(files.get('stripe/products.json'));
    expect(stripeProducts.products).toHaveLength(3);
    expect(stripeProducts.products[0].price.amount).toBe(75000);

    const landingPage = files.get('landing/index.html');
    expect(landingPage).toContain('Intuition Labs Executive Entry Portal');
    expect(landingPage).toContain('All purchases auto-generate your onboarding link within 5 minutes.');

    const notion = files.get('landing/notion-export.md');
    expect(notion).toContain('Stripe + Make + Supabase automate receipts');
  });
});

describe('writeExecutivePackZip', () => {
  it('writes the bundle to disk with a non-empty archive', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'executive-pack-'));
    const outputPath = path.join(tempDir, 'bundle.zip');

    try {
      const files = createExecutivePackContents(FIXED_DATE);
      const result = await writeExecutivePackZip(files, { outputPath });
      expect(result.fileCount).toBe(files.size);

      const archiveStat = await stat(outputPath);
      expect(archiveStat.size).toBeGreaterThan(1024);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
