// src/engine.js
import { META_SIGNATURE, ZODIAC_MAP, assertSign } from "./config.js";
import { vigenereDecode } from "./cipher.js";
import { getMajorBySign } from "./deck.js";
import { routeSeries } from "./router.js";

/**
 * Core proof computation:
 *  - validate sign
 *  - map to poem node
 *  - route to series
 *  - attach Major Arcana card
 *  - decode cipher text
 */
export function decryptTheMoment(sign, encodedLine) {
  assertSign(sign);

  const node = ZODIAC_MAP[sign];
  const series = routeSeries(node);
  const tarot = getMajorBySign(sign);
  const decoded_line = vigenereDecode(encodedLine || "");

  return {
    sign,
    node,
    series,
    tarot,
    decoded_line,
    signature: META_SIGNATURE
  };
}
