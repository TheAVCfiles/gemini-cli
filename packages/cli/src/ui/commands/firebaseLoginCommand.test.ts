/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { firebaseLoginCommand } from './firebaseLoginCommand.js';
import type { CommandContext, ToolActionReturn } from './types.js';

describe('firebaseLoginCommand', () => {
  it('returns a run_shell_command tool action', () => {
    const result = firebaseLoginCommand.action?.(
      {} as CommandContext,
      '',
    ) as ToolActionReturn;

    expect(result.type).toBe('tool');
    expect(result.toolName).toBe('run_shell_command');

    const command = result.toolArgs['command'];
    expect(command).toBe('firebase login');

    const description = result.toolArgs['description'];
    expect(typeof description).toBe('string');
    if (typeof description === 'string') {
      expect(description).toContain('Firebase');
    }
  });
});
