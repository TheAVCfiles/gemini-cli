/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync} from 'crypto';
import {gunzipSync, gzipSync} from 'zlib';

export interface EncryptedExportPackage {
  archive: Buffer;
  signature: string;
  iv: string;
  authTag: string;
}

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'gemini-export', 32);
}

export function createEncryptedExport(
  data: unknown,
  encryptionSecret: string,
  signatureSecret: string,
): EncryptedExportPackage {
  const iv = randomBytes(12);
  const key = deriveKey(encryptionSecret);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(data));
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]);
  const archive = gzipSync(payload);
  const signature = createHmac('sha256', signatureSecret)
    .update(archive)
    .digest('hex');

  return {
    archive,
    signature,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function verifyExportSignature(
  archive: Buffer,
  signature: string,
  signatureSecret: string,
): boolean {
  const computed = createHmac('sha256', signatureSecret)
    .update(archive)
    .digest('hex');
  return computed === signature;
}

export function decryptEncryptedExport(
  archive: Buffer,
  encryptionSecret: string,
): unknown {
  const decompressed = gunzipSync(archive);
  const iv = decompressed.subarray(0, 12);
  const authTag = decompressed.subarray(12, 28);
  const ciphertext = decompressed.subarray(28);
  const key = deriveKey(encryptionSecret);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as unknown;
}
