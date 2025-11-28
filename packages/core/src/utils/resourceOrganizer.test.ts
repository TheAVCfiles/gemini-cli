/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  organizeResources,
  type OrganizedResources,
  type ResourceDescriptor,
} from './resourceOrganizer.js';

describe('organizeResources', () => {
  it('groups resources into semantic categories using heuristics', () => {
    const descriptors: ResourceDescriptor[] = [
      { name: 'Critical Execution Blueprint: Q4 2025 - API Migration.pdf', typeHint: 'PDF' },
      { name: 'StagePort_Executive_Deck.pdf', typeHint: 'PDF' },
      { name: 'Marley_Sensor_Floor_Schematic_Spec 2.pdf', typeHint: 'PDF' },
      { name: 'DTG_Investor_SOS_OnePager.pdf', typeHint: 'PDF' },
      { name: 'Market_Artistic_Fusion_Report.pdf', typeHint: 'PDF' },
      { name: 'text 149.txt', typeHint: 'Document' },
      { name: 'Stagecraft Sandbox: A Critical Analysis for Implementation', typeHint: 'Google Docs' },
      { name: 'api-dance-co-starter.zip', typeHint: 'Zip Archive' },
      { name: 'Graham_Glitch_Engine 2.ipynb', typeHint: 'Notebook' },
      { name: 'proof_report_DEMO.md' },
    ];

    const organized = organizeResources(descriptors);
    const byCategory: OrganizedResources['totals']['byCategory'] = organized.totals.byCategory;

    expect(byCategory.strategyAndBriefs).toBe(1);
    expect(byCategory.presentations).toBe(1);
    expect(byCategory.technicalSpecs).toBe(2);
    expect(byCategory.financialAndLegal).toBe(1);
    expect(byCategory.notesAndTranscripts).toBe(2);
    expect(byCategory.cloudDocs).toBe(1);
    expect(byCategory.archives).toBe(1);
    expect(byCategory.dataAndResearch).toBe(1);
    expect(byCategory.uncategorized).toBe(0);

    const strategy = organized.categories.find((category) => category.id === 'strategyAndBriefs');
    expect(strategy?.resources.map((resource) => resource.name)).toContain(
      'Critical Execution Blueprint: Q4 2025 - API Migration.pdf',
    );
    expect(strategy?.resources[0].matchReason.length).toBeGreaterThan(0);
  });

  it('falls back to name keyword heuristics when type hints and extensions are unavailable', () => {
    const descriptors: ResourceDescriptor[] = [
      { name: 'Custodial_Artistic_Calling_Statement' },
      { name: 'Synthescopes_Brand_Registration_Brief', tags: ['brand'] },
      { name: 'Random file without cues' },
    ];

    const organized = organizeResources(descriptors);
    const creative = organized.categories.find((category) => category.id === 'creativeAssets');
    const strategy = organized.categories.find((category) => category.id === 'strategyAndBriefs');
    const uncategorized = organized.categories.find((category) => category.id === 'uncategorized');

    expect(creative?.resources.map((resource) => resource.name)).toContain(
      'Custodial_Artistic_Calling_Statement',
    );
    expect(strategy?.resources.map((resource) => resource.name)).toContain(
      'Synthescopes_Brand_Registration_Brief',
    );
    expect(uncategorized?.resources.map((resource) => resource.name)).toContain(
      'Random file without cues',
    );
  });
});

