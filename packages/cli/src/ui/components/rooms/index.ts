/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Room Engine - Main component
export { RoomEngine } from './RoomEngine.js';

// Individual room components
export { Room001 } from './Room001.js';
export { Room002 } from './Room002.js';
export { Room003 } from './Room003.js';
export { Room004 } from './Room004.js';
export { Room005 } from './Room005.js';
export { Room006 } from './Room006.js';
export { Room007 } from './Room007.js';
export { Room008 } from './Room008.js';

// Shared room components
export {
  RoomContainer,
  RoomBlock,
  RoomParagraph,
  RoomList,
  RoomOutcome,
} from './RoomComponents.js';

// Types and utilities
export {
  type RoomId,
  type RoomAction,
  type RoomMeta,
  type RoomProps,
  type RoomEngineState,
  type PlaceholderContent,
  ROOM_META,
  ROOM_ORDER,
  getRoomNumber,
  getNextRoom,
  getPreviousRoom,
} from './types.js';
