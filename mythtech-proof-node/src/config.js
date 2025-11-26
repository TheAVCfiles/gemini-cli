// src/config.js

export const META_SIGNATURE = "4.21444 · Myth-Tech Meta-Node Proof";

export const CORE_KEY = "DAUGHTER"; // root cipher

export const ZODIAC_MAP = Object.freeze({
  Aries: "A4 — The Strike",
  Taurus: "B1 — She Carries Salt",
  Gemini: "C3 — The Ring",
  Cancer: "A2 — Et Tu ☽",
  Leo: "A1 — The Signal",
  Virgo: "B3 — Clean Code",
  Libra: "A3 — Lip Service",
  Scorpio: "B5b — decode / don’t",
  Sagittarius: "A6 — She Spoke in Arrows",
  Capricorn: "C2 — Echo Chamber",
  Aquarius: "C4 — Static Bloom",
  Pisces: "B4 — Deluge"
});

export const SERIES_A = Object.freeze(["A1","A2","A3","A4","A5","A6","A7"]);
export const SERIES_B = Object.freeze(["B1","B2","B3","B4","B5","B5b"]);
export const SERIES_C = Object.freeze(["C1","C2","C3","C4"]);

// micro "type" helpers for cleanliness
export function assertSign(sign) {
  if (!Object.prototype.hasOwnProperty.call(ZODIAC_MAP, sign)) {
    throw new Error(`Unknown sign '${sign}'. Expected one of: ${Object.keys(ZODIAC_MAP).join(", ")}`);
  }
}
