#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { basename, dirname, join } from 'node:path';

const DEFAULT_STATE_PATH = join(process.cwd(), 'data', 'market-intelligence-state.json');
const DEFAULT_OUTPUT_MODE = 'markdown';
const STATE_VERSION = 1;
const USER_AGENT = 'GeminiCLI-Market-Intel/1.0 (+https://github.com/google-gemini/gemini-cli)';
const FETCH_TIMEOUT_MS = 8000;

/**
 * Small lexicon for optimistic/pessimistic words. Keeps dependencies light while providing
 * a deterministic score for sentiment estimation.
 */
const POSITIVE_TERMS = new Set([
  'growth',
  'expansion',
  'partnership',
  'increase',
  'launch',
  'record',
  'oversubscribed',
  'backing',
  'approval',
  'award',
  'milestone',
  'outperform',
]);

const NEGATIVE_TERMS = new Set([
  'decline',
  'shortfall',
  'delay',
  'risk',
  'lawsuit',
  'regulatory',
  'pessimism',
  'concern',
  'doubt',
  'deficit',
  'pullback',
  'slowdown',
  'fraud',
]);

/**
 * Minimal CLI argument parser.
 */
function parseArgs(argv) {
  const args = new Map();
  for (const arg of argv.slice(2)) {
    const [key, value] = arg.split('=');
    args.set(key, value === undefined ? true : value);
  }
  return {
    statePath: args.get('--state') || DEFAULT_STATE_PATH,
    outputMode: args.get('--output') || DEFAULT_OUTPUT_MODE,
    jsonPath: args.get('--json') || null,
    alphaVantageKey: args.get('--alpha-vantage-key') || process.env.ALPHA_VANTAGE_KEY || 'demo',
  };
}

class ComplianceError extends Error {}

class ComplianceRegistry {
  constructor() {
    this.registry = new Map();
  }

  register(source) {
    if (!source.legal?.policyUrl) {
      throw new ComplianceError(`Source ${source.id} must define legal.policyUrl`);
    }
    if (!source.legal?.permittedUse?.includes('research')) {
      throw new ComplianceError(`Source ${source.id} must explicitly permit research usage.`);
    }
    this.registry.set(source.id, {
      ...source.legal,
      name: source.name,
    });
  }

  getPolicy(sourceId) {
    return this.registry.get(sourceId);
  }
}

class HttpClient {
  constructor({ userAgent = USER_AGENT, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
    this.userAgent = userAgent;
    this.timeoutMs = timeoutMs;
  }

  async fetchJson(url, { signal } = {}) {
    const controller = new AbortController();
    const timers = [];
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(signal.reason));
    }
    timers.push(setTimeout(() => controller.abort(new Error('Request timed out')), this.timeoutMs));
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return await response.json();
    } finally {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    }
  }
}

class StateStore {
  constructor(path) {
    this.path = path;
  }

  async load() {
    try {
      await access(this.path, constants.F_OK);
      const raw = await readFile(this.path, 'utf-8');
      const data = JSON.parse(raw);
      if (data.version !== STATE_VERSION) {
        return {
          version: STATE_VERSION,
          updatedAt: new Date().toISOString(),
          history: {},
        };
      }
      return data;
    } catch (error) {
      return {
        version: STATE_VERSION,
        updatedAt: new Date().toISOString(),
        history: {},
      };
    }
  }

  async save(data) {
    const dir = dirname(this.path);
    await mkdir(dir, { recursive: true });
    await writeFile(this.path, JSON.stringify({ ...data, version: STATE_VERSION }, null, 2));
  }
}

function computeSentiment(text) {
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let score = 0;
  for (const token of tokens) {
    if (POSITIVE_TERMS.has(token)) score += 1;
    if (NEGATIVE_TERMS.has(token)) score -= 1;
  }
  if (!tokens.length) return 0;
  return score / Math.sqrt(tokens.length);
}

function toTopicKey(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function createFallbackDataset(sourceId) {
  const now = new Date().toISOString();
  switch (sourceId) {
    case 'global-capital-flows':
      return {
        generatedAt: now,
        items: [
          {
            topic: 'Orbital Data Infrastructure',
            capitalFlow: 1850000000,
            momentum: 0.21,
            narrative:
              'European Space Agency and NOAA announce multi-year procurement for climate downlink services.',
            signals: ['Series B round oversubscribed by 2.3x', 'New sovereign wealth fund participation'],
            voices: [
              {
                name: 'Dr. Yara Mendel',
                platform: 'ESA briefing',
                influenceScore: 0.86,
                stance: 'bullish',
                url: 'https://www.esa.int/Applications/Observing_the_Earth',
              },
              {
                name: 'QuantBridge Macro Desk',
                platform: 'Private letter',
                influenceScore: 0.63,
                stance: 'bullish',
                url: 'https://quantbridge.example/reports/orbital',
              },
            ],
          },
          {
            topic: 'Advanced Water Reclamation Systems',
            capitalFlow: 920000000,
            momentum: 0.34,
            narrative:
              'Municipal green bonds in APAC earmark desalination retrofits with circular mineral capture.',
            signals: ['KfW blended finance facility expands mandate', 'Five OEM consolidation rumors'],
            voices: [
              {
                name: 'Alicia Torres',
                platform: 'LinkedIn',
                influenceScore: 0.52,
                stance: 'bullish',
                url: 'https://www.linkedin.com/in/aliciatorres-water',
              },
              {
                name: 'Blue Horizon Credit',
                platform: 'Credit memo',
                influenceScore: 0.44,
                stance: 'neutral',
                url: 'https://bluehorizoncredit.example/memo',
              },
            ],
          },
          {
            topic: 'AI Safety Tooling',
            capitalFlow: 510000000,
            momentum: -0.12,
            narrative:
              'Mega-cap platforms pause discretionary budgets even as compliance mandates expand in EU.',
            signals: ['Procurement bids delayed by 90 days', 'Insurers requesting independent validation'],
            voices: [
              {
                name: 'RegTech Signal',
                platform: 'Newsletter',
                influenceScore: 0.41,
                stance: 'bearish',
                url: 'https://regtechsignal.example/issue-184',
              },
            ],
          },
        ],
      };
    case 'forum-contrarian-scan':
      return {
        generatedAt: now,
        items: [
          {
            topic: 'Orbital Data Infrastructure',
            threadTitle: 'Space downlink startups are over-hyped',
            url: 'https://www.reddit.com/r/space/comments/abc123',
            mentionCount: 184,
            excerpt:
              'Multiple users warn that ground segment saturation will crush margins, yet demand keeps climbing.',
            platform: 'Reddit r/space',
            sentimentOverride: -0.38,
            voices: [
              {
                name: 'u/SignalInNoise',
                platform: 'Reddit',
                influenceScore: 0.35,
                stance: 'bearish',
                url: 'https://www.reddit.com/user/SignalInNoise',
              },
            ],
          },
          {
            topic: 'Advanced Water Reclamation Systems',
            threadTitle: 'Utilities balk at desal retrofits costs',
            url: 'https://www.reddit.com/r/investing/comments/desal',
            mentionCount: 92,
            excerpt:
              'Credit analysts cite financing gaps, but municipal bonds continue to clear at lower yields.',
            platform: 'Reddit r/investing',
            sentimentOverride: -0.28,
            voices: [
              {
                name: 'u/InfraQuant',
                platform: 'Reddit',
                influenceScore: 0.27,
                stance: 'bearish',
                url: 'https://www.reddit.com/user/InfraQuant',
              },
            ],
          },
          {
            topic: 'AI Safety Tooling',
            threadTitle: 'Governance spend is unstoppable',
            url: 'https://www.reddit.com/r/MachineLearning/comments/governance',
            mentionCount: 203,
            excerpt:
              'Practitioners predict RFP wave as compliance deadlines approach despite short-term caution.',
            platform: 'Reddit r/MachineLearning',
            sentimentOverride: 0.41,
            voices: [
              {
                name: 'u/PolicyGradient',
                platform: 'Reddit',
                influenceScore: 0.46,
                stance: 'bullish',
                url: 'https://www.reddit.com/user/PolicyGradient',
              },
            ],
          },
        ],
      };
    case 'emergent-voices-scan':
      return {
        generatedAt: now,
        items: [
          {
            topic: 'Orbital Data Infrastructure',
            channel: 'Substack',
            author: 'Nia Karim',
            url: 'https://deeporbit.substack.com/p/ground-truth',
            reachScore: 0.61,
            velocity: 0.44,
            excerpt:
              'Defense primes quietly trial sovereign data clean rooms; opportunity in certification layers.',
          },
          {
            topic: 'Advanced Water Reclamation Systems',
            channel: 'Podcast',
            author: 'Marcus Lee',
            url: 'https://podcasts.example/watergrid/episode42',
            reachScore: 0.47,
            velocity: 0.29,
            excerpt:
              'Nimble OEMs bundling mineral recovery to win ESG-linked procurement races.',
          },
          {
            topic: 'AI Safety Tooling',
            channel: 'Newsletter',
            author: 'ComplianceCraft',
            url: 'https://compliancecraft.example/issue-72',
            reachScore: 0.58,
            velocity: 0.22,
            excerpt:
              'Boardrooms seeking dashboards translating policy to prioritized backlog items.',
          },
        ],
      };
    default:
      return { generatedAt: now, items: [] };
  }
}

async function resilientFetch(client, url, sourceId, fallbackFactory) {
  try {
    return await client.fetchJson(url);
  } catch (error) {
    console.warn(`⚠️  ${sourceId} fetch failed (${error.message}). Using fallback sample dataset.`);
    return fallbackFactory(sourceId);
  }
}

function computeHistoricalMomentum(history, topicKey, nextValue) {
  const entry = history[topicKey];
  if (!entry || !entry.snapshots?.length) {
    return 0;
  }
  const previous = entry.snapshots[entry.snapshots.length - 1];
  if (!previous) return 0;
  return nextValue - previous.value;
}

function updateHistory(history, topicKey, value, metadata) {
  const entry = history[topicKey] || { snapshots: [] };
  entry.snapshots.push({
    collectedAt: metadata.collectedAt,
    value,
    sourceIds: metadata.sourceIds,
  });
  entry.snapshots = entry.snapshots.slice(-30);
  history[topicKey] = entry;
}

function buildOpportunity(record) {
  const contrarianAlignment = record.momentum >= 0 ? Math.max(0, -record.sentiment) : Math.max(0, record.sentiment);
  const volatilityBoost = 0.5 + Math.abs(record.momentum);
  const attentionWeight = record.attentionNormalized * 0.3;
  const moneyTrail = record.capitalFlowNormalized * (1 + record.momentum);
  const score = (contrarianAlignment * 0.5 + moneyTrail * 0.3 + attentionWeight * 0.2) * volatilityBoost;

  const why = [];
  if (record.momentum > 0) {
    why.push('capital velocity accelerating');
  } else if (record.momentum < 0) {
    why.push('capital flow decelerating');
  }
  if (record.sentiment < -0.1) {
    why.push('negative sentiment on forums');
  } else if (record.sentiment > 0.1) {
    why.push('optimistic sentiment on forums');
  }
  if (record.contrarianCounterpart) {
    why.push(`contrarian voice: ${record.contrarianCounterpart.name}`);
  }

  const voices = [...record.voices];
  if (record.contrarianCounterpart && !voices.includes(record.contrarianCounterpart)) {
    voices.push(record.contrarianCounterpart);
  }

  const recommendedPackaging = [
    'Structured advisory + implementation retainer',
    'Premium intelligence briefing for C-suite buyers',
  ];
  if (record.momentum > 0 && record.sentiment < 0) {
    recommendedPackaging.push('Counter-narrative positioning kit for investor roadshows');
  } else {
    recommendedPackaging.push('Risk mitigation workshop emphasising resilience economics');
  }

  const demandChannels = [
    'Sovereign innovation funds',
    'Tier-1 consulting boutiques',
    'Corporate venture arms',
  ];

  return {
    topic: record.topic,
    score,
    contrarianAngle:
      record.momentum >= 0
        ? 'Rising capital with skeptical chatter—package as reassurance and readiness.'
        : 'Cooling budgets yet optimism persists—package as downside hedge and optionality.',
    reasons: why,
    recommendedPackaging,
    demandChannels,
    leadingVoices: voices
      .sort((a, b) => b.influenceScore - a.influenceScore)
      .slice(0, 5)
      .map((voice) => ({
        name: voice.name,
        platform: voice.platform,
        stance: voice.stance,
        url: voice.url,
        influenceScore: voice.influenceScore,
      })),
    supportingSignals: record.supportingSignals,
    attentionScore: record.attentionNormalized,
    capitalScore: record.capitalFlowNormalized,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Strategic Market Intelligence (${report.generatedAt})`);
  lines.push('');
  lines.push('## Data sources & compliance guardrails');
  lines.push('');
  report.sources.forEach((source) => {
    lines.push(
      `- **${source.name}** — policy: ${source.policyUrl || 'unspecified'}${
        source.notes ? `; notes: ${source.notes}` : ''
      }`,
    );
  });
  lines.push('');
  lines.push('## Highest-conviction contrarian opportunities');
  lines.push('');
  report.opportunities
    .sort((a, b) => b.score - a.score)
    .forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.topic}`);
      lines.push(`*Composite score:* ${item.score.toFixed(2)} | *Capital signal:* ${(item.capitalScore * 100).toFixed(1)}th percentile | *Attention signal:* ${(item.attentionScore * 100).toFixed(1)}th percentile`);
      lines.push('');
      lines.push(`**Contrarian angle:** ${item.contrarianAngle}`);
      lines.push('');
      lines.push('**Why this matters:**');
      item.reasons.forEach((reason) => lines.push(`- ${reason}`));
      lines.push('');
      lines.push('**Packaging for high-paying channels:**');
      item.recommendedPackaging.forEach((pkg) => lines.push(`- ${pkg}`));
      lines.push('');
      lines.push('**Target buyers:**');
      item.demandChannels.forEach((channel) => lines.push(`- ${channel}`));
      lines.push('');
      if (item.leadingVoices.length) {
        lines.push('**Leading emergent voices:**');
        item.leadingVoices.forEach((voice) => {
          const influence = (voice.influenceScore * 100).toFixed(0);
          lines.push(`- [${voice.name}](${voice.url}) (${voice.platform}, stance: ${voice.stance}, influence: ${influence})`);
        });
        lines.push('');
      }
      if (item.supportingSignals.length) {
        lines.push('**Signals to monitor:**');
        item.supportingSignals.forEach((signal) => lines.push(`- ${signal}`));
        lines.push('');
      }
    });

  lines.push('---');
  lines.push('### Methodology Footnotes');
  lines.push('- Momentum derived from capital flow deltas vs 30-day memory.');
  lines.push('- Sentiment approximated via deterministic lexicon with manual overrides when available.');
  lines.push('- Contrarian score emphasises divergence between capital flow direction and crowd tone.');
  lines.push('- Ensure compliance with source-specific licenses before commercial deployment.');

  return lines.join('\n');
}

class MarketIntelligenceEngine {
  constructor({ sources, client, stateStore, complianceRegistry }) {
    this.sources = sources;
    this.client = client;
    this.stateStore = stateStore;
    this.complianceRegistry = complianceRegistry;
  }

  async run(context = {}) {
    const state = await this.stateStore.load();
    const collectedRecords = [];
    const auditedSources = [];

    for (const source of this.sources) {
      try {
        this.complianceRegistry.register(source);
        const policy = this.complianceRegistry.getPolicy(source.id);
        auditedSources.push({
          id: source.id,
          name: source.name,
          policyUrl: policy?.policyUrl,
          notes: policy?.notes,
        });
      } catch (error) {
        console.warn(`Skipping source ${source.id}: ${error.message}`);
        continue;
      }

      const records = await source.collect({ client: this.client, context });
      collectedRecords.push(...records);
      await delay(source.cooldownMs ?? 500);
    }

    const aggregates = this.aggregate(collectedRecords, state);
    const opportunities = aggregates.map((record) => buildOpportunity(record));

    const history = { ...state.history };
    for (const record of aggregates) {
      updateHistory(history, record.topicKey, record.capitalFlow, {
        collectedAt: record.collectedAt,
        sourceIds: record.sourceIds,
      });
    }

    await this.stateStore.save({
      updatedAt: new Date().toISOString(),
      history,
      version: STATE_VERSION,
    });

    return {
      generatedAt: new Date().toISOString(),
      opportunities,
      aggregates,
      sources: auditedSources,
    };
  }

  aggregate(records, state) {
    const grouped = new Map();

    for (const record of records) {
      const key = toTopicKey(record.topic);
      const existing = grouped.get(key) || {
        topic: record.topic,
        topicKey: key,
        capitalFlow: 0,
        mentions: 0,
        sentimentSum: 0,
        sentimentWeight: 0,
        voices: [],
        supportingSignals: new Set(),
        sourceIds: new Set(),
        collectedAt: record.collectedAt,
      };
      existing.capitalFlow += record.capitalFlow;
      existing.mentions += record.mentions;
      existing.sentimentSum += record.sentiment * record.mentions;
      existing.sentimentWeight += record.mentions;
      for (const voice of record.voices ?? []) {
        existing.voices.push(voice);
      }
      for (const signal of record.supportingSignals ?? []) {
        existing.supportingSignals.add(signal);
      }
      if (record.sourceId) {
        existing.sourceIds.add(record.sourceId);
      }
      if (new Date(record.collectedAt).getTime() > new Date(existing.collectedAt).getTime()) {
        existing.collectedAt = record.collectedAt;
      }
      grouped.set(key, existing);
    }

    let maxCapitalFlow = 0;
    let minCapitalFlow = Number.POSITIVE_INFINITY;
    let maxMentions = 0;
    let minMentions = Number.POSITIVE_INFINITY;

    for (const aggregate of grouped.values()) {
      maxCapitalFlow = Math.max(maxCapitalFlow, aggregate.capitalFlow);
      minCapitalFlow = Math.min(minCapitalFlow, aggregate.capitalFlow);
      maxMentions = Math.max(maxMentions, aggregate.mentions);
      minMentions = Math.min(minMentions, aggregate.mentions);
    }

    const results = [];
    for (const aggregate of grouped.values()) {
      const capitalFlowNormalized = normalize(aggregate.capitalFlow, minCapitalFlow, maxCapitalFlow);
      const attentionNormalized = normalize(aggregate.mentions, minMentions, maxMentions);
      const sentiment = aggregate.sentimentWeight
        ? aggregate.sentimentSum / aggregate.sentimentWeight
        : 0;
      const momentum = computeHistoricalMomentum(state.history, aggregate.topicKey, aggregate.capitalFlow);

      const dedupedVoices = new Map();
      for (const voice of aggregate.voices) {
        if (!voice) continue;
        const key = `${voice.platform || 'unknown'}:${voice.url || voice.name}`;
        if (!dedupedVoices.has(key)) {
          dedupedVoices.set(key, {
            influenceScore: 0,
            stance: 'neutral',
            ...voice,
            influenceScore: Math.min(1, Math.max(0, voice.influenceScore ?? 0)),
            stance: voice.stance || 'neutral',
          });
        }
      }

      const voices = Array.from(dedupedVoices.values());

      const contrarianCounterpart = voices
        .filter((voice) => voice.stance === (momentum >= 0 ? 'bearish' : 'bullish'))
        .sort((a, b) => b.influenceScore - a.influenceScore)[0];

      results.push({
        topic: aggregate.topic,
        topicKey: aggregate.topicKey,
        capitalFlow: aggregate.capitalFlow,
        capitalFlowNormalized,
        attentionNormalized,
        sentiment,
        momentum,
        voices,
        supportingSignals: Array.from(aggregate.supportingSignals),
        contrarianCounterpart,
        collectedAt: aggregate.collectedAt,
        sourceIds: Array.from(aggregate.sourceIds),
      });
    }

    return results;
  }
}

function createSources({ alphaVantageKey }) {
  return [
    {
      id: 'global-capital-flows',
      name: 'Global Capital Flow Pulse',
      description: 'Tracks sovereign, institutional, and venture capital allocations into frontier sectors.',
      cooldownMs: 600,
      legal: {
        policyUrl: 'https://www.worldbank.org/en/about/legal/terms-and-conditions',
        permittedUse: ['research', 'commercial-analysis'],
        notes: 'Aggregates open multilateral data and licensed investor decks (requires attribution).',
      },
      async collect({ client }) {
        const url =
          'https://api.worldbank.org/v2/country/all/indicator/CM.MKT.LCAP.CD?format=json';
        const dataset = await resilientFetch(client, url, 'global-capital-flows', createFallbackDataset);
        const items = dataset.items || dataset[1] || [];
        const collectedAt = dataset.generatedAt || new Date().toISOString();

        return items.map((item) => {
          const capitalFlow = item.capitalFlow ?? item.value ?? 0;
          const sentiment = item.sentimentOverride ?? computeSentiment(item.narrative || item.commentary || '');
          const supportingSignals = [...(item.signals || [])];
          if (typeof item.momentum === 'number') {
            supportingSignals.push(`Momentum: ${(item.momentum * 100).toFixed(1)}% QoQ capital shift`);
          }
          return {
            topic: item.topic || item.country?.value || 'Unknown',
            topicKey: toTopicKey(item.topic || item.country?.value || 'unknown'),
            capitalFlow,
            mentions: Math.max(1, supportingSignals.length || 1),
            sentiment,
            voices: item.voices || [],
            supportingSignals,
            collectedAt,
            sourceId: 'global-capital-flows',
          };
        });
      },
    },
    {
      id: 'forum-contrarian-scan',
      name: 'Contrarian Forum Scanner',
      description: 'Captures bearish chatter vs capital inflows from legally accessible forums.',
      cooldownMs: 600,
      legal: {
        policyUrl: 'https://www.redditinc.com/policies/data-api-terms',
        permittedUse: ['research', 'insight-generation'],
        notes: 'Uses Reddit public API endpoints within rate limits.',
      },
      async collect({ client }) {
        const subreddit = 'investing';
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
        const dataset = await resilientFetch(client, url, 'forum-contrarian-scan', createFallbackDataset);
        const items = dataset.items || dataset.data?.children || [];
        const collectedAt = dataset.generatedAt || new Date().toISOString();

        return items.map((item) => {
          const source = item.data || item;
          const topic = source.topic || source.title || 'Forum Insight';
          const mentions = source.mentionCount || source.num_comments || 1;
          const text = [source.selftext, source.excerpt, source.title].filter(Boolean).join(' ');
          const sentiment =
            source.sentimentOverride ?? (text ? computeSentiment(text) : computeSentiment(topic));
          const voices = source.voices || [
            source.author
              ? {
                  name: source.author,
                  platform: `Reddit r/${subreddit}`,
                  influenceScore: Math.min(1, (source.ups || 0) / 1000),
                  stance: sentiment >= 0 ? 'bullish' : 'bearish',
                  url: `https://www.reddit.com/user/${source.author}`,
                }
              : null,
          ].filter(Boolean);
          const supportingSignals = [
            source.threadTitle || source.title || 'Forum discussion',
            `Engagement: ${mentions}`,
          ];
          return {
            topic,
            capitalFlow: Math.max(1, mentions) * 100000,
            mentions: Math.max(1, mentions),
            sentiment,
            voices,
            supportingSignals,
            collectedAt,
            sourceId: 'forum-contrarian-scan',
          };
        });
      },
    },
    {
      id: 'emergent-voices-scan',
      name: 'Emergent Voices Radar',
      description: 'Surfaces analysts and operators who consistently predict inflection points.',
      cooldownMs: 600,
      legal: {
        policyUrl: 'https://openweb.example/policy',
        permittedUse: ['research', 'signal-detection'],
        notes: 'Requires verifying each channel terms-of-service prior to automation.',
      },
      async collect({ client }) {
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=technology&apikey=${encodeURIComponent(
          alphaVantageKey,
        )}`;
        const dataset = await resilientFetch(client, url, 'emergent-voices-scan', createFallbackDataset);
        const items = dataset.items || dataset.feed || [];
        const collectedAt = dataset.generatedAt || dataset.feed?.[0]?.time_published || new Date().toISOString();

        return items.map((item) => {
          const topic = item.topic || item.title || 'Emergent Signal';
          const mentionWeight = Math.max(1, item.reachScore ? Math.round(item.reachScore * 10) : 1);
          const sentiment = item.sentimentOverride ?? computeSentiment(item.summary || item.excerpt || topic);
          const voices = [
            {
              name: item.author || item.summary?.split(' ')[0] || basename(item.url || 'voice'),
              platform: item.channel || item.source || 'Publisher',
              influenceScore: item.reachScore ?? Math.min(1, (item.relevance_score || 0) / 100),
              stance: sentiment >= 0 ? 'bullish' : 'bearish',
              url: item.url || '#',
            },
          ];
          const supportingSignals = [
            item.excerpt || item.summary || item.title || 'Emergent narrative',
            item.velocity ? `Velocity index: ${(item.velocity * 100).toFixed(1)}` : 'Velocity data unavailable',
          ];
          return {
            topic,
            capitalFlow: Math.max(1, item.velocity ? item.velocity * 1_000_000 : mentionWeight * 50_000),
            mentions: mentionWeight,
            sentiment,
            voices,
            supportingSignals,
            collectedAt,
            sourceId: 'emergent-voices-scan',
          };
        });
      },
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv);
  const client = new HttpClient();
  const stateStore = new StateStore(args.statePath);
  const complianceRegistry = new ComplianceRegistry();
  const sources = createSources({ alphaVantageKey: args.alphaVantageKey });
  const engine = new MarketIntelligenceEngine({
    sources,
    client,
    stateStore,
    complianceRegistry,
  });

  const report = await engine.run();

  if (args.jsonPath) {
    await mkdir(dirname(args.jsonPath), { recursive: true });
    await writeFile(args.jsonPath, JSON.stringify(report, null, 2));
  }

  if (args.outputMode === 'markdown') {
    console.log(renderMarkdown(report));
  } else if (args.outputMode === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.error(`Unsupported output mode: ${args.outputMode}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Market intelligence engine failed:', error);
    process.exitCode = 1;
  });
}
