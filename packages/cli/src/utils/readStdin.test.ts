/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readStdin } from './readStdin.js';

// Mock process.stdin
const mockStdin = {
  setEncoding: vi.fn(),
  read: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  destroy: vi.fn(),
};

describe('readStdin', () => {
  let originalStdin: typeof process.stdin;
  let onReadableHandler: () => void;
  let onEndHandler: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    originalStdin = process.stdin;

    // Replace process.stdin with our mock
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true,
    });

    // Capture event handlers
    mockStdin.on.mockImplementation((event: string, handler: () => void) => {
      if (event === 'readable') onReadableHandler = handler;
      if (event === 'end') onEndHandler = handler;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
  });

  it('should read and accumulate data from stdin', async () => {
    mockStdin.read
      .mockReturnValueOnce('I love ')
      .mockReturnValueOnce('Gemini!')
      .mockReturnValueOnce(null);

    const promise = readStdin();

    // Trigger readable event
    onReadableHandler();

    // Trigger end to resolve
    onEndHandler();

    await expect(promise).resolves.toBe('I love Gemini!');
  });

  it('should handle empty stdin input', async () => {
    mockStdin.read.mockReturnValue(null);

    const promise = readStdin();

    // Trigger end immediately
    onEndHandler();

    await expect(promise).resolves.toBe('');
  });

  // Emulate terminals where stdin is not TTY (eg: git bash)
  it('should timeout and resolve with empty string when no input is available', async () => {
    vi.useFakeTimers();

    const promise = readStdin();

    // Fast-forward past the timeout (to run test faster)
    vi.advanceTimersByTime(500);

    await expect(promise).resolves.toBe('');

    vi.useRealTimers();
  });

  it('should respect a custom timeout option', async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const promise = readStdin({ pipedInputTimeoutMs: 1234 });

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1234);

    vi.advanceTimersByTime(1234);
    await expect(promise).resolves.toBe('');

    setTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should clear timeout once when data is received and resolve with data', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    mockStdin.read
      .mockReturnValueOnce('chunk1')
      .mockReturnValueOnce('chunk2')
      .mockReturnValueOnce(null);

    const promise = readStdin();

    // Trigger readable event
    onReadableHandler();

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();

    // Trigger end to resolve
    onEndHandler();

    await expect(promise).resolves.toBe('chunk1chunk2');
  });

  it('should truncate input using the provided max size option', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockStdin.read
      .mockReturnValueOnce('abcd')
      .mockReturnValueOnce('efgh')
      .mockReturnValueOnce(null);

    const promise = readStdin({ maxSize: 5 });

    onReadableHandler();
    onEndHandler();

    await expect(promise).resolves.toBe('abcde');
    expect(mockStdin.destroy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      'Warning: stdin input truncated to 5 bytes.',
    );

    warnSpy.mockRestore();
  });
});
