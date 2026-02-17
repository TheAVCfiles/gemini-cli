/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';

import type { Settings } from './settings.js';

const TRUSTED_FOLDERS_FILENAME = 'trustedFolders.json';
const SETTINGS_DIRECTORY_NAME = '.gemini';

export enum TrustLevel {
  TRUST_FOLDER = 'TRUST_FOLDER',
  TRUST_PARENT = 'TRUST_PARENT',
  DO_NOT_TRUST = 'DO_NOT_TRUST',
}

interface TrustedFoldersFile {
  config: Record<string, TrustLevel>;
  path: string;
}

interface TrustedFoldersError {
  message: string;
  path: string;
}

interface LoadedTrustedFolders {
  file: TrustedFoldersFile;
  errors: TrustedFoldersError[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isWithinRoot(location: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(location));
  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  );
}

export function isFolderTrustEnabled(settings: Settings): boolean {
  const featureEnabled =
    settings.security?.folderTrust?.featureEnabled ?? false;
  const settingEnabled = settings.security?.folderTrust?.enabled ?? false;
  return featureEnabled && settingEnabled;
}

function getTrustedFoldersPath(userHome: string): string {
  return path.join(userHome, SETTINGS_DIRECTORY_NAME, TRUSTED_FOLDERS_FILENAME);
}

function loadTrustedFolders(userHome: string): LoadedTrustedFolders {
  const errors: TrustedFoldersError[] = [];
  const userPath = getTrustedFoldersPath(userHome);
  const config: Record<string, TrustLevel> = {};

  try {
    if (fs.existsSync(userPath)) {
      const content = fs.readFileSync(userPath, 'utf-8');
      const parsed = JSON.parse(content) as Record<string, TrustLevel>;
      Object.assign(config, parsed);
    }
  } catch (error: unknown) {
    errors.push({
      message: getErrorMessage(error),
      path: userPath,
    });
  }

  return {
    file: { path: userPath, config },
    errors,
  };
}

function evaluateTrust(
  location: string,
  config: Record<string, TrustLevel>,
): boolean | undefined {
  const trustedPaths: string[] = [];
  const untrustedPaths: string[] = [];

  for (const [rulePath, trustLevel] of Object.entries(config)) {
    switch (trustLevel) {
      case TrustLevel.TRUST_FOLDER:
        trustedPaths.push(rulePath);
        break;
      case TrustLevel.TRUST_PARENT:
        trustedPaths.push(path.dirname(rulePath));
        break;
      case TrustLevel.DO_NOT_TRUST:
        untrustedPaths.push(rulePath);
        break;
      default:
        break;
    }
  }

  for (const trustedPath of trustedPaths) {
    if (isWithinRoot(location, trustedPath)) {
      return true;
    }
  }

  for (const untrustedPath of untrustedPaths) {
    if (path.normalize(location) === path.normalize(untrustedPath)) {
      return false;
    }
  }

  return undefined;
}

export function isWorkspaceTrusted(
  settings: Settings,
  workspaceDir: string = process.cwd(),
): boolean | undefined {
  if (!isFolderTrustEnabled(settings)) {
    return true;
  }

  const userHome = homedir();
  const trustedFolders = loadTrustedFolders(userHome);

  if (trustedFolders.errors.length > 0) {
    for (const error of trustedFolders.errors) {
      console.error(
        `Error loading trusted folders config from ${error.path}: ${error.message}`,
      );
    }
  }

  return evaluateTrust(workspaceDir, trustedFolders.file.config);
}
