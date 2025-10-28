/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-env node */

import Stripe from 'stripe';
import { buffer } from 'node:stream/consumers';
import { createClient } from '@supabase/supabase-js';

const env = globalThis.process?.env ?? {};
const logger = globalThis.console ?? {
  error() {},
  warn() {},
  info() {},
};

const stripeSecret = env.STRIPE_SECRET_KEY;
const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })
    : null;

export const config = {
  api: {
    bodyParser: false,
  },
};

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.paid',
  'payment_intent.succeeded',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripeSecret || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe is not configured for this deployment.' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase environment variables are missing.' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature header.' });
  }

  let event;
  let rawBody;
  try {
    rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    logger.error('stripe-webhook: signature verification failed', error);
    return res.status(400).json({ error: 'Invalid Stripe webhook signature.' });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    const record = await buildFundingRecord(event);
    if (!record) {
      return res.status(200).json({ received: true, ignored: true });
    }

    const { error } = await supabase.from('funding_tx').insert(record);
    if (error) {
      logger.error('stripe-webhook: failed to persist record', error);
      return res.status(500).json({ error: 'Failed to record Stripe event.', details: error.message });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('stripe-webhook: unhandled exception', error);
    return res.status(500).json({ error: 'Unhandled webhook error.', details: error.message });
  }
}

async function buildFundingRecord(event) {
  const { type, data } = event;
  switch (type) {
    case 'checkout.session.completed': {
      const session = await ensureCheckoutSessionExpanded(data.object);
      return normalizeRecord({
        event,
        amountCents: session.amount_total ?? session.amount_subtotal ?? null,
        currency: session.currency,
        engineTag: pickEngineTag([
          session.metadata,
          session.custom_fields?.reduce((acc, field) => {
            if (field.key) acc[field.key] = field.text?.value ?? field.dropdown?.value ?? null;
            return acc;
          }, {}),
          session,
          session.line_items?.data?.[0]?.price?.metadata,
          session.line_items?.data?.[0]?.price?.product?.metadata,
        ]),
        status: session.payment_status,
        customerId: session.customer,
        invoiceId: session.invoice,
        paymentIntentId: session.payment_intent,
        description:
          session.metadata?.deal_name ||
          session.metadata?.project ||
          session.customer_details?.email ||
          session.client_reference_id ||
          session.mode,
        occurredAt: pickTimestamp([
          session.completed_at,
          session.created,
          event.created,
        ]),
        metadata: session.metadata,
      });
    }
    case 'invoice.paid': {
      const invoice = await ensureInvoiceExpanded(data.object);
      return normalizeRecord({
        event,
        amountCents: invoice.amount_paid ?? invoice.total ?? null,
        currency: invoice.currency,
        engineTag: pickEngineTag([
          invoice.metadata,
          invoice.lines?.data?.[0]?.price?.metadata,
          invoice.lines?.data?.[0]?.price?.product?.metadata,
        ]),
        status: invoice.status,
        customerId: invoice.customer,
        invoiceId: invoice.id,
        paymentIntentId: invoice.payment_intent,
        description: invoice.description || invoice.subscription || invoice.number,
        occurredAt: pickTimestamp([
          invoice.status_transitions?.paid_at,
          invoice.created,
          event.created,
        ]),
        metadata: invoice.metadata,
      });
    }
    case 'payment_intent.succeeded': {
      const intent = data.object;
      if (intent.invoice) {
        // The matching invoice.paid event will cover this transaction.
        return null;
      }
      return normalizeRecord({
        event,
        amountCents: intent.amount_received ?? intent.amount ?? null,
        currency: intent.currency,
        engineTag: pickEngineTag([intent.metadata]),
        status: intent.status,
        customerId: intent.customer,
        invoiceId: intent.invoice,
        paymentIntentId: intent.id,
        description: intent.description || intent.metadata?.purpose,
        occurredAt: pickTimestamp([intent.created, event.created]),
        metadata: intent.metadata,
      });
    }
    default:
      return null;
  }
}

async function ensureCheckoutSessionExpanded(session) {
  if (!stripe) return session;
  if (session.line_items?.data?.length) {
    return session;
  }
  try {
    return await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price.product'],
    });
  } catch (error) {
    logger.warn('stripe-webhook: failed to expand checkout session', error);
    return session;
  }
}

async function ensureInvoiceExpanded(invoice) {
  if (!stripe) return invoice;
  if (invoice.lines?.data?.length) {
    return invoice;
  }
  try {
    return await stripe.invoices.retrieve(invoice.id, {
      expand: ['lines.data.price.product'],
    });
  } catch (error) {
    logger.warn('stripe-webhook: failed to expand invoice', error);
    return invoice;
  }
}

function normalizeRecord({
  event,
  amountCents,
  currency,
  engineTag,
  status,
  customerId,
  invoiceId,
  paymentIntentId,
  description,
  occurredAt,
  metadata,
}) {
  const normalizedAmount = Number.isFinite(amountCents) ? Math.round(amountCents) : null;
  const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : null;

  if (!normalizedAmount || !normalizedCurrency) {
    throw new Error('Unable to determine amount or currency for Stripe event.');
  }

  return {
    event_id: event.id,
    event_type: event.type,
    provider: 'stripe',
    engine_tag: engineTag || 'unclassified',
    amount_cents: normalizedAmount,
    amount_currency: normalizedCurrency,
    status: status || event.type,
    customer_id: customerId || null,
    invoice_id: invoiceId || null,
    payment_intent_id: paymentIntentId || null,
    description: description || null,
    occurred_at: toIsoTimestamp(occurredAt ?? event.created),
    metadata: metadata ? JSON.stringify(metadata) : null,
    raw_event_created_at: toIsoTimestamp(event.created),
    processed_at: new Date().toISOString(),
  };
}

function pickEngineTag(sources) {
  for (const source of sources) {
    if (!source) continue;
    if (typeof source === 'string' && source.trim()) {
      return source.trim();
    }
    if (typeof source === 'object') {
      for (const key of Object.keys(source)) {
        const normalizedKey = key.toLowerCase();
        if (
          normalizedKey.includes('engine') ||
          normalizedKey.includes('tier') ||
          normalizedKey.includes('product') ||
          normalizedKey.includes('plan')
        ) {
          const value = source[key];
          if (typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
      if (source.engine_tag) {
        return String(source.engine_tag).trim();
      }
    }
  }
  return null;
}

function pickTimestamp(values) {
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'number') {
      // Stripe timestamps are seconds.
      return new Date(value * 1000);
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (value instanceof Date) {
      if (!Number.isNaN(value.getTime())) {
        return value;
      }
    }
  }
  return null;
}

function toIsoTimestamp(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}
