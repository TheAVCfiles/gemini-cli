const baseUrl = process.env.SITE_URL || 'http://localhost:3000';

async function createTier({ tierName, unitAmount, description }) {
  const response = await fetch(`${baseUrl}/api/stripe/create_link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tierName, unitAmount, description }),
  });
  const payload = await response.json();

  if (!payload.ok || !payload.url) {
    throw new Error('Failed to create tier');
  }

  return payload.url;
}

async function listProducts() {
  const response = await fetch(`${baseUrl}/api/stripe/list_products`);
  return response.json();
}

async function ledger() {
  const response = await fetch(`${baseUrl}/api/ledger`);
  return response.json();
}

export const tools = {
  'bet.createTier': createTier,
  'bet.listProducts': listProducts,
  'bet.ledger': ledger,
};
