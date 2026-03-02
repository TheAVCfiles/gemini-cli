'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FounderStates, type FounderState, transition } from '../../../lib/founderMachine';
import type { LedgerEntry } from '../../../lib/ledgerStore';

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

  const [founderState, setFounderState] = useState<FounderState>(FounderStates.IDLE);
  const [ledgerRows, setLedgerRows] = useState<LedgerEntry[]>([]);
  const [ledgerErr, setLedgerErr] = useState<string>('');

  function doTransition(action: string) {
    const next = transition(founderState, action);
    setFounderState(next);
  }

  async function loadLedger() {
    setLedgerErr('');
    try {
      const res = await fetch('/api/ledger');
      if (!res.ok) throw new Error(`Ledger fetch failed (${res.status})`);
      const data = (await res.json()) as unknown;
      const rows = Array.isArray(data) ? data : [];
      setLedgerRows(rows.slice(0, 10));
    } catch (ex: unknown) {
      const message = ex instanceof Error ? ex.message : 'Failed to load ledger';
      setLedgerErr(message);
    }
  }

  useEffect(() => {
    void loadLedger();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Founder Dashboard</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Founder State</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{founderState}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => doTransition('START_BUILD')}>START_BUILD</button>
            <button onClick={() => doTransition('THROTTLE')}>THROTTLE</button>
            <button onClick={() => doTransition('RESET')}>RESET</button>
            <button onClick={loadLedger}>Refresh Ledger</button>
          </div>
        </div>

        <hr style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontWeight: 800 }}>Recent Ledger Entries</div>
          <Link href="/founder-studios" style={{ fontSize: 13 }}>
            Open StudiOS Onboarding →
          </Link>
        </div>

        {ledgerErr ? <div style={{ color: 'crimson' }}>{ledgerErr}</div> : null}

        <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}>
          {ledgerRows.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No entries yet.</div>
          ) : (
            ledgerRows.map((r, idx) => (
              <div key={`${r.hash}-${idx}`} style={{ padding: '6px 0', borderBottom: '1px dashed #eee' }}>
                <div>
                  <b>{r.eventType || 'EVENT'}</b>{' '}
                  <span style={{ opacity: 0.7 }}>
                    {r.documentId ? `· ${r.documentId}` : ''}
                    {r.createdAt ? ` · ${r.createdAt}` : ''}
                  </span>
                </div>
                {r.hash ? <div>hash: {String(r.hash).slice(0, 16)}…</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#64748b' }}>
        {completedSteps} of {totalSteps} steps notarized · {ledgerRows.length} ledger events
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
          await loadLedger();
        }}
      >
        Start Build
      </button>
    </main>
  );
}
