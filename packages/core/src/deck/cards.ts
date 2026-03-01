/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { MAJORS } from './majors.js';
import { MINORS } from './minors.js';
import { type Card } from './types.js';

export const DECK: Card[] = [...MAJORS, ...MINORS];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(
  DECK.map((card) => [card.id, card])
);
