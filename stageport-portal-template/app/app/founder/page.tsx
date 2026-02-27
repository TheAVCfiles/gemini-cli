'use client';

type OpState = 'intake' | 'scope' | 'governance' | 'seal' | 'release';

const founderSteps: OpState[] = ['intake', 'scope', 'governance', 'seal', 'release'];

function getStepIndex(state: OpState) {
  return founderSteps.indexOf(state) + 1;
}

async function hashTransition(from: OpState, to: OpState, event: string): Promise<string> {
  const text = `${from}->${to}:${event}:${Date.now()}`;
  const res = await fetch('/api/documents/hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = (await res.json()) as { sha256?: unknown };
  const sha256 = typeof data?.sha256 === 'string' && data.sha256.trim().length > 0 ? data.sha256.trim() : null;
  if (!sha256) {
    throw new Error(`hashTransition: invalid sha256 returned from /api/documents/hash (event=${event})`);
  }
  return sha256;
}

export default function FounderDashboardPage() {
  const journeyState: OpState = 'governance';
  const totalSteps = founderSteps.length;
  const completedSteps = Math.min(getStepIndex(journeyState), totalSteps);
  const journeyLedgerCount = 0;

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Founder Dashboard</h2>
      <p style={{ fontSize: 12, color: '#64748b' }}>
        {completedSteps} of {totalSteps} steps notarized · {journeyLedgerCount} ledger events
      </p>
      <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 99 }}>
        <div
          data-testid="progress-journey"
          style={{
            width: `${totalSteps === 0 ? 0 : (completedSteps / totalSteps) * 100}%`,
            height: 8,
            borderRadius: 99,
            background: '#111827',
          }}
        />
      </div>
      <p style={{ marginTop: 16 }}>Hash guard active for transition notarization.</p>
      <button
        onClick={async () => {
          const hash = await hashTransition('scope', 'governance', 'ADVANCE');
          await fetch('/api/ledger/notarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: 'founder:demo', hash, eventType: 'FOUNDER_TRANSITION' }),
          });
        }}
      >
        Start Build
      </button>
    </main>
  );
}
