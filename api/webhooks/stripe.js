import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-11-20' })
  : null;

function respond(res, status, payload) {
  res.status(status).json(payload);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function normalizeAmountCents(input) {
  if (input === null || input === undefined || Number.isNaN(input)) {
    return null;
  }
  if (typeof input === 'string') {
    const parsed = Number.parseFloat(input);
    return Number.isNaN(parsed) ? null : Math.round(parsed);
  }
  if (typeof input === 'number') {
    return Math.round(input);
  }
  return null;
}

function extractFundingRecord(event) {
  const { type, data } = event;
  const payload = data?.object ?? {};
  const baseRecord = {
    stripe_event_id: event.id,
    stripe_event_type: type,
    engine_tag: payload.metadata?.engine_tag ?? `stripe:${type}`,
    currency: (payload.currency || payload.default_currency || 'usd').toUpperCase(),
    occurred_at: payload.created ? new Date(payload.created * 1000).toISOString() : new Date().toISOString(),
    status: payload.payment_status || payload.status || event.type,
  };

  if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
    baseRecord.amount_cents = normalizeAmountCents(payload.amount_total);
    baseRecord.stripe_checkout_session_id = payload.id;
    baseRecord.stripe_customer_id = payload.customer ?? null;
    baseRecord.stripe_payment_intent_id = payload.payment_intent ?? null;
    baseRecord.reference = payload.client_reference_id ?? payload.id;
  } else if (type === 'invoice.paid') {
    baseRecord.amount_cents = normalizeAmountCents(payload.total);
    baseRecord.stripe_invoice_id = payload.id;
    baseRecord.stripe_customer_id = payload.customer ?? null;
    baseRecord.reference = payload.subscription ?? payload.id;
  } else if (type === 'payment_intent.succeeded') {
    baseRecord.amount_cents = normalizeAmountCents(payload.amount_received ?? payload.amount);
    baseRecord.stripe_payment_intent_id = payload.id;
    baseRecord.stripe_customer_id = payload.customer ?? null;
    baseRecord.reference = payload.metadata?.order_id ?? payload.id;
  } else {
    baseRecord.amount_cents = normalizeAmountCents(payload.amount_total ?? payload.amount ?? payload.total);
    baseRecord.reference = payload.id ?? event.id;
  }

  return baseRecord;
}

async function insertFundingRecord(record) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  const endpoint = new URL('/rest/v1/funding_tx', supabaseUrl);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to persist funding transaction: ${response.status} ${body}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, { error: 'Method not allowed' });
  }

  if (!stripe) {
    return respond(res, 500, { error: 'Stripe secret key is not configured' });
  }

  if (!stripeWebhookSecret) {
    return respond(res, 500, { error: 'Stripe webhook secret is not configured' });
  }

  let event;

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return respond(res, 400, { error: 'Missing Stripe signature header' });
    }
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (error) {
    console.error('Stripe webhook verification failed', error);
    return respond(res, 400, { error: 'Invalid Stripe webhook payload' });
  }

  try {
    const record = extractFundingRecord(event);
    await insertFundingRecord(record);
  } catch (error) {
    console.error('Failed to process Stripe webhook', error);
    return respond(res, 500, { error: error.message });
  }

  return respond(res, 200, { received: true });
}
