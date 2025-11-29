/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** Room identifiers for the Room Engine */
export type RoomId =
  | 'room001'
  | 'room002'
  | 'room003'
  | 'room004'
  | 'room005'
  | 'room006'
  | 'room007'
  | 'room008';

/** Navigation action types */
export type RoomAction = 'DECODE' | 'DISTORT' | 'DIVERT' | 'ACCEPT' | 'REJECT';

/** Room metadata for navigation and display */
export interface RoomMeta {
  readonly id: RoomId;
  readonly title: string;
  readonly subtitle: string;
  readonly unlocks?: RoomId;
  readonly mechanic: string;
  readonly mode?: string;
}

/** Props passed to individual room components */
export interface RoomProps {
  /** Callback when user selects an action */
  readonly onAction?: (action: RoomAction) => void;
  /** Whether this room is currently active */
  readonly isActive?: boolean;
  /** Accessibility label for the room */
  readonly ariaLabel?: string;
}

/** Room Engine navigation state */
export interface RoomEngineState {
  readonly currentRoom: RoomId;
  readonly visitedRooms: readonly RoomId[];
  readonly unlockedRooms: readonly RoomId[];
}

/** Placeholder data structure for future content */
export interface PlaceholderContent {
  readonly title: string;
  readonly description: string;
  readonly status: 'available' | 'coming-soon' | 'locked';
}

/** Room registry for dynamic loading */
export const ROOM_META: Record<RoomId, RoomMeta> = {
  room001: {
    id: 'room001',
    title: 'Room 001',
    subtitle: 'Boot Sequence',
    unlocks: 'room002',
    mechanic: 'System boot, self-recognition',
    mode: 'Surface → Echo',
  },
  room002: {
    id: 'room002',
    title: 'Room 002',
    subtitle: 'Diary Loop Protocol',
    unlocks: 'room003',
    mechanic: 'Choice tree, loop breaking',
  },
  room003: {
    id: 'room003',
    title: 'Room 003',
    subtitle: 'Glitch Deck Preview',
    unlocks: 'room004',
    mechanic: 'Card revelation, pattern awareness',
  },
  room004: {
    id: 'room004',
    title: 'Room 004',
    subtitle: 'Transmission:Corrupt',
    unlocks: 'room005',
    mechanic: 'Reframe as system failure + patch',
  },
  room005: {
    id: 'room005',
    title: 'Room 005',
    subtitle: 'Mirror Corridor',
    unlocks: 'room006',
    mechanic: 'Patch integration decision',
  },
  room006: {
    id: 'room006',
    title: 'Room 006',
    subtitle: 'Stage Reset',
    unlocks: 'room007',
    mechanic: 'World physics update after self-integration',
  },
  room007: {
    id: 'room007',
    title: 'Room 007',
    subtitle: "Architect's Table",
    unlocks: 'room008',
    mechanic: 'Home base, attribute upgrades',
  },
  room008: {
    id: 'room008',
    title: 'Room 008',
    subtitle: 'MotherNet',
    mechanic: 'Global network activation',
  },
};

/** Ordered list of all rooms */
export const ROOM_ORDER: readonly RoomId[] = [
  'room001',
  'room002',
  'room003',
  'room004',
  'room005',
  'room006',
  'room007',
  'room008',
];

/** Get room index (1-based) from room ID */
export function getRoomNumber(roomId: RoomId): number {
  return ROOM_ORDER.indexOf(roomId) + 1;
}

/** Get next room in sequence */
export function getNextRoom(roomId: RoomId): RoomId | undefined {
  const index = ROOM_ORDER.indexOf(roomId);
  if (index >= 0 && index < ROOM_ORDER.length - 1) {
    return ROOM_ORDER[index + 1];
  }
  return undefined;
}

/** Get previous room in sequence */
export function getPreviousRoom(roomId: RoomId): RoomId | undefined {
  const index = ROOM_ORDER.indexOf(roomId);
  if (index > 0) {
    return ROOM_ORDER[index - 1];
  }
  return undefined;
}
