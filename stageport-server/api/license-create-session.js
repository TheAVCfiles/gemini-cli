import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST')
      return res.status(405).json({ error: 'Method Not Allowed' });
    const {
      facultyId,
      licenseType = 'institutional',
      institution = 'Unknown',
      auditHash,
    } = req.body;
    if (!facultyId || !auditHash)
      return res
        .status(400)
        .json({ error: 'facultyId and auditHash required' });

    const priceMap = { institutional: 500000, internal: 99900 };
    const priceCents = priceMap[licenseType] || priceMap['institutional'];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Stageport License — ${facultyId}` },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.PUBLIC_URL}/license-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL}/license-cancel`,
      metadata: { facultyId, licenseType, institution, auditHash },
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
