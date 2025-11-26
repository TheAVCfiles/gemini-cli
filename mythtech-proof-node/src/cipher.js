// src/cipher.js
import { CORE_KEY } from "./config.js";

const A_CODE = "A".charCodeAt(0);

function normalizeKey(key) {
  return key.toUpperCase().replace(/[^A-Z]/g, "");
}

export function vigenereDecode(encoded, key = CORE_KEY) {
  const cleanKey = normalizeKey(key);
  let out = "";
  let j = 0;

  for (const ch of encoded) {
    const c = ch.toUpperCase();
    if (c < "A" || c > "Z") {
      out += ch;
      continue;
    }
    const p = c.charCodeAt(0) - A_CODE;
    const k = cleanKey[j % cleanKey.length].charCodeAt(0) - A_CODE;
    const dec = (p - k + 26) % 26;
    out += String.fromCharCode(dec + A_CODE);
    j++;
  }
  return out;
}
