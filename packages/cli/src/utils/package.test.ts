/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const readPackageUp = vi.fn();

vi.mock('read-package-up', () => ({ readPackageUp }));

async function importPackageUtils() {
  const module = await import('./package.js');
  return module;
}

describe('getPackageJson', () => {
  beforeEach(() => {
    vi.resetModules();
    readPackageUp.mockReset();
  });

  it('returns the package.json content when found', async () => {
    const mockPackageJson = { name: '@google/gemini-cli', version: '0.0.0' };
    readPackageUp.mockResolvedValue({ packageJson: mockPackageJson });

    const { getPackageJson } = await importPackageUtils();
    const result = await getPackageJson();

    expect(result).toEqual(mockPackageJson);
    expect(readPackageUp).toHaveBeenCalledTimes(1);
  });

  it('throws when package.json cannot be located', async () => {
    readPackageUp.mockResolvedValue(undefined);
    const { getPackageJson } = await importPackageUtils();

    await expect(getPackageJson()).rejects.toThrow(
      'Failed to locate package.json for Gemini CLI.',
    );
  });
});
