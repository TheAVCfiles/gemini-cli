/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { Room001 } from './Room001.js';
import { Room002 } from './Room002.js';
import { Room003 } from './Room003.js';
import { Room004 } from './Room004.js';
import { Room005 } from './Room005.js';
import { Room006 } from './Room006.js';
import { Room007 } from './Room007.js';
import { Room008 } from './Room008.js';

describe('Room Components', () => {
  describe('Room001', () => {
    it('renders the boot sequence title', () => {
      const { lastFrame } = render(<Room001 />);
      expect(lastFrame()).toContain('Room 001');
      expect(lastFrame()).toContain('Boot Sequence');
    });

    it('renders the echo engine content', () => {
      const { lastFrame } = render(<Room001 />);
      expect(lastFrame()).toContain('ECHO ENGINE ONLINE');
    });
  });

  describe('Room002', () => {
    it('renders the diary loop title', () => {
      const { lastFrame } = render(<Room002 />);
      expect(lastFrame()).toContain('Room 002');
      expect(lastFrame()).toContain('Diary Loop Protocol');
    });

    it('renders the choice options', () => {
      const { lastFrame } = render(<Room002 />);
      expect(lastFrame()).toContain('DECODE');
      expect(lastFrame()).toContain('DISTORT');
      expect(lastFrame()).toContain('DIVERT');
    });
  });

  describe('Room003', () => {
    it('renders the glitch deck title', () => {
      const { lastFrame } = render(<Room003 />);
      expect(lastFrame()).toContain('Room 003');
      expect(lastFrame()).toContain('Glitch Deck Preview');
    });

    it('renders THE BREAK card', () => {
      const { lastFrame } = render(<Room003 />);
      expect(lastFrame()).toContain('THE BREAK');
    });
  });

  describe('Room004', () => {
    it('renders the transmission corrupt title', () => {
      const { lastFrame } = render(<Room004 />);
      expect(lastFrame()).toContain('Room 004');
      expect(lastFrame()).toContain('Transmission:Corrupt');
    });

    it('renders the masked one message', () => {
      const { lastFrame } = render(<Room004 />);
      expect(lastFrame()).toContain('MASKED_ONE');
    });
  });

  describe('Room005', () => {
    it('renders the mirror corridor title', () => {
      const { lastFrame } = render(<Room005 />);
      expect(lastFrame()).toContain('Room 005');
      expect(lastFrame()).toContain('Mirror Corridor');
    });

    it('renders the patch integration options', () => {
      const { lastFrame } = render(<Room005 />);
      expect(lastFrame()).toContain('PATCH INTEGRATION');
    });
  });

  describe('Room006', () => {
    it('renders the stage reset title', () => {
      const { lastFrame } = render(<Room006 />);
      expect(lastFrame()).toContain('Room 006');
      expect(lastFrame()).toContain('Stage Reset');
    });

    it('renders the echo stabilized message', () => {
      const { lastFrame } = render(<Room006 />);
      expect(lastFrame()).toContain('ECHO STABILIZED');
    });
  });

  describe('Room007', () => {
    it('renders the architect table title', () => {
      const { lastFrame } = render(<Room007 />);
      expect(lastFrame()).toContain('Room 007');
      expect(lastFrame()).toContain("Architect's Table");
    });

    it('renders the architect menu', () => {
      const { lastFrame } = render(<Room007 />);
      expect(lastFrame()).toContain('WELCOME, ARCHITECT');
    });
  });

  describe('Room008', () => {
    it('renders the mothernet title', () => {
      const { lastFrame } = render(<Room008 />);
      expect(lastFrame()).toContain('Room 008');
      expect(lastFrame()).toContain('MotherNet');
    });

    it('renders the sync prompt', () => {
      const { lastFrame } = render(<Room008 />);
      expect(lastFrame()).toContain('YOU ARE NOT ALONE');
    });

    it('renders the charmed protocol unlock', () => {
      const { lastFrame } = render(<Room008 />);
      expect(lastFrame()).toContain('Charmed Protocol');
    });
  });
});
