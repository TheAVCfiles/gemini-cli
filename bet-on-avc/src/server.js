import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3000;
const LEDGER_LIMIT = 100;

app.use(cors({ origin: true }));

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return res.status(500).send('Webhook configuration error');
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, signature, secret);

      if (
        event.type === 'checkout.session.completed' ||
        event.type === 'payment_intent.succeeded'
      ) {
        const payload = event.data.object;
        const amount = payload.amount_total ?? payload.amount ?? 0;
        const email =
          payload.customer_details?.email || payload.receipt_email || 'unknown';
        const tierName =
          payload.metadata?.tierName ||
          payload.display_items?.[0]?.custom?.name ||
          'Bet';

        appendLedger({
          action: 'stripe_event',
          amount,
          meta: { event: event.type, email, tierName },
        });
        // Hook for social integrations lives in src/socials.js
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
);

app.use('/api', express.json());

const LEDGER_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'ledger.json',
);

function readLedgerFile() {
  try {
    const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read ledger', error);
    }
    return [];
  }
}

function writeLedgerFile(entries) {
  try {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries, null, 2));
  } catch (error) {
    console.error('Failed to write ledger', error);
  }
}

function sanitizeMeta(meta) {
  if (meta == null) return {};
  if (typeof meta === 'string') return { note: meta };
  if (typeof meta === 'object' && !Array.isArray(meta)) return meta;
  return { note: 'invalid_meta' };
}

let ledgerStore = readLedgerFile().slice(0, LEDGER_LIMIT);

if (ledgerStore.length > LEDGER_LIMIT) {
  ledgerStore = ledgerStore.slice(0, LEDGER_LIMIT);
  writeLedgerFile(ledgerStore);
}

function appendLedger(entry) {
  const sanitized = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    ...entry,
    meta: sanitizeMeta(entry.meta),
  };

  ledgerStore = [sanitized, ...ledgerStore].slice(0, LEDGER_LIMIT);
  writeLedgerFile(ledgerStore);
  return sanitized;
}

app.post('/api/stripe/create_link', async (req, res) => {
  try {
    const {
      tierName = 'Seed $22',
      unitAmount = 2200,
      description = 'Bet on AVC',
    } = req.body || {};

    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      return res.status(400).json({ ok: false, error: 'invalid_amount' });
    }

    const pid = `avc_${crypto
      .createHash('sha1')
      .update(`${tierName}:${unitAmount}`)
      .digest('hex')
      .slice(0, 10)}`;

    let product;
    const products = await stripe.products.list({ limit: 100, active: true });
    product = products.data.find((p) => p.metadata?.avc_pid === pid);

    if (!product) {
      product = await stripe.products.create({
        name: `Bet: ${tierName}`,
        description,
        metadata: { avc_pid: pid, avc_tag: '$Allison-Van-Cura' },
      });
    }

    const price = await stripe.prices.create({
      unit_amount: unitAmount,
      currency: 'usd',
      product: product.id,
    });

    const site = process.env.SITE_URL || 'http://localhost:3000';
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: { url: `${site}/?bet=success` },
      },
      metadata: { avc_pid: pid, tierName },
      payment_intent_data: {
        metadata: { tierName, avc: '$Allison-Van-Cura' },
      },
    });

    res.json({ ok: true, url: link.url });
  } catch (error) {
    console.error('create_link_failed', error);
    res.status(500).json({ ok: false, error: 'create_link_failed' });
  }
});

app.get('/api/stripe/list_products', async (req, res) => {
  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    res.json({ ok: true, products: products.data });
  } catch (error) {
    console.error('list_products_failed', error);
    res.status(500).json({ ok: false, error: 'list_failed' });
  }
});

app.get('/api/ledger', (req, res) => {
  try {
    res.json(ledgerStore);
  } catch (error) {
    console.error('ledger_failed', error);
    res.status(500).json({ success: false, error: 'ledger_read_failed' });
  }
});

app.post('/api/ledger', (req, res) => {
  const { action, amount, meta } = req.body || {};

  if (typeof action !== 'string' || !action.trim()) {
    return res.status(400).json({ success: false, error: 'invalid_action' });
  }

  if (
    amount !== undefined &&
    (typeof amount !== 'number' || Number.isNaN(amount))
  ) {
    return res.status(400).json({ success: false, error: 'invalid_amount' });
  }

  const entry = appendLedger({
    action: action.trim(),
    amount: Number(amount) || 0,
    meta,
  });
  res.json({ success: true, entry });
});

app.listen(PORT, () => {
  console.log(`AVC money bell online :${PORT}`);
});
