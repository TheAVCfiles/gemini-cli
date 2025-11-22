import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

async function sendContractForSignature(licenseRecord) {
  console.log('Stub sendContractForSignature payload:', licenseRecord);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(req.body || '');
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature failure', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};
    const licenseRecord = {
      facultyId: meta.facultyId,
      licenseType: meta.licenseType,
      institution: meta.institution,
      auditHash: meta.auditHash,
      amount: session.amount_total,
      currency: session.currency,
      signed: false,
      createdAt: new Date().toISOString(),
      checkoutSessionId: session.id,
    };

    console.log('License record to save:', licenseRecord);
    await sendContractForSignature(licenseRecord);
  }

  return res.json({ received: true });
}
