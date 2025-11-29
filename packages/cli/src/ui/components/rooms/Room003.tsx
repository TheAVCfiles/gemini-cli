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
  RoomList,
} from './RoomComponents.js';
import { ROOM_META, type RoomProps } from './types.js';

const GLITCH_DECK_TEXT = `CARD 01 — THE BREAK

"Every system pretends it cannot be interrupted.
Every girl learns otherwise."`;

/**
 * Room 003 — Glitch Deck Preview
 *
 * The archive-dark room where cards reveal themselves.
 */
export const Room003: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room003;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        The room is archive-dark. A single card lies on the table. Not drawn —
        waiting. When you reach for it, it flips itself. Not by magic. By
        recognition.
      </RoomParagraph>

      <RoomBlock>{GLITCH_DECK_TEXT}</RoomBlock>

      <RoomParagraph>
        UPRIGHT: clarity, interruption, truth surfacing despite suppression,
        breaking a pattern that once ran you.
      </RoomParagraph>

      <RoomParagraph>
        INVERTED: an old loop trying to pull you back, the Masked One stirring,
        someone watching your signal from afar.
      </RoomParagraph>

      <RoomParagraph>
        When THE BREAK is revealed, the table generates more cards in a
        triangle: THE OBSERVER, THE MASKED ONE, THE SPLIT. The Deck is not
        predicting a future. It is exposing forces already in motion.
      </RoomParagraph>

      <RoomList
        items={[
          { label: 'Mechanic', description: 'Card revelation, pattern awareness' },
          {
            label: 'Outcome',
            description: 'Unlocks Room 004 — Transmission:Corrupt',
          },
        ]}
      />
    </RoomContainer>
  );
};
