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

const BOOT_SEQUENCE_TEXT = `> ECHO ENGINE ONLINE
> SIGNAL: GIRL
> STATUS: MISRENDERED

Action: Calibrate? (Y/N)`;

/**
 * Room 001 — Boot Sequence / Echo Engine
 *
 * The starting room where the system wakes and listens.
 * This is about consent and self-recognition.
 */
export const Room001: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room001;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        The system wakes like a spine uncurling. The first thing it does is
        listen. Not to them. To you.
      </RoomParagraph>

      <RoomBlock>{BOOT_SEQUENCE_TEXT}</RoomBlock>

      <RoomParagraph>
        Room 001 is not about spectacle. It is about consent. This is where you
        decide that your life is not raw footage but source code.
      </RoomParagraph>

      <RoomList
        items={[
          { label: 'Mode', description: 'Surface → Echo' },
          { label: 'Mechanic', description: 'System boot, self-recognition' },
          {
            label: 'Outcome',
            description: 'Unlocks Room 002 — Diary Loop Protocol',
          },
        ]}
      />
    </RoomContainer>
  );
};
