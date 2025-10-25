/**
 * Worker service:
 * - If invoked as a Pub/Sub push, pull job and process create_ritual_order jobs
 * - Generates artifact via LLM (RAG), creates PDF + MP3, signs and anchors receipt
 * - Writes to BigQuery fulfillment table and reason_receipts
 * - Sends buyer email via SendGrid
 * - Exposes API endpoints for activation and receipt retrieval (for frontend)
 */

import express from 'express';
import bodyParser from 'body-parser';
import { craftLLMContentOpenAI } from '../lib/llm_openai.js';
import { generatePDF, synthesizeSpeech, uploadToGCS } from '../lib/pdf_tts.js';
import { signObject } from '../lib/sign.js';
import { uploadToIPFS, anchorToArweave } from '../lib/ipfs_arweave.js';
import { writeBigQueryRecord } from '../lib/bigquery.js';
import sgMail from '@sendgrid/mail';
import { simpleFaithGate } from '../lib/verifier.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@yourdomain.com';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// helper: create unique dance id / edition number
function makeDanceId(){
  return `dv_${Date.now()}_${Math.floor(Math.random()*1000)}`;
}

// process job
async function processCreateOrder(job){
  const p = job.payload;
  console.log('Processing order', p.order_id, 'sku', p.product_sku);

  // product-specific config
  const editionNumber = await allocateEditionNumber(p.product_sku); // implement or simple get
  const danceVector = {
    dance_id: makeDanceId(),
    product_sku: p.product_sku,
    edition_number: editionNumber,
    user_hash: p.supporter_email ? `sha256:${Buffer.from(p.supporter_email).toString('hex')}` : 'anon',
    gesture: 'pin_activation',
    cadence: [0, 0.5, 1],
    intensity: [0.3, 0.7, 0.9],
    micro_feel: ['baroque','rogue'],
    market_snapshot: p.market_snapshot || { symbol:'ETH', vol:0.12 },
    user_context: { archetype: 'BaroqueBitch' }
  };

  // LLM generation (structured)
  const llmResult = await craftLLMContentOpenAI(danceVector);
  // create artifact PDF + audio
  const pdfBuffer = await generatePDF(llmResult.title, llmResult.htmlBody);
  const audioBuffer = await synthesizeSpeech(llmResult.loreText || llmResult.shortOracle);

  // upload artifacts to GCS
  const pdfPath = `${danceVector.dance_id}.pdf`;
  const mp3Path = `${danceVector.dance_id}.mp3`;
  const pdfUrl = await uploadToGCS(pdfPath, pdfBuffer, 'application/pdf');
  const mp3Url = await uploadToGCS(mp3Path, audioBuffer, 'audio/mpeg');
  danceVector.delivery = { pdfUrl, mp3Url };

  // Reason receipt
  const reasonReceipt = {
    receipt_id: `rr_${Date.now()}`,
    ts: new Date().toISOString(),
    order_id: p.order_id,
    dance_vector: danceVector,
    llm_result: { reasoning_trace: llmResult.reasoning_trace || [], confidence: llmResult.confidence || 0.9 },
    economy: { paid_amount_cents: p.amount_cents, paid_via: p.provider },
    product_sku: p.product_sku
  };

  // run Faith Gate
  const faith = simpleFaithGate(danceVector.market_snapshot);
  reasonReceipt.verifier = { faith_gate: faith };

  // sign and upload
  const sig = signObject(reasonReceipt);
  reasonReceipt.signature = sig;

  // IPFS upload
  const ipfsCid = await uploadToIPFS(reasonReceipt);
  const anchor = await anchorToArweave(ipfsCid);

  reasonReceipt.artifact_ipfs = ipfsCid;
  reasonReceipt.anchor = anchor;

  // Write receipts & fulfillment to BigQuery
  await writeBigQueryRecord('decrypt_reason.reason_receipts', reasonReceipt);

  const orderRow = {
    order_id: p.order_id,
    receipt_id: reasonReceipt.receipt_id,
    product_sku: p.product_sku,
    edition_number: editionNumber,
    buyer_name: p.supporter_name,
    buyer_email: p.supporter_email,
    shipping: p.shipping ? JSON.stringify(p.shipping) : null,
    amount_cents: p.amount_cents,
    ts: new Date().toISOString(),
    artifact_ipfs: ipfsCid,
    anchor_tx: anchor.txId || null,
    fulfillment_status: 'queued'
  };
  await writeBigQueryRecord('decrypt_fulfillment.orders', orderRow);

  // Send email to buyer
  try {
    await sendBuyerEmail(p.supporter_email, p.supporter_name, reasonReceipt, 'TBD');
  } catch (e) {
    console.error('Email error', e);
  }
  console.log('Completed order', p.order_id);
  return reasonReceipt;
}

// This is a simple atomic counter stored in BigQuery or other store.
// For simplicity: read count of previous edition rows and +1.
// Not perfect for concurrency; in production use transaction / reservations.
async function allocateEditionNumber(sku){
  // naive: count existing rows for SKU and +1
  // Implement a BigQuery query (count) and return count+1
  try {
    const { BigQuery } = await import('@google-cloud/bigquery');
    const bq = new BigQuery();
    const query = `SELECT COUNT(*) AS cnt FROM \`decrypt_fulfillment.orders\` WHERE product_sku = @sku`;
    const [rows] = await bq.query({
      query,
      params: { sku },
      location: 'US'
    });
    const cntValue = rows?.[0]?.cnt ?? 0;
    const cnt = typeof cntValue === 'string' ? Number(cntValue) : Number(cntValue || 0);
    return Number.isNaN(cnt) ? 1 : cnt + 1;
  } catch (e) {
    console.error('allocateEditionNumber fallback', e);
    return 1;
  }
}

async function sendBuyerEmail(toEmail, toName, receipt, trackingPlaceholder){
  if(!toEmail) {
    console.warn('No buyer email; skipping send');
    return;
  }
  const activationUrl = `${process.env.FRONTEND_BASE || 'https://your-frontend.example'}/activate/${receipt.receipt_id}`;
  const html = `
    <p>Dear ${toName || 'friend'},</p>
    <p>Thank you for your ROQUE purchase. Your edition: <strong>${receipt.dance_vector.product_sku} #${receipt.dance_vector.edition_number}</strong>.</p>
    <p><a href="${activationUrl}">Activate your sigil</a> — press the card's NFC or open this link to play the ritual and claim your presence proof.</p>
    <p>Your provenance certificate: <a href="https://ipfs.io/ipfs/${receipt.artifact_ipfs.replace('ipfs://','')}">View Certificate</a></p>
    <p>Shipping & tracking: ${trackingPlaceholder || 'TBD'}</p>
    <p>We will prepare your leather card and pin and ship within 7–14 business days.</p>
    <p>— ROQUE</p>
  `;
  await sgMail.send({
    to: toEmail,
    from: FROM_EMAIL,
    subject: `ROQUE — Your Sigil Pin (Order ${receipt.receipt_id})`,
    html
  });
}

// Pub/Sub job endpoint (push subscription)
app.post('/worker/process', async (req, res) => {
  try {
    // Support both Pub/Sub push (wrapped) and direct POST job
    let job = req.body;
    // Pub/Sub push delivery wraps message in message.data base64
    if(job && job.message && job.message.data) {
      const dataStr = Buffer.from(job.message.data, 'base64').toString('utf8');
      job = JSON.parse(dataStr);
    }
    if(job.type === 'create_ritual_order') {
      const receipt = await processCreateOrder(job);
      return res.json({ ok: true, receipt });
    } else {
      console.warn('Unknown job type', job.type);
      return res.status(400).json({ ok: false, err: 'unknown job type' });
    }
  } catch (e) {
    console.error('Worker process error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// API endpoints for receipt retrieval and activation
// GET /api/receipt/:id - fetch receipt from BigQuery (or GCS via IPFS)
app.get('/api/receipt/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Query BigQuery for receipt
    const sql = `SELECT receipt_id, ts, dance_vector, llm_result, artifact_ipfs, anchor FROM \`decrypt_reason.reason_receipts\` WHERE receipt_id="${id}" LIMIT 1`;
    const BigQueryModule = await import('@google-cloud/bigquery');
    const bq = new BigQueryModule.BigQuery();
    const [rows] = await bq.query({ query: sql, location: 'US' });
    if(!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'not found' });
    const row = rows[0];
    return res.json({ ok: true, receipt: row });
  } catch (e) {
    console.error('Receipt fetch error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/activate/:id - register presence proof
app.post('/api/activate/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const now = new Date().toISOString();
    const activationRow = {
      receipt_id: id,
      activated_ts: now,
      ip: req.ip,
      user_agent: req.get('User-Agent') || null
    };
    await writeBigQueryRecord('decrypt_fulfillment.activations', activationRow);
    return res.json({ ok: true, activated_ts: now });
  } catch (e) {
    console.error('Activation error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, ()=> console.log(`Worker / API listening on ${PORT}`));
