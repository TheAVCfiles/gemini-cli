/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';

/**
 * Provides a shortcut for authenticating the Firebase CLI.
 */
export const firebaseLoginCommand: SlashCommand = {
  name: 'firebase-login',
  description: 'Authenticate with the Firebase CLI',
  kind: CommandKind.BUILT_IN,
  action: () => ({
    type: 'tool',
    toolName: 'run_shell_command',
    toolArgs: {
      description:
        'Open a browser to complete Firebase CLI authentication.',
      command: 'firebase login',
    },
  }),
};
