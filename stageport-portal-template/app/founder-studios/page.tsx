'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import PortalFooter from '../../components/PortalFooter';
import PortalNavigation from '../../components/PortalNavigation';

type StepKey = 'CRISIS' | 'LAB' | 'RECEIPTS' | 'STAGECRED' | 'CAPITAL';

const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  { key: 'CRISIS', title: 'Crisis', subtitle: 'Intake + constraints (what’s breaking, what must not break)' },
  { key: 'LAB', title: 'Lab Activation', subtitle: 'Create the studio container (rules, corridors, boundaries)' },
  { key: 'RECEIPTS', title: 'Receipts', subtitle: 'Ledger the decisions (proof-of-work, not vibes)' },
  { key: 'STAGECRED', title: 'StageCred', subtitle: 'Credential ladder (unlock next tier via receipts)' },
  { key: 'CAPITAL', title: 'Capital', subtitle: 'Export proof + metrics into investor-ready artifacts' },
];

function bufToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

async function sha256File(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return bufToHex(digest);
}

export default function FounderStudioOSPage() {
  const [step, setStep] = useState<StepKey>('CRISIS');

  const [fileName, setFileName] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [hashing, setHashing] = useState(false);

  const [notarizing, setNotarizing] = useState(false);
  const [notarized, setNotarized] = useState(false);
  const [err, setErr] = useState<string>('');

  const documentId = useMemo(() => 'stageport-founder-reality-kit-v1', []);

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    setErr('');
    setNotarized(false);
    setHash('');
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);

    try {
      setHashing(true);
      const h = await sha256File(f);
      setHash(h);
    } catch (ex: unknown) {
      const message = ex instanceof Error ? ex.message : 'Failed to hash file';
      setErr(message);
    } finally {
      setHashing(false);
    }
  }

  async function notarize() {
    setErr('');
    setNotarized(false);
    if (!hash) {
      setErr('No hash computed yet.');
      return;
    }

    try {
      setNotarizing(true);
      const res = await fetch('/api/ledger/notarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          hash,
          eventType: 'ISSUED',
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Notarize failed (${res.status}): ${text || 'Unknown error'}`);
      }

      setNotarized(true);
    } catch (ex: unknown) {
      const message = ex instanceof Error ? ex.message : 'Notarize failed';
      setErr(message);
    } finally {
      setNotarizing(false);
    }
  }

  return (
    <div>
      <PortalNavigation />
      <main style={{ padding: 16, maxWidth: 920, margin: '0 auto' }}>
        <h2>StagePort Startup StudiOS</h2>
        <p>
          StagePort Startup StudiOS is a conservatory operating system for early-stage founders. It teaches structural coherence under stress: barre → repetition → receipts → credential → capital. Not dance-themed—discipline-themed. Portable across tech, art, services, education, science. Most tools celebrate speed. StagePort measures it, constrains it, and records why.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {STEPS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #ccc',
                background: step === s.key ? '#f2f2f2' : 'white',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700 }}>{s.title}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{s.subtitle}</div>
            </button>
          ))}
        </div>

        <hr style={{ margin: '16px 0' }} />

        <h3>Phase 1: Notarize the Founder Reality Kit</h3>
        <p>
          This turns the PDF from “a file” into a governed asset with receipts: <b>PDF → Hash → Ledger</b>.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept="application/pdf" onChange={onUpload} />
          <button onClick={notarize} disabled={hashing || notarizing || !hash}>
            {notarizing ? 'Notarizing…' : 'Notarize to Ledger'}
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 13 }}>
          <div>
            <b>DocumentId:</b> {documentId}
          </div>
          <div>
            <b>File:</b> {fileName || '—'}
          </div>
          <div>
            <b>Hash:</b> {hashing ? 'Hashing…' : hash || '—'}
          </div>
          <div>
            <b>Status:</b> {notarized ? 'Ledger notarized ✅' : 'Not notarized yet'}
          </div>
          {err ? (
            <div style={{ color: 'crimson', marginTop: 8 }}>
              <b>Error:</b> {err}
            </div>
          ) : null}
        </div>

        <hr style={{ margin: '16px 0' }} />

        <h3>Current Step: {STEPS.find((x) => x.key === step)?.title}</h3>
        <p style={{ opacity: 0.9 }}>{STEPS.find((x) => x.key === step)?.subtitle}</p>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          {step === 'CRISIS' && <p>Write the constraint: what must not break. This is the founder’s alignment check before movement starts.</p>}
          {step === 'LAB' && <p>Define corridors: who owns what, who can escalate, what gets logged. This is the barre.</p>}
          {step === 'RECEIPTS' && <p>Ledger every meaningful decision. Receipts are your non-emotional memory under pressure.</p>}
          {step === 'STAGECRED' && <p>StageCred is earned by verified receipts. No receipts, no cred. No cred, no leverage.</p>}
          {step === 'CAPITAL' && <p>Capital is downstream of proof. Export the ledger trail into investor/grant outputs.</p>}
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
