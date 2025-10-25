/**
 * Webhook receiver for Ko-fi.
 * Validates signature (HMAC-SHA256 if KOFI_WEBHOOK_SECRET set),
 * maps products to SKUs, creates Pub/Sub job.
 *
 * Expects jobQueue.createJob to publish to PUBSUB_TOPIC.
 */

import express from 'express';
import crypto from 'crypto';
import { createJob } from '../lib/jobQueue.js';

const app = express();
app.disable('x-powered-by');

// Capture the raw request body so we can validate the HMAC signature.
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');

  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    if (!data) {
      req.body = {};
      return next();
    }

    try {
      req.body = JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse Ko-fi webhook payload as JSON');
      req.body = {};
    }
    next();
  });

  req.on('error', next);
});

function validateKoFiSignature(req) {
  const secret = process.env.KOFI_WEBHOOK_SECRET;
  if (!secret) {
    return true; // dev mode if not set
  }

  const sigHeader = req.get('X-Kofi-Signature') || req.get('X-Signature') || '';
  if (!sigHeader) {
    return false;
  }

  const signature = sigHeader.replace(/^sha256=/, '');
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(signature, 'hex'));
  } catch (error) {
    return false;
  }
}

function mapProductToSku(payload) {
  const skuCandidates = [
    payload.product_id,
    payload.sku,
    payload.item && payload.item.sku,
    payload.message && payload.message.match(/ROQUE-PIN-001/) ? 'ROQUE-PIN-001' : null
  ].filter(Boolean);

  return skuCandidates[0] || null;
}

function normalizeAddress(payload) {
  return payload.shipping_address || payload.address || payload.shipping || null;
}

app.post('/api/kofi/webhook', async (req, res) => {
  try {
    if (!validateKoFiSignature(req)) {
      console.warn('Invalid Ko-fi signature');
      return res.status(401).send('invalid signature');
    }

    const body = req.body || {};
    const productSku = mapProductToSku(body);
    const amount = parseFloat(body.amount || body.total || 0);
    const amount_cents = Math.round(amount * 100);
    const supporter_name =
      body.supporter_name || body.name || (body.supporter && body.supporter.name) || null;
    const supporter_email = body.supporter_email || body.email || null;
    const order_id = body.id || `kofi_${Date.now()}`;
    const shipping = normalizeAddress(body);
    const notes = body.message || null;

    const KNOWN_SKUS = ['ROQUE-PIN-001'];
    let sku = productSku;
    if (!sku && amount_cents === 15000) {
      sku = 'ROQUE-PIN-001';
    }

    if (!sku || !KNOWN_SKUS.includes(sku)) {
      console.warn('Unknown SKU in webhook payload', sku, 'amount', amount_cents);
    }

    const job = {
      type: 'create_ritual_order',
      payload: {
        order_id,
        product_sku: sku,
        amount_cents,
        currency: body.currency || 'USD',
        supporter_name,
        supporter_email,
        shipping,
        notes,
        provider: 'kofi',
        raw_payload: body
      }
    };

    const messageId = await createJob(job);
    console.log('Enqueued job', messageId, 'order', order_id);
    return res.status(200).json({ ok: true, jobId: messageId });
  } catch (error) {
    console.error('Webhook error', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 8080;

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  app.listen(PORT, () => console.log(`Webhook server listening on ${PORT}`));
}

export default app;
