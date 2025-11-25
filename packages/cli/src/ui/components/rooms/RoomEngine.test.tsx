/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { RoomEngine } from './RoomEngine.js';

describe('RoomEngine', () => {
  it('renders with the initial room', () => {
    const { lastFrame } = render(<RoomEngine initialRoom="room001" />);
    expect(lastFrame()).toContain('Room 001');
    expect(lastFrame()).toContain('Boot Sequence');
  });

  it('renders navigation indicators for all rooms', () => {
    const { lastFrame } = render(<RoomEngine />);
    // Check for room number indicators
    expect(lastFrame()).toContain('1');
    expect(lastFrame()).toContain('8');
  });

  it('starts at room001 by default', () => {
    const { lastFrame } = render(<RoomEngine />);
    expect(lastFrame()).toContain('Room 001');
  });

  it('shows navigation hints when navigation is enabled', () => {
    const { lastFrame } = render(<RoomEngine enableNavigation={true} />);
    expect(lastFrame()).toContain('Press 1-8 to jump to room');
  });

  it('renders different rooms based on initialRoom prop', () => {
    const { lastFrame } = render(<RoomEngine initialRoom="room004" />);
    expect(lastFrame()).toContain('Room 004');
    expect(lastFrame()).toContain('Transmission:Corrupt');
  });

  it('hides navigation hints when navigation is disabled', () => {
    const { lastFrame } = render(<RoomEngine enableNavigation={false} />);
    expect(lastFrame()).not.toContain('Press 1-8');
  });

  it('renders room 002 when initialRoom is room002', () => {
    const { lastFrame } = render(<RoomEngine initialRoom="room002" />);
    expect(lastFrame()).toContain('Room 002');
    expect(lastFrame()).toContain('Diary Loop Protocol');
  });

  it('renders room 008 when initialRoom is room008', () => {
    const { lastFrame } = render(<RoomEngine initialRoom="room008" />);
    expect(lastFrame()).toContain('Room 008');
    expect(lastFrame()).toContain('MotherNet');
  });

  it('shows previous navigation hint when not on first room', () => {
    const { lastFrame } = render(
      <RoomEngine initialRoom="room005" enableNavigation={true} />,
    );
    expect(lastFrame()).toContain('Previous');
  });

  it('shows next navigation hint when not on last room', () => {
    const { lastFrame } = render(
      <RoomEngine initialRoom="room001" enableNavigation={true} />,
    );
    expect(lastFrame()).toContain('Next');
  });

  it('does not show previous hint on first room', () => {
    const { lastFrame } = render(
      <RoomEngine initialRoom="room001" enableNavigation={true} />,
    );
    expect(lastFrame()).not.toContain('← Previous');
  });

  it('does not show next hint on last room', () => {
    const { lastFrame } = render(
      <RoomEngine initialRoom="room008" enableNavigation={true} />,
    );
    expect(lastFrame()).not.toContain('Next (l/Right) →');
  });
});
