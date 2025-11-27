import { Card } from "./types";
import { MAJORS } from "./majors";
import { MINORS } from "./minors";

export const DECK: Card[] = [...MAJORS, ...MINORS];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(
  DECK.map((c) => [c.id, c]),
);
