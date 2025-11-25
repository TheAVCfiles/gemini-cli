/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../../colors.js';
import {
  type RoomId,
  type RoomEngineState,
  ROOM_META,
  ROOM_ORDER,
  getNextRoom,
  getPreviousRoom,
  getRoomNumber,
} from './types.js';
import { Room001 } from './Room001.js';
import { Room002 } from './Room002.js';
import { Room003 } from './Room003.js';
import { Room004 } from './Room004.js';
import { Room005 } from './Room005.js';
import { Room006 } from './Room006.js';
import { Room007 } from './Room007.js';
import { Room008 } from './Room008.js';

/** Map of room IDs to their corresponding components */
const ROOM_COMPONENTS: Record<RoomId, React.FC> = {
  room001: Room001,
  room002: Room002,
  room003: Room003,
  room004: Room004,
  room005: Room005,
  room006: Room006,
  room007: Room007,
  room008: Room008,
};

interface RoomEngineProps {
  /** Initial room to display */
  readonly initialRoom?: RoomId;
  /** Callback when room changes */
  readonly onRoomChange?: (roomId: RoomId) => void;
  /** Whether keyboard navigation is enabled */
  readonly enableNavigation?: boolean;
}

/**
 * Parent component for the Room Engine arc.
 * Facilitates navigation between Rooms 001-008 with keyboard controls.
 *
 * Keyboard controls:
 * - Left/Right arrows or h/l: Navigate between rooms
 * - Number keys 1-8: Jump directly to a room
 * - q: Exit navigation mode
 */
export const RoomEngine: React.FC<RoomEngineProps> = ({
  initialRoom = 'room001',
  onRoomChange,
  enableNavigation = true,
}) => {
  const [state, setState] = useState<RoomEngineState>({
    currentRoom: initialRoom,
    visitedRooms: [initialRoom],
    unlockedRooms: ROOM_ORDER.slice() as RoomId[],
  });

  const navigateToRoom = useCallback(
    (roomId: RoomId) => {
      if (!state.unlockedRooms.includes(roomId)) {
        return;
      }

      setState((prev) => ({
        ...prev,
        currentRoom: roomId,
        visitedRooms: prev.visitedRooms.includes(roomId)
          ? prev.visitedRooms
          : [...prev.visitedRooms, roomId],
      }));

      onRoomChange?.(roomId);
    },
    [state.unlockedRooms, onRoomChange],
  );

  const handlePreviousRoom = useCallback(() => {
    const prev = getPreviousRoom(state.currentRoom);
    if (prev) {
      navigateToRoom(prev);
    }
  }, [state.currentRoom, navigateToRoom]);

  const handleNextRoom = useCallback(() => {
    const next = getNextRoom(state.currentRoom);
    if (next) {
      navigateToRoom(next);
    }
  }, [state.currentRoom, navigateToRoom]);

  useInput(
    (input, key) => {
      if (!enableNavigation) return;

      // Arrow key navigation
      if (key.leftArrow || input === 'h') {
        handlePreviousRoom();
      } else if (key.rightArrow || input === 'l') {
        handleNextRoom();
      }

      // Direct room selection (1-8)
      const roomNum = parseInt(input, 10);
      if (roomNum >= 1 && roomNum <= 8) {
        const roomId = `room00${roomNum}` as RoomId;
        navigateToRoom(roomId);
      }
    },
    { isActive: enableNavigation },
  );

  const CurrentRoomComponent = ROOM_COMPONENTS[state.currentRoom];
  const currentMeta = ROOM_META[state.currentRoom];
  const currentIndex = getRoomNumber(state.currentRoom);
  const hasPrevious = currentIndex > 1;
  const hasNext = currentIndex < 8;

  // Generate navigation indicators
  const navigationIndicators = useMemo(
    () =>
      ROOM_ORDER.map((roomId) => {
        const isActive = roomId === state.currentRoom;
        const isVisited = state.visitedRooms.includes(roomId);
        const isLocked = !state.unlockedRooms.includes(roomId);
        const roomNum = getRoomNumber(roomId);

        let color = Colors.Gray;
        if (isActive) {
          color = Colors.AccentCyan;
        } else if (isVisited) {
          color = Colors.AccentGreen;
        } else if (isLocked) {
          color = Colors.AccentRed;
        }

        return (
          <Text key={roomId} color={color} bold={isActive}>
            {isActive ? `[${roomNum}]` : ` ${roomNum} `}
          </Text>
        );
      }),
    [state.currentRoom, state.visitedRooms, state.unlockedRooms],
  );

  return (
    <Box flexDirection="column" aria-label="Room Engine Navigation">
      {/* Navigation Header */}
      <Box
        justifyContent="space-between"
        marginBottom={1}
        aria-label={`Currently in ${currentMeta.title}`}
      >
        <Box>
          <Text dimColor>Room Engine</Text>
          <Text color={Colors.AccentPurple}> │ </Text>
          <Text color={Colors.AccentCyan}>
            {currentMeta.title} — {currentMeta.subtitle}
          </Text>
        </Box>
      </Box>

      {/* Room Indicators */}
      <Box marginBottom={1} aria-label="Room navigation indicators">
        {navigationIndicators}
      </Box>

      {/* Current Room Content */}
      <CurrentRoomComponent />

      {/* Navigation Footer */}
      {enableNavigation && (
        <Box marginTop={1} justifyContent="space-between">
          <Box>
            {hasPrevious && (
              <Text dimColor>
                ← Previous (h/Left)
              </Text>
            )}
          </Box>
          <Box>
            <Text dimColor>Press 1-8 to jump to room</Text>
          </Box>
          <Box>
            {hasNext && (
              <Text dimColor>
                Next (l/Right) →
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
