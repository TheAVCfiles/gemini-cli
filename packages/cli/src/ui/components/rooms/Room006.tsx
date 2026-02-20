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

const STAGE_TEXT = `ECHO STABILIZED.
SURFACE RECOMPILED.`;

/**
 * Room 006 — The Stage Reset
 *
 * The stage with shifted authority vectors.
 */
export const Room006: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room006;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        Same stage. Same props. Same scattered script pages. Different gravity.
        When you step onto the floor this time, it tilts toward you. Authority
        has shifted vectors.
      </RoomParagraph>

      <RoomParagraph>
        The Masked One no longer haunts the edges. She stands behind you like a
        spine upgrade — integrated, not possessing.
      </RoomParagraph>

      <RoomBlock>{STAGE_TEXT}</RoomBlock>

      <RoomParagraph>
        NPCs (people, systems, platforms) now react to a new calibration: your
        Clarity, Discernment, Boundary Voltage and Voice Gain have leveled up.
        The world&apos;s default script no longer applies unchallenged.
      </RoomParagraph>

      <RoomList
        items={[
          {
            label: 'Mechanic',
            description: 'World physics update after self-integration',
          },
          {
            label: 'Outcome',
            description: "Unlocks Room 007 — The Architect's Table",
          },
        ]}
      />
    </RoomContainer>
  );
};
