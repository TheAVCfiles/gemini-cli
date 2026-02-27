'use client';

import { useState } from 'react';

async function hashStep(text: string): Promise<string> {
  const res = await fetch('/api/documents/hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = (await res.json()) as { sha256?: unknown };
  const sha256 = typeof data?.sha256 === 'string' && data.sha256.trim().length > 0 ? data.sha256.trim() : null;

  if (!sha256) {
    throw new Error('hashStep: invalid sha256 returned from /api/documents/hash');
  }

  return sha256;
}

export default function FounderOnboardingFlowPage() {
  const [result, setResult] = useState('');

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Founder Onboarding Flow</h2>
      <button
        onClick={async () => {
          const sha = await hashStep(`onboarding:${new Date().toISOString()}`);
          setResult(sha);
        }}
      >
        Hash Onboarding Step
      </button>
      {result && <p>{result}</p>}
    </main>
  );
}
