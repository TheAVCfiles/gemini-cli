export type Arcana = "Major" | "Minor";
export type Suit = "Wands" | "Cups" | "Swords" | "Pentacles" | null;
export type Element = "Fire" | "Water" | "Air" | "Earth";
export type AstroType = "planet" | "sign" | "element";

export type RankMajor =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21";

export type RankMinor =
  | "Ace" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "Page" | "Knight" | "Queen" | "King";

export type CardId = string;

export interface Card {
  id: CardId;
  name: string;
  arcana: Arcana;
  suit: Suit;
  rank: RankMajor | RankMinor;
  element: Element;
  astro: { type: AstroType; key: string };
  house_hook: number;
  hebrew: string | null;
  decan_index: 0 | 1 | 2 | 3;
  poem_slot: `P${number}`;
  upright: string;
  shadow: string;
}
