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

const nfc = new NFC(); // optionally pass logger

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
      // Write to block 4.. (depends on tag)
      // Use simple NDEF write utility from nfc-pcsc
      await reader.write(4, bytes, 16);
      console.log('Wrote URL to tag:', urlToWrite);
    } catch (e) {
      console.error('Write error', e);
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
