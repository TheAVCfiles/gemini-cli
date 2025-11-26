// src/deck.js

// minimal but expandable tarot deck
export const MAJORS = Object.freeze({
  MAJ_17: {
    id: "MAJ_17",
    name: "The Star",
    arcana: "Major",
    element: "Air",
    astro: { type: "sign", key: "Aquarius" },
    upright: "hope, signal",
    shadow: "apathy, numb"
  },
  MAJ_00: {
    id: "MAJ_00",
    name: "The Fool",
    arcana: "Major",
    element: "Air",
    astro: { type: "element", key: "Air" },
    upright: "leap, trust",
    shadow: "chaos, drift"
  }
  // add more as needed
});

export function getMajorBySign(sign) {
  // dumb but explicit mapping for now
  if (sign === "Aquarius") return MAJORS.MAJ_17;
  return MAJORS.MAJ_00; // default archetype
}
