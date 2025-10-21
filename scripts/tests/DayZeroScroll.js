/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

async function loadJson(...segments) {
  const filePath = join(repoRoot, ...segments);
  const raw = await readFile(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(`[DayZeroScroll] ${message}`);
  }
}

const collator = new Intl.Collator('en', { sensitivity: 'base' });

export async function runDayZeroUnitTests() {
  const glossary = await loadJson('web', 'glossary.json');
  assertCondition(Array.isArray(glossary), 'Expected web/glossary.json to contain an array');
  assertCondition(glossary.length > 0, 'web/glossary.json must contain at least one entry');

  const seenTerms = new Set();
  const duplicateTerms = new Set();
  const shortDefinitions = [];
  const summary = {
    totalEntries: glossary.length,
    minimumDefinitionLength: Number.POSITIVE_INFINITY,
  };

  let previousTerm = null;
  glossary.forEach((entry, index) => {
    assertCondition(entry && typeof entry === 'object', `Entry at index ${index} must be an object`);

    const { term, definition, sources } = entry;
    assertCondition(typeof term === 'string' && term.trim().length > 0, `Entry ${index} is missing a valid term`);
    assertCondition(typeof definition === 'string' && definition.trim().length > 0, `Entry ${term} is missing a definition`);
    assertCondition(typeof sources === 'string' && sources.trim().length > 0, `Entry ${term} requires a non-empty sources field`);

    const normalizedTerm = term.trim();
    const lowerTerm = normalizedTerm.toLowerCase();
    if (seenTerms.has(lowerTerm)) {
      duplicateTerms.add(normalizedTerm);
    } else {
      seenTerms.add(lowerTerm);
    }

    if (previousTerm) {
      const comparison = collator.compare(previousTerm, normalizedTerm);
      assertCondition(
        comparison <= 0,
        `Glossary terms must be sorted alphabetically (\"${previousTerm}\" should not appear before \"${normalizedTerm}\")`,
      );
    }
    previousTerm = normalizedTerm;

    const length = definition.trim().length;
    summary.minimumDefinitionLength = Math.min(summary.minimumDefinitionLength, length);
    if (length < 40) {
      shortDefinitions.push(normalizedTerm);
    }
  });

  assertCondition(duplicateTerms.size === 0, `Found duplicate glossary terms: ${[...duplicateTerms].join(', ')}`);
  assertCondition(shortDefinitions.length === 0, `Definitions for ${shortDefinitions.join(', ')} appear to be too short`);

  if (!Number.isFinite(summary.minimumDefinitionLength)) {
    summary.minimumDefinitionLength = 0;
  }

  return summary;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;
const houseSystems = new Set(['Placidus', 'Whole Sign', 'Equal', 'Koch', 'Porphyry']);
const aspectWhitelist = new Set([
  'conjunct',
  'square',
  'trine',
  'sextile',
  'opposition',
  'quincunx',
]);

export async function runEphemerisUnitTests() {
  const sample = await loadJson('docs', 'avc-studio', 'DecryptTheFuture_Sample_Allison.json');
  assertCondition(sample && typeof sample === 'object', 'Sample dataset must be an object');

  const requiredTopLevel = ['profile', 'natal', 'cycles', 'scores', 'ui'];
  const missingTopLevel = requiredTopLevel.filter((field) => !(field in sample));
  assertCondition(missingTopLevel.length === 0, `Sample dataset is missing fields: ${missingTopLevel.join(', ')}`);

  const { profile, natal, cycles, scores, ui } = sample;

  assertCondition(profile && typeof profile === 'object', 'profile must be an object');
  assertCondition(typeof profile.displayName === 'string' && profile.displayName.trim(), 'profile.displayName must be a string');
  if ('note' in profile && profile.note !== null) {
    assertCondition(typeof profile.note === 'string', 'profile.note must be a string when provided');
  }

  assertCondition(natal && typeof natal === 'object', 'natal must be an object');
  assertCondition(typeof natal.date === 'string' && isoDatePattern.test(natal.date), 'natal.date must use YYYY-MM-DD format');
  assertCondition(typeof natal.time === 'string' && timePattern.test(natal.time), 'natal.time must use HH:MM format');
  assertCondition(typeof natal.tz === 'string' && natal.tz.includes('/'), 'natal.tz must be a valid timezone identifier');
  assertCondition(natal.location && typeof natal.location === 'object', 'natal.location must be an object');

  const { location } = natal;
  if (location.city !== undefined && location.city !== null) {
    assertCondition(typeof location.city === 'string' && location.city.trim().length > 0, 'natal.location.city must be a string');
  }
  if (location.lat !== undefined && location.lat !== null) {
    assertCondition(
      typeof location.lat === 'number' && Number.isFinite(location.lat) && Math.abs(location.lat) <= 90,
      'natal.location.lat must be a latitude between -90 and 90',
    );
  }
  if (location.lon !== undefined && location.lon !== null) {
    assertCondition(
      typeof location.lon === 'number' && Number.isFinite(location.lon) && Math.abs(location.lon) <= 180,
      'natal.location.lon must be a longitude between -180 and 180',
    );
  }
  if (natal.houseSystem !== undefined && natal.houseSystem !== null) {
    assertCondition(
      typeof natal.houseSystem === 'string' && houseSystems.has(natal.houseSystem),
      `natal.houseSystem must be one of: ${[...houseSystems].join(', ')}`,
    );
  }

  assertCondition(cycles && typeof cycles === 'object', 'cycles must be an object');
  const transits = Array.isArray(cycles.transits) ? cycles.transits : [];
  assertCondition(transits.length > 0, 'cycles.transits must contain at least one transit');

  ['progressions', 'solarArcs', 'returns'].forEach((field) => {
    if (field in cycles) {
      assertCondition(Array.isArray(cycles[field]), `cycles.${field} must be an array when provided`);
    }
  });

  const transitKeys = new Set();
  let previousTransitDate = null;
  transits.forEach((transit, index) => {
    assertCondition(transit && typeof transit === 'object', `transits[${index}] must be an object`);

    const { date, planet, aspect, to, score, orb, notes } = transit;
    assertCondition(typeof date === 'string' && isoDatePattern.test(date), `transits[${index}].date must use YYYY-MM-DD format`);
    assertCondition(typeof planet === 'string' && planet.trim(), `transits[${index}].planet must be a non-empty string`);
    assertCondition(typeof aspect === 'string' && aspect.trim(), `transits[${index}].aspect must be a non-empty string`);
    assertCondition(
      aspectWhitelist.has(aspect.toLowerCase()),
      `transits[${index}].aspect \"${aspect}\" is not in the approved list`,
    );
    assertCondition(typeof to === 'string' && to.trim(), `transits[${index}].to must be a non-empty string`);
    assertCondition(typeof score === 'number' && Number.isFinite(score), `transits[${index}].score must be a number`);
    assertCondition(score >= -100 && score <= 100, `transits[${index}].score must be between -100 and 100`);
    if (orb !== undefined && orb !== null) {
      assertCondition(typeof orb === 'number' && Number.isFinite(orb) && orb >= 0, `transits[${index}].orb must be a positive number`);
    }
    if (notes !== undefined && notes !== null) {
      assertCondition(typeof notes === 'string', `transits[${index}].notes must be a string when provided`);
    }

    if (previousTransitDate) {
      assertCondition(
        date >= previousTransitDate,
        `transits must be sorted by date (${date} should not appear before ${previousTransitDate})`,
      );
    }
    previousTransitDate = date;

    const key = `${date}|${planet}|${aspect}|${to}`.toLowerCase();
    assertCondition(!transitKeys.has(key), `Duplicate transit detected for ${date} ${planet} ${aspect} ${to}`);
    transitKeys.add(key);
  });

  assertCondition(scores && typeof scores === 'object', 'scores must be an object');
  const dailyScores = Array.isArray(scores.daily) ? scores.daily : [];
  assertCondition(dailyScores.length > 0, 'scores.daily must contain at least one entry');

  const seenDailyDates = new Set();
  let previousDailyDate = null;
  dailyScores.forEach((entry, index) => {
    assertCondition(entry && typeof entry === 'object', `scores.daily[${index}] must be an object`);
    const { date, pos, neg } = entry;
    assertCondition(typeof date === 'string' && isoDatePattern.test(date), `scores.daily[${index}].date must use YYYY-MM-DD format`);
    assertCondition(typeof pos === 'number' && Number.isFinite(pos) && pos >= 0, `scores.daily[${index}].pos must be a positive number`);
    assertCondition(typeof neg === 'number' && Number.isFinite(neg) && neg <= 0, `scores.daily[${index}].neg must be a negative number`);

    const key = date;
    assertCondition(!seenDailyDates.has(key), `Duplicate daily score detected for ${date}`);
    seenDailyDates.add(key);

    if (previousDailyDate) {
      assertCondition(
        date >= previousDailyDate,
        `scores.daily entries must be sorted by date (${date} should not appear before ${previousDailyDate})`,
      );
    }
    previousDailyDate = date;
  });

  assertCondition(ui && typeof ui === 'object', 'ui must be an object');
  if ('theme' in ui) {
    assertCondition(typeof ui.theme === 'string' && ui.theme.trim(), 'ui.theme must be a string when provided');
  }
  if ('showScores' in ui) {
    assertCondition(typeof ui.showScores === 'boolean', 'ui.showScores must be a boolean');
  }
  if ('reducedMotion' in ui) {
    assertCondition(typeof ui.reducedMotion === 'boolean', 'ui.reducedMotion must be a boolean');
  }

  return {
    transitCount: transits.length,
    dailyScoreCount: dailyScores.length,
    dateRange: {
      start: dailyScores[0]?.date ?? null,
      end: dailyScores[dailyScores.length - 1]?.date ?? null,
    },
  };
}
