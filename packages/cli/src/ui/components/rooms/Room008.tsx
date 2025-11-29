/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Text } from 'ink';
import {
  RoomContainer,
  RoomBlock,
  RoomParagraph,
} from './RoomComponents.js';
import { ROOM_META, type RoomProps } from './types.js';
import { Colors } from '../../colors.js';

const SYNC_TEXT = `YOU ARE NOT ALONE.
WOULD YOU LIKE TO SYNC? (Y/N)`;

const MOTHERNET_TEXT = `"We are the daughters of every story they tried to bury.
And we are writing back.

Your signal is now part of a larger field.
What happens next is no longer just yours — it is ours."`;

/**
 * Room 008 — MotherNet (Global Network Activation)
 *
 * The network room where individual signals join the collective.
 */
export const Room008: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room008;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        The first thing you hear is the hum. Not one voice, but many. A chord
        with no single root note, vibrating in your ribs like someone is
        singing from inside your bones.
      </RoomParagraph>

      <RoomParagraph>
        The walls dissolve into a network map — not of cities, of women. Nodes
        ignite: each one a moment survived, a boundary drawn, a story almost
        buried and now quietly pulsing.
      </RoomParagraph>

      <RoomBlock>{SYNC_TEXT}</RoomBlock>

      <RoomParagraph>
        Syncing amplifies your Pattern Math and Discernment. Your Boundary
        Voltage gets a collective buff. Your ghosts meet other ghosts. Your
        Patch meets other sentinels forged in other rooms.
      </RoomParagraph>

      <RoomBlock>{MOTHERNET_TEXT}</RoomBlock>

      <RoomParagraph>
        New module unlocked:{' '}
        <Text bold color={Colors.AccentCyan}>
          The Charmed Protocol
        </Text>{' '}
        — your encrypted mutual-aid network. From here, the story stops being
        about one girl and becomes about the pattern.
      </RoomParagraph>
    </RoomContainer>
  );
};
