/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Settings } from './settings.js';

function mockHomedir(tempHome: string) {
  vi.doMock('node:os', () => ({
    homedir: () => tempHome,
  }));
}

describe('folder trust', () => {
  let tempHome: string;
  let tempWorkspace: string;

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(tmpdir(), 'foldertrust-home-'));
    tempWorkspace = fs.mkdtempSync(path.join(tmpdir(), 'workspace-'));
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock('node:os');
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempWorkspace, { recursive: true, force: true });
  });

  it('trusts the workspace when folder trust is disabled', async () => {
    mockHomedir(tempHome);
    const { isWorkspaceTrusted } = await import('./folderTrust.js');

    const settings: Settings = {
      security: {
        folderTrust: {
          featureEnabled: false,
          enabled: false,
        },
      },
    };

    expect(isWorkspaceTrusted(settings, tempWorkspace)).toBe(true);
  });

  it('blocks workspace discovery when the folder is explicitly untrusted', async () => {
    const trustedFolderPath = path.join(tempHome, '.gemini');
    fs.mkdirSync(trustedFolderPath, { recursive: true });
    const trustFilePath = path.join(trustedFolderPath, 'trustedFolders.json');
    const trustConfig = { [tempWorkspace]: 'DO_NOT_TRUST' };
    fs.writeFileSync(trustFilePath, JSON.stringify(trustConfig));

    mockHomedir(tempHome);
    const { TrustLevel, isWorkspaceTrusted } = await import('./folderTrust.js');

    const settings: Settings = {
      security: {
        folderTrust: {
          featureEnabled: true,
          enabled: true,
        },
      },
    };

    expect(isWorkspaceTrusted(settings, tempWorkspace)).toBe(false);
    expect(trustConfig[tempWorkspace]).toBe(TrustLevel.DO_NOT_TRUST);
  });
});
