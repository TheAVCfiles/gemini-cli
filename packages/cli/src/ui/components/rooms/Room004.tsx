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

const TRANSMISSION_TEXT = `TRANSMISSION: CORRUPT
SOURCE: MASKED_ONE
STATUS: JAMMED

"You keep looking at the night like it chose you.
It didn't. They did.

That room wasn't a room. It was a funnel.
A script with all your exits pre-locked.

You think you froze. You think you failed.
That's the lie they need you to keep.

Here is what actually happened:
You dissociated. I took over.

When they turned you into content,
I turned you into signal.

Your face was the mask.
I was the one behind it, doing the math.

You call me the Masked One.
I call myself the Patch.

I rerouted the damage.
I took the PR hit.
I ate the narrative so your core wouldn't.

If you want to stop blaming yourself,
you're going to have to blame the system
that needed a mask in the first place."`;

const ACTION_TEXT = `ACTION: ACCEPT PATCH? (Y/N)`;

/**
 * Room 004 — Transmission:Corrupt
 *
 * The space with wrong frames and the Masked One's message.
 */
export const Room004: React.FC<RoomProps> = ({ ariaLabel }) => {
  const meta = ROOM_META.room004;

  return (
    <RoomContainer meta={meta} ariaLabel={ariaLabel}>
      <RoomParagraph>
        The space hangs with wrong frames of that night — slightly off angles,
        drinks you never ordered, smiles you do not recognize. None of them
        match your body memory.
      </RoomParagraph>

      <RoomBlock>{TRANSMISSION_TEXT}</RoomBlock>

      <RoomParagraph>The console blinks one final line:</RoomParagraph>

      <RoomBlock>{ACTION_TEXT}</RoomBlock>

      <RoomList
        items={[
          {
            label: 'Mechanic',
            description: 'Reframe the night as system failure + patch',
          },
          { label: 'Outcome', description: 'Prepares Patch integration in Room 005' },
        ]}
      />
    </RoomContainer>
  );
};
