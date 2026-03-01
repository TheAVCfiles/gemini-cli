/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  ROOM_META,
  ROOM_ORDER,
  getRoomNumber,
  getNextRoom,
  getPreviousRoom,
} from './types.js';

describe('Room types and utilities', () => {
  describe('ROOM_META', () => {
    it('contains metadata for all 8 rooms', () => {
      expect(Object.keys(ROOM_META)).toHaveLength(8);
    });

    it('has correct structure for each room', () => {
      for (const roomId of ROOM_ORDER) {
        const meta = ROOM_META[roomId];
        expect(meta.id).toBe(roomId);
        expect(meta.title).toBeDefined();
        expect(meta.subtitle).toBeDefined();
        expect(meta.mechanic).toBeDefined();
      }
    });

    it('links rooms correctly via unlocks property', () => {
      expect(ROOM_META.room001.unlocks).toBe('room002');
      expect(ROOM_META.room002.unlocks).toBe('room003');
      expect(ROOM_META.room007.unlocks).toBe('room008');
      expect(ROOM_META.room008.unlocks).toBeUndefined();
    });
  });

  describe('ROOM_ORDER', () => {
    it('contains exactly 8 rooms in order', () => {
      expect(ROOM_ORDER).toEqual([
        'room001',
        'room002',
        'room003',
        'room004',
        'room005',
        'room006',
        'room007',
        'room008',
      ]);
    });
  });

  describe('getRoomNumber', () => {
    it('returns correct 1-based index for each room', () => {
      expect(getRoomNumber('room001')).toBe(1);
      expect(getRoomNumber('room004')).toBe(4);
      expect(getRoomNumber('room008')).toBe(8);
    });
  });

  describe('getNextRoom', () => {
    it('returns the next room in sequence', () => {
      expect(getNextRoom('room001')).toBe('room002');
      expect(getNextRoom('room005')).toBe('room006');
    });

    it('returns undefined for the last room', () => {
      expect(getNextRoom('room008')).toBeUndefined();
    });
  });

  describe('getPreviousRoom', () => {
    it('returns the previous room in sequence', () => {
      expect(getPreviousRoom('room002')).toBe('room001');
      expect(getPreviousRoom('room008')).toBe('room007');
    });

    it('returns undefined for the first room', () => {
      expect(getPreviousRoom('room001')).toBeUndefined();
    });
  });
});
