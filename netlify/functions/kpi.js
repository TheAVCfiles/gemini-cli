/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const DEFAULT_PERIOD = '2025-Q4';
const ORG_SLUG = 'intuition-labs';
const JSON_CONTENT_TYPE = { 'Content-Type': 'application/json' };
const CACHE_HEADERS = {
  ...JSON_CONTENT_TYPE,
  'Cache-Control': 'public, max-age=60',
};

const FALLBACK_DATA = {
  '2025-Q4': {
    vision: 'Software as Sanctuary | Software as Studio',
    storefront: {
      left: {
        title: 'Betta Bots: Kinetic Bio-Analytics Live',
        kpis: {
          global_active_labs: 15000,
          datapoints_24h: 5300000000,
          ai_model_accuracy: 0.927,
          open_datasets_total: 1200,
        },
      },
      center: {
        funding: {
          headline:
            'Credits cover compute. Your contribution funds instruments, access, & human time.',
          cash_pool_usd: 1300000,
          cash_reserve_ratio: 0.7,
          allocation: {
            hardware_kits: 0.5,
            stipends_grants: 0.3,
            ops: 0.2,
          },
          public_ledger_qr: 'https://your-ledger.example/qr',
        },
        growth: {
          global_reach_map: 'geojson://labs_world_2045',
          credentialed_learners: 150000,
          student_grants_awarded: 2500,
          partnerships: ['ISTE', 'NEA', 'Google', 'Microsoft', 'AWS', 'NYCB', 'ABT'],
        },
      },
      right: {
        title: 'Home Body: The Global Dance Platform',
        kpis: {
          active_dancers: 75000,
          gala_performances_funded: 120,
          access_grants_provided: 10000,
          motion_datasets_released: 800,
        },
        revenue: {
          cagr: 0.3,
          arr_range_usd: [11000000, 15000000],
          net_profit_margin_range: [0.2, 0.25],
          valuation_range_usd: [150000000, 200000000],
          secondary_streams: ['derived_insights_licensing', 'specialized_tools'],
        },
      },
    },
  },
  '2023-Q4': {
    vision: 'Software as Sanctuary | Software as Studio',
    storefront: {
      left: {
        title: 'Betta Bots: Kinetic Bio-Analytics Live',
        kpis: {
          global_active_labs: 6,
          datapoints_24h: 125000,
          ai_model_accuracy: 0.82,
          open_datasets_total: 12,
        },
      },
      center: {
        funding: {
          headline:
            'Credits cover compute. Your contribution funds instruments, access, & human time.',
          cash_pool_usd: 7850,
          cash_reserve_ratio: 0.55,
          allocation: {
            hardware_kits: 0.45,
            stipends_grants: 0.35,
            ops: 0.2,
          },
          public_ledger_qr: 'https://opencollective.com/intuition-labs',
        },
        growth: {
          global_reach_map: 'geojson://labs_world_seed',
          credentialed_learners: 37,
          student_grants_awarded: 4,
          partnerships: ['OutSchool', 'Local-ISD', 'Community-Studio'],
        },
      },
      right: {
        title: 'Home Body: The Global Dance Platform',
        kpis: {
          active_dancers: 58,
          gala_performances_funded: 1,
          access_grants_provided: 6,
          motion_datasets_released: 3,
        },
        revenue: {
          cagr: null,
          arr_range_usd: [12000, 18000],
          net_profit_margin_range: [null, null],
          valuation_range_usd: [null, null],
          secondary_streams: [],
        },
      },
    },
  },
};

function normalisePeriod(input) {
  if (typeof input !== 'string') return DEFAULT_PERIOD;
  const trimmed = input.trim().toUpperCase();
  return trimmed || DEFAULT_PERIOD;
}

async function fetchMetricsFromSupabase(period) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return null;
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await client
      .from('kpi_quarterly')
      .select('metrics')
      .eq('org_slug', ORG_SLUG)
      .eq('period', period)
      .maybeSingle();

    if (error) {
      console.error('Supabase KPI fetch error', error);
      return null;
    }
    return data?.metrics ?? null;
  } catch (error) {
    console.error('Supabase client unavailable', error);
    return null;
  }
}

export async function handler(event) {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: JSON_CONTENT_TYPE,
      body: JSON.stringify({
        error: 'Method Not Allowed',
      }),
    };
  }

  const period = normalisePeriod(event.queryStringParameters?.period);

  const supabaseMetrics = await fetchMetricsFromSupabase(period);
  const fallbackMetrics = FALLBACK_DATA[period] ?? null;

  if (!supabaseMetrics && !fallbackMetrics) {
    return {
      statusCode: 404,
      headers: JSON_CONTENT_TYPE,
      body: JSON.stringify({
        error: 'Metrics not found for requested period',
        availablePeriods: Object.keys(FALLBACK_DATA),
      }),
    };
  }

  const metrics = supabaseMetrics ?? fallbackMetrics;

  return {
    statusCode: 200,
    headers: CACHE_HEADERS,
    body: JSON.stringify(metrics),
  };
}
