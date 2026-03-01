/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * nfc_write.js
 * Usage: node nfc_write.js "https://decrypt.thegirl/activate/rr_123..."
 *
 * Requires: npm i nfc-pcsc ndef
 * Reader: ACR122U or compatible NFC-USB
 *
 * This writes a simple URL NDEF record to NTAG213 tags.
 */

import { NFC } from 'nfc-pcsc';
import NDEF from 'ndef';

const nfc = new NFC();

const urlToWrite = process.argv[2];
if (!urlToWrite) {
  console.error('Usage: node scripts/nfc_write.js <url>');
  process.exit(1);
}

nfc.on('reader', reader => {
  console.log(`${reader.reader.name} device attached`);
  reader.aid = 'F222222222';
  reader.on('card', async card => {
    console.log('Card detected', card);
    try {
      const records = [
        {
          tnf: NDEF.TNF_WELL_KNOWN,
          type: Buffer.from('U'),
          payload: NDEF.encodeURI(urlToWrite),
        },
      ];
      const bytes = NDEF.encodeMessage(records);
      await reader.write(4, bytes, 16);
      console.log('Wrote URL to tag:', urlToWrite);
    } catch (error) {
      console.error('Write error', error);
    }
  });

  reader.on('error', err => {
    console.error('Reader error', err);
  });

  reader.on('end', () => {
    console.log(`${reader.reader.name} device removed`);
  });
});

nfc.on('error', err => {
  console.error('NFC error', err);
});
