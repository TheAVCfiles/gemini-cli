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

// We need raw body for HMAC signature verification.
// Custom middleware to capture rawBody
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    try {
      req.body = data ? JSON.parse(data) : {};
    } catch (e) {
      req.body = {};
    }
    next();
  });
});

function validateKoFiSignature(req) {
  // Ko-fi signature header name may vary. Check your Ko-fi docs.
  const secret = process.env.KOFI_WEBHOOK_SECRET;
  if (!secret) return true; // dev mode if not set
  const sigHeader = req.get('X-Kofi-Signature') || req.get('X-Signature') || '';
  if (!sigHeader) return false;
  // digest candidate: sha256=hexdigest or hexdigest
  const sig = sigHeader.replace(/^sha256=/, '');
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(sig, 'hex'),
    );
  } catch (e) {
    return false;
  }
}

function mapProductToSku(payload) {
  // Adjust based on your Ko-fi product fields
  // Example expects payload.product_id OR payload.item.sku OR message containing SKU
  const skuCandidates = [
    payload.product_id,
    payload.sku,
    payload.item && payload.item.sku,
    payload.message && payload.message.match(/ROQUE-PIN-001/) ? 'ROQUE-PIN-001' : null,
  ].filter(Boolean);
  return skuCandidates[0] || null;
}

// Normalize the shipping address from Ko-fi (if present)
function normalizeAddress(payload) {
  // Ko-fi may not provide address in webhook; your checkout must collect.
  // Try different fields, return null if absent.
  const addr = payload.shipping_address || payload.address || payload.shipping || null;
  return addr;
}

app.post('/api/kofi/webhook', async (req, res) => {
  try {
    if (!validateKoFiSignature(req)) {
      console.warn('Invalid Ko-fi signature');
      return res.status(401).send('invalid signature');
    }

    const body = req.body || {};
    // Example Ko-fi fields: amount, currency, supporter_name, supporter_email, id
    const productSku = mapProductToSku(body);
    const amount = parseFloat(body.amount || body.total || 0);
    const amount_cents = Math.round(amount * 100);
    const supporter_name =
      body.supporter_name || body.name || (body.supporter && body.supporter.name) || null;
    const supporter_email = body.supporter_email || body.email || null;
    const order_id = body.id || `kofi_${Date.now()}`;
    const shipping = normalizeAddress(body);
    const notes = body.message || null;

    // If productSku is null, attempt to infer by amount / message
    // For safety: only accept our known SKU
    const KNOWN_SKUS = ['ROQUE-PIN-001'];
    let sku = productSku;
    if (!sku && amount_cents === 15000) sku = 'ROQUE-PIN-001';
    if (!sku || !KNOWN_SKUS.includes(sku)) {
      console.warn('Unknown SKU in webhook payload', sku, 'amount', amount_cents);
      // still create a generic job for manual review
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
        raw_payload: body,
      },
    };

    const messageId = await createJob(job);
    console.log('Enqueued job', messageId, 'order', order_id);
    return res.status(200).json({ ok: true, jobId: messageId });
  } catch (err) {
    console.error('Webhook error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Webhook server listening on ${PORT}`));
