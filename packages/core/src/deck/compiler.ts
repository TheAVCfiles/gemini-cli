/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DECK } from './cards.js';
import { type Card } from './types.js';

export function cardFromTransit(sign: string, degree: number): Card[] {
  const decan_index: 1 | 2 | 3 = degree < 10 ? 1 : degree < 20 ? 2 : 3;

  const pip = DECK.find(
    (card) =>
      card.arcana === 'Minor' &&
      card.decan_index === decan_index &&
      card.astro.key.includes(sign)
  );

  const major = DECK.find(
    (card) => card.arcana === 'Major' && card.astro.key === sign
  );

  return [pip, major].filter(Boolean) as Card[];
}

export function poemSlotsForTransit(sign: string, degree: number): `P${number}`[] {
  const cards = cardFromTransit(sign, degree);
  return cards.map((card) => card.poem_slot);
}
