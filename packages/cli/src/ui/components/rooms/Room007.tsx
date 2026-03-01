/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import {
  RoomContainer,
  RoomBlock,
  RoomParagraph,
} from './RoomComponents.js';
import { ROOM_META, type RoomProps } from './types.js';

const ARCHITECT_TEXT = `WELCOME, ARCHITECT.
SELECT YOUR NEXT OPERATION:

[UPGRADE ATTRIBUTES]
[RECODE BELIEFS]
[ASSIGN ROLES]
[SAVE PROGRESS]`;

/**
 * Room 007 — The Architect's Table
 *
 * The first room that feels like home. A studio.
 */
export const Room007: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room007;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        The first room that feels undeniably, unapologetically like home. Not a
        trap, not a test, not a loop. A studio. An inner one.
      </RoomParagraph>

      <RoomParagraph>
        A circular table anchors the space, its four legs carved from:
        Girlhood, Survival, Awakening, Mastery. On the surface: the Glitch
        Deck, the Diary, the Mask, the Observer&apos;s Eye, THE BREAK card, and a
        glowing console.
      </RoomParagraph>

      <RoomBlock>{ARCHITECT_TEXT}</RoomBlock>

      <RoomParagraph>
        This is your Home Base. Here you level up Clarity, Embodiment,
        Discernment, Pattern Math, Voice Gain, and Boundary Voltage. Here you
        decide who stays in the story and in what role.
      </RoomParagraph>

      <RoomParagraph>From this table, Arc II begins.</RoomParagraph>
    </RoomContainer>
  );
};
