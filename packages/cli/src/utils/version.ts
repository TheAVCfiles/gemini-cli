/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPackageJson } from './package.js';

export async function getCliVersion(): Promise<string> {
  const envVersion = process.env['CLI_VERSION']?.trim();
  if (envVersion) {
    return envVersion;
  }

  const pkgJson = await getPackageJson();
  return pkgJson?.version || 'unknown';
}
