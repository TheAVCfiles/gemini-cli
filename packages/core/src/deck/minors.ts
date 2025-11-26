/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Card, type Element } from './types.js';

type PipMeta = {
  id: string;
  name: string;
  rank: 'Ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
  astroKey: string;
  astroType: 'sign' | 'planet' | 'element';
  decan_index: 0 | 1 | 2 | 3;
  poem_slot: `P${number}`;
  upright: string;
  shadow: string;
};

type CourtMeta = {
  id: string;
  name: string;
  mutableSign: string;
  cardinalSign: string;
  fixedSign: string;
  poem_slot: `P${number}`;
  upright: string;
  shadow: string;
};

function buildSuit(
  suitCode: 'W' | 'C' | 'S' | 'P',
  suitName: 'Wands' | 'Cups' | 'Swords' | 'Pentacles',
  element: Element,
  pip: PipMeta[],
  court: CourtMeta
): Card[] {
  const cards: Card[] = [];

  for (const p of pip) {
    cards.push({
      id: `${suitCode}_${p.id}`,
      name: `${p.name} of ${suitName}`,
      arcana: 'Minor',
      suit: suitName,
      rank: p.rank,
      element,
      astro: { type: p.astroType, key: p.astroKey },
      house_hook: 0,
      hebrew: null,
      decan_index: p.decan_index,
      poem_slot: p.poem_slot,
      upright: p.upright,
      shadow: p.shadow,
    });
  }

  const basePoemNumber = Number(court.poem_slot.slice(1));
  const baseCourt = [
    {
      rank: 'Page' as const,
      sign: court.mutableSign,
      poem_slot: basePoemNumber,
      upright: court.upright,
      shadow: court.shadow,
    },
    {
      rank: 'Knight' as const,
      sign: court.cardinalSign,
      poem_slot: basePoemNumber + 1,
      upright: 'pursuit, rush',
      shadow: 'recklessness',
    },
    {
      rank: 'Queen' as const,
      sign: court.fixedSign,
      poem_slot: basePoemNumber + 2,
      upright: 'magnetism',
      shadow: 'jealousy',
    },
    {
      rank: 'King' as const,
      sign: 'Rulership synth',
      poem_slot: basePoemNumber + 3,
      upright: 'vision, lead',
      shadow: 'tyranny',
    },
  ];

  baseCourt.forEach((c, idx) => {
    const tag = ['Pg', 'Kn', 'Qn', 'Kg'][idx];
    cards.push({
      id: `${suitCode}_${tag}`,
      name: `${['Page', 'Knight', 'Queen', 'King'][idx]} of ${suitName}`,
      arcana: 'Minor',
      suit: suitName,
      rank: c.rank,
      element,
      astro: {
        type: c.rank === 'King' ? 'element' : 'sign',
        key: c.rank === 'King' ? element : c.sign,
      },
      house_hook: 0,
      hebrew: null,
      decan_index: 0,
      poem_slot: `P${String(c.poem_slot).padStart(2, '0')}` as `P${number}`,
      upright: c.upright,
      shadow: c.shadow,
    });
  });

  return cards;
}

const WANDS_PIPS: PipMeta[] = [
  {
    id: 'A',
    name: 'Ace',
    rank: 'Ace',
    astroKey: 'Fire',
    astroType: 'element',
    decan_index: 0,
    poem_slot: 'P23',
    upright: 'spark, desire',
    shadow: 'fizzle, aimless',
  },
  {
    id: '2',
    name: 'Two',
    rank: '2',
    astroKey: 'Mars in Aries',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P24',
    upright: 'plan, scope',
    shadow: 'stalling',
  },
  {
    id: '3',
    name: 'Three',
    rank: '3',
    astroKey: 'Sun in Aries',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P25',
    upright: 'launch, ships',
    shadow: 'impatience',
  },
  {
    id: '4',
    name: 'Four',
    rank: '4',
    astroKey: 'Venus in Aries',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P26',
    upright: 'home, stage',
    shadow: 'restlessness',
  },
  {
    id: '5',
    name: 'Five',
    rank: '5',
    astroKey: 'Saturn in Leo',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P27',
    upright: 'sport, friction',
    shadow: 'petty drama',
  },
  {
    id: '6',
    name: 'Six',
    rank: '6',
    astroKey: 'Jupiter in Leo',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P28',
    upright: 'victory, acclaim',
    shadow: 'ego, hollow',
  },
  {
    id: '7',
    name: 'Seven',
    rank: '7',
    astroKey: 'Mars in Leo',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P29',
    upright: 'defend, stand',
    shadow: 'overwhelm, clash',
  },
  {
    id: '8',
    name: 'Eight',
    rank: '8',
    astroKey: 'Mercury in Sagittarius',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P30',
    upright: 'speed, signal',
    shadow: 'scatter, missed',
  },
  {
    id: '9',
    name: 'Nine',
    rank: '9',
    astroKey: 'Moon in Sagittarius',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P31',
    upright: 'persevere, guard',
    shadow: 'paranoia, fatigue',
  },
  {
    id: '10',
    name: 'Ten',
    rank: '10',
    astroKey: 'Saturn in Sagittarius',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P32',
    upright: 'burden, duty',
    shadow: 'burnout, martyr',
  },
];

const WANDS_COURT: CourtMeta = {
  id: 'W_court',
  name: 'Wands Court',
  mutableSign: 'Sagittarius',
  cardinalSign: 'Aries',
  fixedSign: 'Leo',
  poem_slot: 'P33',
  upright: 'curiosity',
  shadow: 'inconsistency',
};

const CUPS_PIPS: PipMeta[] = [
  {
    id: 'A',
    name: 'Ace',
    rank: 'Ace',
    astroKey: 'Water',
    astroType: 'element',
    decan_index: 0,
    poem_slot: 'P37',
    upright: 'feeling, open',
    shadow: 'flood, naive',
  },
  {
    id: '2',
    name: 'Two',
    rank: '2',
    astroKey: 'Venus in Cancer',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P38',
    upright: 'union, mirror',
    shadow: 'clinging, projection',
  },
  {
    id: '3',
    name: 'Three',
    rank: '3',
    astroKey: 'Mercury in Cancer',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P39',
    upright: 'celebrate, circle',
    shadow: 'overindulge, gossip',
  },
  {
    id: '4',
    name: 'Four',
    rank: '4',
    astroKey: 'Moon in Cancer',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P40',
    upright: 'pause, ponder',
    shadow: 'apathy, sulk',
  },
  {
    id: '5',
    name: 'Five',
    rank: '5',
    astroKey: 'Mars in Scorpio',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P41',
    upright: 'grief, regret',
    shadow: 'ruminate, stuck',
  },
  {
    id: '6',
    name: 'Six',
    rank: '6',
    astroKey: 'Sun in Scorpio',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P42',
    upright: 'memory, kindness',
    shadow: 'nostalgia, stagnate',
  },
  {
    id: '7',
    name: 'Seven',
    rank: '7',
    astroKey: 'Venus in Scorpio',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P43',
    upright: 'vision, options',
    shadow: 'illusion, escape',
  },
  {
    id: '8',
    name: 'Eight',
    rank: '8',
    astroKey: 'Saturn in Pisces',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P44',
    upright: 'depart, seek',
    shadow: 'avoid, drifting',
  },
  {
    id: '9',
    name: 'Nine',
    rank: '9',
    astroKey: 'Jupiter in Pisces',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P45',
    upright: 'satisfaction, wish',
    shadow: 'complacent, smug',
  },
  {
    id: '10',
    name: 'Ten',
    rank: '10',
    astroKey: 'Mars in Pisces',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P46',
    upright: 'harmony, home',
    shadow: 'performative, denial',
  },
];

const CUPS_COURT: CourtMeta = {
  id: 'C_court',
  name: 'Cups Court',
  mutableSign: 'Pisces',
  cardinalSign: 'Cancer',
  fixedSign: 'Scorpio',
  poem_slot: 'P47',
  upright: 'empathy',
  shadow: 'overwhelm',
};

const SWORDS_PIPS: PipMeta[] = [
  {
    id: 'A',
    name: 'Ace',
    rank: 'Ace',
    astroKey: 'Air',
    astroType: 'element',
    decan_index: 0,
    poem_slot: 'P51',
    upright: 'clarity, surge',
    shadow: 'sharpness, cold',
  },
  {
    id: '2',
    name: 'Two',
    rank: '2',
    astroKey: 'Moon in Libra',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P52',
    upright: 'truce, balance',
    shadow: 'stalemate, denial',
  },
  {
    id: '3',
    name: 'Three',
    rank: '3',
    astroKey: 'Saturn in Libra',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P53',
    upright: 'pain, clarity',
    shadow: 'heartbreak, sting',
  },
  {
    id: '4',
    name: 'Four',
    rank: '4',
    astroKey: 'Jupiter in Libra',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P54',
    upright: 'rest, reset',
    shadow: 'stall, avoidance',
  },
  {
    id: '5',
    name: 'Five',
    rank: '5',
    astroKey: 'Venus in Aquarius',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P55',
    upright: 'discord, cost',
    shadow: 'spite, isolation',
  },
  {
    id: '6',
    name: 'Six',
    rank: '6',
    astroKey: 'Mercury in Aquarius',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P56',
    upright: 'passage, guide',
    shadow: 'baggage, drifting',
  },
  {
    id: '7',
    name: 'Seven',
    rank: '7',
    astroKey: 'Moon in Aquarius',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P57',
    upright: 'stealth, strategy',
    shadow: 'deceit, self-sabotage',
  },
  {
    id: '8',
    name: 'Eight',
    rank: '8',
    astroKey: 'Jupiter in Gemini',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P58',
    upright: 'constraint, belief',
    shadow: 'trapped, doubt',
  },
  {
    id: '9',
    name: 'Nine',
    rank: '9',
    astroKey: 'Mars in Gemini',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P59',
    upright: 'anxiety, night',
    shadow: 'rumination, dread',
  },
  {
    id: '10',
    name: 'Ten',
    rank: '10',
    astroKey: 'Sun in Gemini',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P60',
    upright: 'ending, release',
    shadow: 'overkill, defeat',
  },
];

const SWORDS_COURT: CourtMeta = {
  id: 'S_court',
  name: 'Swords Court',
  mutableSign: 'Gemini',
  cardinalSign: 'Libra',
  fixedSign: 'Aquarius',
  poem_slot: 'P61',
  upright: 'analysis',
  shadow: 'detached',
};

const PENTACLES_PIPS: PipMeta[] = [
  {
    id: 'A',
    name: 'Ace',
    rank: 'Ace',
    astroKey: 'Earth',
    astroType: 'element',
    decan_index: 0,
    poem_slot: 'P65',
    upright: 'seed, material',
    shadow: 'stuck, dull',
  },
  {
    id: '2',
    name: 'Two',
    rank: '2',
    astroKey: 'Jupiter in Capricorn',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P66',
    upright: 'adapt, juggle',
    shadow: 'instability, scatter',
  },
  {
    id: '3',
    name: 'Three',
    rank: '3',
    astroKey: 'Mars in Capricorn',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P67',
    upright: 'craft, collaborate',
    shadow: 'ego, silo',
  },
  {
    id: '4',
    name: 'Four',
    rank: '4',
    astroKey: 'Sun in Capricorn',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P68',
    upright: 'security, conserve',
    shadow: 'clutch, control',
  },
  {
    id: '5',
    name: 'Five',
    rank: '5',
    astroKey: 'Mercury in Taurus',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P69',
    upright: 'hardship, scarcity',
    shadow: 'isolation, lack',
  },
  {
    id: '6',
    name: 'Six',
    rank: '6',
    astroKey: 'Moon in Taurus',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P70',
    upright: 'generosity, flow',
    shadow: 'strings, imbalance',
  },
  {
    id: '7',
    name: 'Seven',
    rank: '7',
    astroKey: 'Saturn in Taurus',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P71',
    upright: 'patience, assess',
    shadow: 'impatience, doubt',
  },
  {
    id: '8',
    name: 'Eight',
    rank: '8',
    astroKey: 'Sun in Virgo',
    astroType: 'sign',
    decan_index: 1,
    poem_slot: 'P72',
    upright: 'practice, mastery',
    shadow: 'perfectionism, grind',
  },
  {
    id: '9',
    name: 'Nine',
    rank: '9',
    astroKey: 'Venus in Virgo',
    astroType: 'sign',
    decan_index: 2,
    poem_slot: 'P73',
    upright: 'independence, enjoy',
    shadow: 'status, isolation',
  },
  {
    id: '10',
    name: 'Ten',
    rank: '10',
    astroKey: 'Mercury in Virgo',
    astroType: 'sign',
    decan_index: 3,
    poem_slot: 'P74',
    upright: 'legacy, lineage',
    shadow: 'dynasty, burden',
  },
];

const PENTACLES_COURT: CourtMeta = {
  id: 'P_court',
  name: 'Pentacles Court',
  mutableSign: 'Virgo',
  cardinalSign: 'Capricorn',
  fixedSign: 'Taurus',
  poem_slot: 'P75',
  upright: 'reliability',
  shadow: 'stagnation',
};

export const WANDS = buildSuit('W', 'Wands', 'Fire', WANDS_PIPS, WANDS_COURT);
export const CUPS = buildSuit('C', 'Cups', 'Water', CUPS_PIPS, CUPS_COURT);
export const SWORDS = buildSuit('S', 'Swords', 'Air', SWORDS_PIPS, SWORDS_COURT);
export const PENTACLES = buildSuit(
  'P',
  'Pentacles',
  'Earth',
  PENTACLES_PIPS,
  PENTACLES_COURT
);

export const MINORS: Card[] = [...WANDS, ...CUPS, ...SWORDS, ...PENTACLES];
