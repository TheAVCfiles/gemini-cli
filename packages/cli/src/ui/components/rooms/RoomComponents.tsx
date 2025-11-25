/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
import type { RoomMeta } from './types.js';

interface RoomContainerProps {
  readonly meta: RoomMeta;
  readonly children: React.ReactNode;
  readonly ariaLabel?: string;
}

/**
 * Shared container component providing consistent styling for all rooms.
 * Handles the room header, borders, and accessibility attributes.
 */
export const RoomContainer: React.FC<RoomContainerProps> = ({
  meta,
  children,
  ariaLabel,
}) => (
  <Box
    flexDirection="column"
    borderStyle="round"
    borderColor={Colors.AccentPurple}
    paddingX={2}
    paddingY={1}
    aria-label={ariaLabel ?? `${meta.title} - ${meta.subtitle}`}
  >
    <Box marginBottom={1}>
      <Text bold color={Colors.AccentCyan}>
        {meta.title} — {meta.subtitle}
      </Text>
    </Box>
    {children}
    <Box marginTop={1}>
      <Text dimColor>
        Mechanic: {meta.mechanic}
        {meta.mode && ` | Mode: ${meta.mode}`}
      </Text>
    </Box>
  </Box>
);

interface RoomBlockProps {
  readonly children: string;
}

/**
 * Styled code/narrative block for room content.
 * Provides consistent styling for terminal-style text blocks.
 */
export const RoomBlock: React.FC<RoomBlockProps> = ({ children }) => (
  <Box
    borderStyle="single"
    borderColor={Colors.AccentGreen}
    paddingX={1}
    marginY={1}
  >
    <Text color={Colors.AccentGreen}>{children}</Text>
  </Box>
);

interface RoomParagraphProps {
  readonly children: React.ReactNode;
}

/**
 * Styled paragraph for room narrative text.
 */
export const RoomParagraph: React.FC<RoomParagraphProps> = ({ children }) => (
  <Box marginY={1}>
    <Text color={Colors.Foreground}>{children}</Text>
  </Box>
);

interface RoomListProps {
  readonly items: ReadonlyArray<{
    readonly label: string;
    readonly description: string;
  }>;
}

/**
 * Styled list for room choices/options.
 */
export const RoomList: React.FC<RoomListProps> = ({ items }) => (
  <Box flexDirection="column" marginY={1}>
    {items.map((item, index) => (
      <Box key={index} marginLeft={2}>
        <Text>
          <Text bold color={Colors.AccentYellow}>
            {item.label}:
          </Text>{' '}
          <Text color={Colors.Foreground}>{item.description}</Text>
        </Text>
      </Box>
    ))}
  </Box>
);

interface RoomOutcomeProps {
  readonly outcome: string;
  readonly unlocks?: string;
}

/**
 * Displays the outcome/unlock information for a room.
 */
export const RoomOutcome: React.FC<RoomOutcomeProps> = ({
  outcome,
  unlocks,
}) => (
  <Box marginTop={1}>
    <Text color={Colors.AccentBlue}>
      Outcome: {outcome}
      {unlocks && <Text color={Colors.AccentCyan}> → Unlocks {unlocks}</Text>}
    </Text>
  </Box>
);
