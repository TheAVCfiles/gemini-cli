/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReadStdinOptions {
  /**
   * Max number of bytes that will be consumed from stdin. Defaults to 8MB to
   * match the previous behaviour.
   */
  maxSize?: number;
  /**
   * How long to wait (in milliseconds) for piped stdin data before bailing
   * out. Defaults to 500ms which keeps existing semantics for interactive
   * shells where stdin is not a TTY.
   */
  pipedInputTimeoutMs?: number;
}

export async function readStdin({
  maxSize = 8 * 1024 * 1024, // 8MB
  pipedInputTimeoutMs = 500,
}: ReadStdinOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    let totalSize = 0;
    process.stdin.setEncoding('utf8');

    let pipedInputTimerId: null | NodeJS.Timeout = setTimeout(() => {
      // stop reading if input is not available yet, this is needed
      // in terminals where stdin is never TTY and nothing's piped
      // which causes the program to get stuck expecting data from stdin
      onEnd();
    }, pipedInputTimeoutMs);

    const onReadable = () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        if (pipedInputTimerId) {
          clearTimeout(pipedInputTimerId);
          pipedInputTimerId = null;
        }

        if (totalSize + chunk.length > maxSize) {
          const remainingSize = maxSize - totalSize;
          data += chunk.slice(0, remainingSize);
          totalSize += remainingSize;
          console.warn(
            `Warning: stdin input truncated to ${maxSize} bytes.`,
          );
          process.stdin.destroy(); // Stop reading further
          break;
        }
        data += chunk;
        totalSize += chunk.length;
      }
    };

    const onEnd = () => {
      cleanup();
      resolve(data);
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      if (pipedInputTimerId) {
        clearTimeout(pipedInputTimerId);
        pipedInputTimerId = null;
      }
      process.stdin.removeListener('readable', onReadable);
      process.stdin.removeListener('end', onEnd);
      process.stdin.removeListener('error', onError);
    };

    process.stdin.on('readable', onReadable);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);
  });
}
