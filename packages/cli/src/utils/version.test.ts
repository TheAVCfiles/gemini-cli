/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCliVersion } from './version.js';
import { getPackageJson, type PackageJson } from './package.js';

vi.mock('./package.js', () => ({
  getPackageJson: vi.fn(),
}));

describe('getCliVersion', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
    delete process.env['CLI_VERSION'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the CLI version from the environment when available', async () => {
    process.env['CLI_VERSION'] = ' 0.9.0 ';

    const version = await getCliVersion();

    expect(version).toBe('0.9.0');
    expect(getPackageJson).not.toHaveBeenCalled();
  });

  it('falls back to the package.json version when the environment is unset', async () => {
    const packageJson = { name: 'gemini-cli', version: '1.2.3' } as PackageJson;
    vi.mocked(getPackageJson).mockResolvedValue(packageJson);

    const version = await getCliVersion();

    expect(version).toBe('1.2.3');
    expect(getPackageJson).toHaveBeenCalledTimes(1);
  });

  it('falls back to package.json when the environment variable is blank', async () => {
    process.env['CLI_VERSION'] = '   ';
    const packageJson = { name: 'gemini-cli', version: '4.5.6' } as PackageJson;
    vi.mocked(getPackageJson).mockResolvedValue(packageJson);

    const version = await getCliVersion();

    expect(version).toBe('4.5.6');
    expect(getPackageJson).toHaveBeenCalledTimes(1);
  });

  it('returns "unknown" when no version information is available', async () => {
    vi.mocked(getPackageJson).mockResolvedValue(undefined);

    const version = await getCliVersion();

    expect(version).toBe('unknown');
  });
});
