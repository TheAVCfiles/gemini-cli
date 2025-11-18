import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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
      checkoutSessionId: session.id
    };

    // TODO: Persist licenseRecord to your DB (Firestore or Postgres)
    console.log('License record (save to DB):', licenseRecord);

    // TODO: Generate contract PDF prefilled with licenseRecord and send to DocuSign/HelloSign
    // sendContractForSignature(licenseRecord)

    // For demo we simply log
  }

  res.json({ received: true });
}
