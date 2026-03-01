/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { extname } from 'node:path';

export interface ResourceDescriptor {
  /**
   * Human readable name of the resource. This is usually the file name or
   * document title shared by the user.
   */
  name: string;
  /**
   * Optional location for the resource. Useful when a file lives in cloud
   * storage (e.g. Google Drive) or a local path. The value is only used as
   * additional context in the resulting catalog.
   */
  location?: string;
  /**
   * Optional hint describing the resource type. These are the short labels the
   * user commonly sees in drive listings such as "PDF", "Google Docs",
   * "Document", etc.
   */
  typeHint?: string;
  /**
   * Optional free-form tags that can be used to label the resource. The
   * organizer keeps the tags so higher level systems can build workflows on
   * top of the structured output.
   */
  tags?: string[];
  /**
   * Additional free-form notes captured during ingestion.
   */
  notes?: string;
}

export type ResourceCategoryId =
  | 'strategyAndBriefs'
  | 'presentations'
  | 'technicalSpecs'
  | 'financialAndLegal'
  | 'creativeAssets'
  | 'dataAndResearch'
  | 'archives'
  | 'notesAndTranscripts'
  | 'cloudDocs'
  | 'uncategorized';

export interface ResourceSummary extends ResourceDescriptor {
  categoryId: ResourceCategoryId;
  categoryLabel: string;
  matchReason: string;
}

export interface ResourceCategory {
  id: ResourceCategoryId;
  label: string;
  resources: ResourceSummary[];
}

export interface OrganizedResources {
  categories: ResourceCategory[];
  totals: {
    overall: number;
    byCategory: Record<ResourceCategoryId, number>;
  };
}

interface CategoryMetadata {
  readonly id: ResourceCategoryId;
  readonly label: string;
  readonly keywords?: readonly string[];
  readonly typeHints?: readonly string[];
  readonly extensions?: readonly string[];
}

const CATEGORY_METADATA: readonly CategoryMetadata[] = [
  {
    id: 'strategyAndBriefs',
    label: 'Strategy & Briefs',
    keywords: ['brief', 'blueprint', 'roadmap', 'plan', 'protocol'],
  },
  {
    id: 'presentations',
    label: 'Decks & Presentations',
    keywords: ['deck', 'presentation', 'storyboard'],
    extensions: ['.ppt', '.pptx', '.key'],
  },
  {
    id: 'technicalSpecs',
    label: 'Technical Specs & Engineering',
    keywords: ['schematic', 'spec', 'api', 'sensor', 'engine', 'protocol'],
    extensions: ['.ipynb', '.py', '.js'],
    typeHints: ['notebook'],
  },
  {
    id: 'financialAndLegal',
    label: 'Financial & Legal',
    keywords: ['investor', 'portfolio', 'sos'],
  },
  {
    id: 'dataAndResearch',
    label: 'Data & Research',
    keywords: ['analysis', 'study', 'report', 'map'],
    extensions: ['.csv', '.json'],
  },
  {
    id: 'creativeAssets',
    label: 'Creative & Brand Assets',
    keywords: ['brand', 'explained', 'storyboard', 'visual', 'demo', 'artistic', 'custodial'],
  },
  {
    id: 'archives',
    label: 'Archives & Bundles',
    typeHints: ['zip archive'],
    extensions: ['.zip'],
  },
  {
    id: 'notesAndTranscripts',
    label: 'Notes & Text Artifacts',
    keywords: ['text', 'note', 'transcript'],
    extensions: ['.txt', '.md'],
  },
  {
    id: 'cloudDocs',
    label: 'Cloud Docs & Links',
    typeHints: ['google docs', 'google drive', 'webarchive'],
    extensions: ['.html', '.webarchive'],
  },
  {
    id: 'uncategorized',
    label: 'Uncategorized',
  },
];

const EXTENSION_TO_CATEGORY = new Map<string, ResourceCategoryId>();
for (const metadata of CATEGORY_METADATA) {
  for (const extension of metadata.extensions ?? []) {
    EXTENSION_TO_CATEGORY.set(extension, metadata.id);
  }
}

function normalize(value: string | undefined): string | undefined {
  return value?.trim().toLowerCase();
}

function findCategoryByPredicate(
  metadata: readonly CategoryMetadata[],
  predicate: (category: CategoryMetadata) => boolean,
): CategoryMetadata | undefined {
  return metadata.find(predicate);
}

function inferCategory(
  descriptor: ResourceDescriptor,
): { metadata: CategoryMetadata; reason: string } {
  const normalizedTypeHint = normalize(descriptor.typeHint);
  if (normalizedTypeHint) {
    const match = findCategoryByPredicate(CATEGORY_METADATA, ({
      typeHints,
    }) => typeHints?.some((hint) => normalizedTypeHint.includes(hint)));
    if (match) {
      return { metadata: match, reason: `matched type hint "${descriptor.typeHint}"` };
    }
  }

  const extension = normalize(extname(descriptor.name || descriptor.location || ''));
  if (extension) {
    const categoryId = EXTENSION_TO_CATEGORY.get(extension);
    if (categoryId) {
      const match = CATEGORY_METADATA.find(({ id }) => id === categoryId);
      if (match) {
        return {
          metadata: match,
          reason: `matched extension "${extension}"`,
        };
      }
    }
  }

  const normalizedName = normalize(descriptor.name) ?? '';
  if (normalizedName) {
    const match = findCategoryByPredicate(CATEGORY_METADATA, ({ keywords }) =>
      keywords?.some((keyword) => normalizedName.includes(keyword)) ?? false,
    );
    if (match) {
      return {
        metadata: match,
        reason: `matched keyword in name`,
      };
    }
  }

  return {
    metadata: CATEGORY_METADATA.find(({ id }) => id === 'uncategorized')!,
    reason: 'no heuristics matched',
  };
}

export function organizeResources(
  descriptors: ResourceDescriptor[],
): OrganizedResources {
  const categoryMap = new Map<ResourceCategoryId, ResourceCategory>();

  for (const metadata of CATEGORY_METADATA) {
    categoryMap.set(metadata.id, {
      id: metadata.id,
      label: metadata.label,
      resources: [],
    });
  }

  for (const descriptor of descriptors) {
    const { metadata, reason } = inferCategory(descriptor);
    const summary: ResourceSummary = {
      ...descriptor,
      categoryId: metadata.id,
      categoryLabel: metadata.label,
      matchReason: reason,
    };
    categoryMap.get(metadata.id)?.resources.push(summary);
  }

  const totals: OrganizedResources['totals'] = {
    overall: descriptors.length,
    byCategory: Object.fromEntries(
      [...categoryMap.entries()].map(([id, category]) => [id, category.resources.length]),
    ) as Record<ResourceCategoryId, number>,
  };

  return {
    categories: [...categoryMap.values()],
    totals,
  };
}

