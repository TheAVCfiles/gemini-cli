import { Card, Element, Suit } from "./types";

type DecanConfig = {
  sign: string;
  suit: Exclude<Suit, null>;
  element: Element;
  ranks: ["2", "3", "4"] | ["5", "6", "7"] | ["8", "9", "10"];
};

const DECAN_CONFIGS: DecanConfig[] = [
  { sign: "Aries", suit: "Wands", element: "Fire", ranks: ["2", "3", "4"] },
  { sign: "Taurus", suit: "Pentacles", element: "Earth", ranks: ["5", "6", "7"] },
  { sign: "Gemini", suit: "Swords", element: "Air", ranks: ["8", "9", "10"] },
  { sign: "Cancer", suit: "Cups", element: "Water", ranks: ["2", "3", "4"] },
  { sign: "Leo", suit: "Wands", element: "Fire", ranks: ["5", "6", "7"] },
  { sign: "Virgo", suit: "Pentacles", element: "Earth", ranks: ["8", "9", "10"] },
  { sign: "Libra", suit: "Swords", element: "Air", ranks: ["2", "3", "4"] },
  { sign: "Scorpio", suit: "Cups", element: "Water", ranks: ["5", "6", "7"] },
  { sign: "Sagittarius", suit: "Wands", element: "Fire", ranks: ["8", "9", "10"] },
  { sign: "Capricorn", suit: "Pentacles", element: "Earth", ranks: ["2", "3", "4"] },
  { sign: "Aquarius", suit: "Swords", element: "Air", ranks: ["5", "6", "7"] },
  { sign: "Pisces", suit: "Cups", element: "Water", ranks: ["8", "9", "10"] },
];

const SUITS: { suit: Exclude<Suit, null>; element: Element }[] = [
  { suit: "Wands", element: "Fire" },
  { suit: "Cups", element: "Water" },
  { suit: "Swords", element: "Air" },
  { suit: "Pentacles", element: "Earth" },
];

function createDecanCards(): Card[] {
  const cards: Card[] = [];

  DECAN_CONFIGS.forEach((config, signIndex) => {
    config.ranks.forEach((rank, rankIndex) => {
      const decan_index = (rankIndex + 1) as 1 | 2 | 3;
      const poemSlotNumber = signIndex * 3 + rankIndex + 8;
      const poemSlot = `P${String(poemSlotNumber).padStart(2, "0")}` as `P${number}`;

      cards.push({
        id: `MIN_${config.suit.toUpperCase()}_${rank}`,
        name: `${rank} of ${config.suit}`,
        arcana: "Minor",
        suit: config.suit,
        rank,
        element: config.element,
        astro: { type: "sign", key: config.sign },
        house_hook: signIndex + 1,
        hebrew: null,
        decan_index,
        poem_slot: poemSlot,
        upright: `${config.sign} decan ${decan_index} ignition sequence engaged.`,
        shadow: `${config.sign} decan ${decan_index} turbulence warning.`,
      });
    });
  });

  return cards;
}

function createCourtAndAces(): Card[] {
  const cards: Card[] = [];
  let poemSlotNumber = DECAN_CONFIGS.length * 3 + 8;

  SUITS.forEach(({ suit, element }, index) => {
    const courtRanks = ["Ace", "Page", "Knight", "Queen", "King"] as const;

    courtRanks.forEach((rank) => {
      const poemSlot = `P${String(poemSlotNumber).padStart(2, "0")}` as `P${number}`;

      cards.push({
        id: `MIN_${suit.toUpperCase()}_${rank.toUpperCase()}`,
        name: `${rank} of ${suit}`,
        arcana: "Minor",
        suit,
        rank,
        element,
        astro: { type: "element", key: element },
        house_hook: index + 13,
        hebrew: null,
        decan_index: 0,
        poem_slot: poemSlot,
        upright: `${rank} channels ${suit} discipline.`,
        shadow: `${rank} loses ${suit} signal fidelity.`,
      });

      poemSlotNumber += 1;
    });
  });

  return cards;
}

export const MINORS: Card[] = [...createDecanCards(), ...createCourtAndAces()];
