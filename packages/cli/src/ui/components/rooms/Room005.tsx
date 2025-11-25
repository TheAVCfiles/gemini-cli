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

const MIRROR_TEXT = `SHE: "You keep asking what happened that night.
You're talking to the wrong version of yourself."`;

const INTEGRATION_TEXT = `PATCH INTEGRATION AVAILABLE
MERGE IDENTITY STREAMS?

[1] ACCEPT PATCH — fuse memory & agency
[2] PARTIAL SYNC — stay separate, make a pact
[3] REJECT — maintain split (loop risk ↑)`;

/**
 * Room 005 — The Mirror Corridor
 *
 * Audit mirrors showing different angles of the self.
 */
export const Room005: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room005;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        Not funhouse mirrors. Audit mirrors. Each panel shows a different angle
        of you: on camera, smiling like survival; later that night, replaying
        every frame; hovering at the edge of your own body.
      </RoomParagraph>

      <RoomParagraph>
        The third mirror is empty—until she steps into it. Same outline,
        different posture. Not hunched in shame; braced like a bouncer at the
        door of your own life.
      </RoomParagraph>

      <RoomBlock>{MIRROR_TEXT}</RoomBlock>

      <RoomParagraph>
        You confront her. Did she hijack you? She answers: &quot;No. I caught you.&quot;
        She explains that when reality stopped matching your inner script, she
        buffered the impact. They gave you &quot;perform&quot; or &quot;implode.&quot; She chose
        &quot;reroute.&quot;
      </RoomParagraph>

      <RoomBlock>{INTEGRATION_TEXT}</RoomBlock>

      <RoomParagraph>
        Canonically, by the time this engine is running in production, you have
        already chosen integration. The system recognizes one operator.
      </RoomParagraph>
    </RoomContainer>
  );
};
