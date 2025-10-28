/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-env node */

import { createClient } from '@supabase/supabase-js';

const env = globalThis.process?.env ?? {};
const logger = globalThis.console ?? {
  error() {},
  warn() {},
  info() {},
};

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })
    : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase environment variables are missing.' });
  }

  try {
    const { data, error } = await supabase
      .from('funding_tx')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (error) {
      throw error;
    }

    const metrics = buildMetrics(data ?? []);
    return res.status(200).json(metrics);
  } catch (error) {
    logger.error('codex-api: failed to load metrics', error);
    return res.status(500).json({ error: 'Failed to load metrics from Supabase.', details: error.message });
  }
}

function buildMetrics(rows) {
  const normalized = rows
    .map((row) => normalizeFundingRow(row))
    .filter((row) => row.amount !== null && Number.isFinite(row.amount));

  const currency = pickCurrency(normalized) || 'USD';
  const totalRevenue = sum(normalized.map((row) => row.amount));
  const totalTransactions = normalized.length;
  const now = new Date();

  const trailing7Days = filterByDays(normalized, now, 7);
  const trailing30Days = filterByDays(normalized, now, 30);

  const trailing7Revenue = sum(trailing7Days.map((row) => row.amount));
  const trailing30Revenue = sum(trailing30Days.map((row) => row.amount));

  const averageDealSize = totalTransactions ? totalRevenue / totalTransactions : 0;
  const monthlyRecurringRevenue = trailing30Revenue;
  const annualRunRate = monthlyRecurringRevenue * 12;

  const engines = Array.from(groupBy(normalized, (row) => row.engineTag || 'unclassified').entries())
    .map(([engineTag, records]) => {
      const engineRevenue = sum(records.map((row) => row.amount));
      return {
        engineTag,
        revenue: formatMoney(engineRevenue, currency),
        transactions: records.length,
        share: totalRevenue > 0 ? engineRevenue / totalRevenue : 0,
        lastActivity: toIsoString(
          records.reduce((latest, row) => {
            if (!latest) return row.occurredAt;
            return row.occurredAt && row.occurredAt > latest ? row.occurredAt : latest;
          }, null),
        ),
      };
    })
    .sort((a, b) => b.revenue.value - a.revenue.value);

  const latestTransaction = normalized
    .slice()
    .sort((a, b) => (b.occurredAt?.getTime?.() ?? 0) - (a.occurredAt?.getTime?.() ?? 0))[0];

  const statusBreakdown = Array.from(groupBy(normalized, (row) => row.status || 'recorded').entries()).map(
    ([status, records]) => ({
      status,
      transactions: records.length,
      revenue: formatMoney(sum(records.map((row) => row.amount)), currency),
    }),
  );

  return {
    updatedAt: new Date().toISOString(),
    totals: {
      revenue: formatMoney(totalRevenue, currency),
      transactions: totalTransactions,
      averageDealSize: formatMoney(averageDealSize, currency),
    },
    velocity: {
      trailing7Days: {
        revenue: formatMoney(trailing7Revenue, currency),
        transactions: trailing7Days.length,
      },
      trailing30Days: {
        revenue: formatMoney(trailing30Revenue, currency),
        transactions: trailing30Days.length,
      },
    },
    forecast: {
      monthlyRecurringRevenue: formatMoney(monthlyRecurringRevenue, currency),
      annualRunRate: formatMoney(annualRunRate, currency),
    },
    engines,
    latestTransaction: latestTransaction
      ? {
          amount: formatMoney(latestTransaction.amount, currency),
          engineTag: latestTransaction.engineTag,
          occurredAt: latestTransaction.occurredAt?.toISOString() ?? null,
          status: latestTransaction.status,
          description: latestTransaction.description,
        }
      : null,
    statusBreakdown,
    rawCount: rows.length,
    source: {
      provider: 'supabase',
      table: 'funding_tx',
    },
  };
}

function normalizeFundingRow(row) {
  const amount = deriveAmount(row);
  const currency = deriveCurrency(row);

  return {
    amount,
    currency,
    engineTag: row.engine_tag || row.engineTag || row.engine || null,
    status: row.status || row.payment_status || row.state || null,
    description: row.description || row.notes || null,
    occurredAt: deriveTimestamp(row),
  };
}

function deriveAmount(row) {
  const candidates = [
    row.amount_cents != null ? Number(row.amount_cents) / 100 : null,
    row.amount != null ? Number(row.amount) : null,
    row.total_amount != null ? Number(row.total_amount) : null,
    row.total != null ? Number(row.total) : null,
  ];

  for (const candidate of candidates) {
    if (candidate !== null && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return null;
}

function deriveCurrency(row) {
  const candidates = [row.amount_currency, row.currency, row.currency_code, row.ccy];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toUpperCase();
    }
  }
  return null;
}

function deriveTimestamp(row) {
  const candidates = [
    row.occurred_at,
    row.recorded_at,
    row.processed_at,
    row.created_at,
    row.inserted_at,
    row.updated_at,
    row.createdAt,
    row.updatedAt,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate instanceof Date) {
      if (!Number.isNaN(candidate.getTime())) {
        return candidate;
      }
    }
    if (typeof candidate === 'number') {
      const date = new Date(candidate * 1000);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    if (typeof candidate === 'string') {
      const date = new Date(candidate);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

function pickCurrency(rows) {
  for (const row of rows) {
    if (row.currency) {
      return row.currency;
    }
  }
  return null;
}

function filterByDays(rows, now, days) {
  const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return rows.filter((row) => {
    if (!row.occurredAt) return false;
    return row.occurredAt >= threshold;
  });
}

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

function formatMoney(amount, currency) {
  const value = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = currency || 'USD';
  return {
    value,
    currency: safeCurrency,
    formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value),
  };
}

function toIsoString(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return null;
}
