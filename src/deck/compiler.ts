import { Card } from "./types";
import { DECK } from "./index";

export interface TransitInput {
  sign:
    | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
    | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";
  degree: number; // 0–30
  planet: string; // "Moon", "Mars", ...
}

function decanIndexForDegree(degree: number): 1 | 2 | 3 {
  if (degree < 10) return 1;
  if (degree < 20) return 2;
  return 3;
}

export function getDecanCard(sign: string, degree: number): Card | undefined {
  const decan_index = decanIndexForDegree(degree);
  return DECK.find(
    (c) =>
      c.arcana === "Minor" &&
      c.decan_index === decan_index &&
      c.astro.type === "sign" &&
      c.astro.key.includes(sign),
  );
}

export function getPlanetMajor(planet: string): Card | undefined {
  return DECK.find(
    (c) =>
      c.arcana === "Major" &&
      c.astro.type === "planet" &&
      c.astro.key === planet,
  );
}

export function compileTransit(input: TransitInput) {
  const minor = getDecanCard(input.sign, input.degree);
  const major = getPlanetMajor(input.planet);

  return {
    minor,
    major,
    poemSlots: {
      minor: minor?.poem_slot ?? null,
      major: major?.poem_slot ?? null,
    },
  };
}
