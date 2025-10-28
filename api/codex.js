const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const creditsGranted = (process.env.GOOGLE_CLOUD_CREDITS_GRANTED || '').toLowerCase() === 'true';

function respond(res, status, payload) {
  res.status(status).json(payload);
}

function parseAmountCents(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : Math.round(parsed);
  }
  return 0;
}

function formatCurrency(currency, cents) {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function aggregateFunding(rows) {
  const totals = new Map();
  const trailing30Totals = new Map();
  const engineCounts = new Map();
  let lastOccurred = null;
  const now = Date.now();
  const trailingWindowMs = 1000 * 60 * 60 * 24 * 30;

  for (const row of rows) {
    const currency = (row.currency || 'USD').toUpperCase();
    const amountCents = parseAmountCents(row.amount_cents ?? row.amount ?? row.total);
    const occurredAt = row.occurred_at || row.created_at || row.inserted_at || row.created;
    const occurredTime = occurredAt ? Date.parse(occurredAt) : Number.isFinite(row.created) ? row.created * 1000 : NaN;

    totals.set(currency, (totals.get(currency) ?? 0) + amountCents);

    if (!Number.isNaN(occurredTime)) {
      if (!lastOccurred || occurredTime > lastOccurred) {
        lastOccurred = occurredTime;
      }
      if (now - occurredTime <= trailingWindowMs) {
        trailing30Totals.set(currency, (trailing30Totals.get(currency) ?? 0) + amountCents);
      }
    }

    const engineTag = row.engine_tag || 'unlabeled';
    engineCounts.set(engineTag, (engineCounts.get(engineTag) ?? 0) + 1);
  }

  const currencySummaries = Array.from(totals.entries()).map(([currency, cents]) => {
    const trailingCents = trailing30Totals.get(currency) ?? 0;
    return {
      currency,
      amount_cents: cents,
      amount_formatted: formatCurrency(currency, cents),
      trailing_30d_cents: trailingCents,
      trailing_30d_formatted: formatCurrency(currency, trailingCents),
    };
  });

  currencySummaries.sort((a, b) => b.amount_cents - a.amount_cents);

  const primaryCurrency = currencySummaries[0]?.currency ?? 'USD';
  const liveRevenueDisplay = currencySummaries.length
    ? `${currencySummaries[0].amount_formatted}`
    : formatCurrency(primaryCurrency, 0);

  const topEngineTags = Array.from(engineCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    generated_at: new Date().toISOString(),
    currency_summaries: currencySummaries,
    transaction_count: rows.length,
    trailing_window_days: 30,
    live_revenue_display: liveRevenueDisplay,
    last_transaction_at: lastOccurred ? new Date(lastOccurred).toISOString() : null,
    engine_tag_summary: topEngineTags,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return respond(res, 405, { error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return respond(res, 500, { error: 'Supabase environment variables are not configured' });
  }

  const selectColumns = ['amount_cents', 'currency', 'engine_tag', 'occurred_at', 'created_at'];
  const query = new URL('/rest/v1/funding_tx', supabaseUrl);
  query.searchParams.set('select', selectColumns.join(','));
  query.searchParams.set('order', 'occurred_at.desc.nullslast');

  let rows;

  try {
    const response = await fetch(query, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch funding transactions: ${response.status} ${body}`);
    }

    rows = await response.json();
  } catch (error) {
    console.error('Failed to fetch codex metrics', error);
    return respond(res, 502, { error: 'Unable to load funding telemetry' });
  }

  const fundingMetrics = aggregateFunding(rows);

  return respond(res, 200, {
    ...fundingMetrics,
    cloud: {
      credits_granted: creditsGranted,
      message: creditsGranted ? 'Powered by Google Cloud' : null,
    },
  });
}
