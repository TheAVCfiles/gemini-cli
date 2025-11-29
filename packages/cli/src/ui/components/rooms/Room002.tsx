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

const DIARY_LOOP_TEXT = `> The handwriting doesn't match your memory.
Someone has added pages to your diary. Someone has deleted others.
Someone has circled sentences you don't remember writing.

At the bottom of the page, in ink you never owned:
"YOU LOOPED BECAUSE THEY NEEDED YOU TO."

The margin text flickers:
"IF YOU CAN READ THIS, THE LOOP IS CRACKING."`;

/**
 * Room 002 — The Diary Loop Protocol
 *
 * The room where the diary reveals tampering and offers choices.
 */
export const Room002: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room002;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomBlock>{DIARY_LOOP_TEXT}</RoomBlock>

      <RoomParagraph>
        The page waits for a decision. The room tracks which script you choose
        to run:
      </RoomParagraph>

      <RoomList
        items={[
          {
            label: 'DECODE',
            description:
              'Face the truth. See that you were overwritten, not erased. Unlocks Room 003.',
          },
          {
            label: 'DISTORT',
            description:
              'Loop the sentence until the pattern reveals its weak points. The Masked One stirs.',
          },
          {
            label: 'DIVERT',
            description:
              "Follow the Observer's thread. Someone has been watching your signal for a long time.",
          },
        ]}
      />

      <RoomParagraph>
        Once THE BREAK card is later pulled in Room 003, this loop can never be
        rerun. The diary becomes immutable. Finally.
      </RoomParagraph>
    </RoomContainer>
  );
};
