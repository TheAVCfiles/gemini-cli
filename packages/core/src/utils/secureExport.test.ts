/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, it} from 'vitest';

import {
  createEncryptedExport,
  decryptEncryptedExport,
  verifyExportSignature,
} from './secureExport';

describe('secure export utilities', () => {
  const encryptionSecret = 'export-encryption-key';
  const signatureSecret = 'export-signature-key';
  const payload = {
    message: 'invisible ink',
    count: 8,
    values: [0.5, 0.6, 0.7],
  };

  it('encrypts, signs, and decrypts the export payload', () => {
    const encrypted = createEncryptedExport(payload, encryptionSecret, signatureSecret);

    expect(verifyExportSignature(encrypted.archive, encrypted.signature, signatureSecret)).toBe(
      true,
    );

    const restored = decryptEncryptedExport(encrypted.archive, encryptionSecret);
    expect(restored).toStrictEqual(payload);
  });

  it('rejects an invalid signature', () => {
    const encrypted = createEncryptedExport(payload, encryptionSecret, signatureSecret);
    expect(
      verifyExportSignature(encrypted.archive, 'bad-signature', signatureSecret),
    ).toBe(false);
  });

  it('throws when the archive is tampered with', () => {
    const encrypted = createEncryptedExport(payload, encryptionSecret, signatureSecret);
    const corrupted = Buffer.from(encrypted.archive);
    corrupted[corrupted.length - 1] = corrupted[corrupted.length - 1] ^ 0x01;

    expect(() => decryptEncryptedExport(corrupted, encryptionSecret)).toThrow();
  });
});
