'use client';

import { useMemo, useState } from 'react';
import PortalFooter from '../../../components/PortalFooter';
import PortalNavigation from '../../../components/PortalNavigation';

const CONTACT_EMAIL = 'guidedtarotpeutics@gmail.com';

type RiskTier = 'LOW' | 'MODERATE' | 'HIGH';

async function postHash(text: string): Promise<string> {
  const res = await fetch('/api/documents/hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = (await res.json()) as { sha256?: unknown };
  if (typeof data?.sha256 !== 'string' || data.sha256.trim().length === 0) {
    throw new Error('FounderOS: invalid sha256 returned from /api/documents/hash');
  }
  return data.sha256.trim();
}

async function notarize(documentId: string, hash: string, eventType: string) {
  await fetch('/api/ledger/notarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, hash, eventType }),
  });
}

export default function FounderOSSandboxPage() {
  const [company, setCompany] = useState('');
  const [founderName, setFounderName] = useState('');
  const [role, setRole] = useState('');
  const [contributionSummary, setContributionSummary] = useState('');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionContext, setDecisionContext] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [result, setResult] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const questions = [
    'Role documentation exists',
    'Contribution timestamps are tracked',
    'Equity alignment is documented',
    'Record control is founder-accessible',
    'Decisions include constraints',
    'Escalation path is documented',
    'IP is anchored early',
    'Decision ownership is attributable',
    'Proof exports are available',
    'Narrative cannot be rewritten by one actor',
  ];

  const tier: RiskTier = useMemo(() => {
    const yesCount = Object.values(answers).filter(Boolean).length;
    if (yesCount >= 8) return 'LOW';
    if (yesCount >= 5) return 'MODERATE';
    return 'HIGH';
  }, [answers]);

  async function generateContributionAnchor() {
    const ts = new Date().toISOString();
    const text = `${founderName}|${company}|${role}|${contributionSummary}|${ts}`;
    const hash = await postHash(text);
    await notarize(`founderos:${company.trim() || 'unknown'}`, hash, 'FOUNDEROS_SANDBOX_ANCHOR');
    setResult(`Contribution anchor written at ${ts} with hash ${hash}`);
  }

  async function generateDecisionAnchor() {
    const ts = new Date().toISOString();
    const text = `${company}|${decisionTitle}|${decisionContext}|${decisionDate}|${ts}`;
    const hash = await postHash(text);
    await notarize(`founderos:${company.trim() || 'unknown'}`, hash, 'FOUNDEROS_DECISION_ANCHOR');
    setResult(`Decision anchor written at ${ts} with hash ${hash}`);
  }

  const mailtoTriage = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Governance Triage Sprint — $2,500')}`;

  return (
    <div>
      <PortalNavigation />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <h1>FounderOS Sandbox — Governance as a Service</h1>
        <p>Powered by StagePort. Document contribution. Anchor decisions. Export proof.</p>
        <p>Founder-authored entries only. We do not store proprietary corporate data.</p>

        <h2>A — Contribution Log</h2>
        <input placeholder="Founder Name" value={founderName} onChange={(e) => setFounderName(e.target.value)} />{' '}
        <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />{' '}
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <div>
          <textarea placeholder="Contribution Summary" value={contributionSummary} onChange={(e) => setContributionSummary(e.target.value)} rows={4} cols={80} />
        </div>
        <button disabled={!company.trim() || !contributionSummary.trim()} onClick={generateContributionAnchor}>Generate Ledger Anchor</button>

        <h2>B — Decision Log</h2>
        <input placeholder="Decision Title" value={decisionTitle} onChange={(e) => setDecisionTitle(e.target.value)} />{' '}
        <input placeholder="Date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} />
        <div>
          <textarea placeholder="Context / Constraints" value={decisionContext} onChange={(e) => setDecisionContext(e.target.value)} rows={4} cols={80} />
        </div>
        <button disabled={!company.trim() || !decisionTitle.trim()} onClick={generateDecisionAnchor}>Generate Ledger Anchor</button>

        <h2>C — Risk Corridor Self-Assessment</h2>
        {questions.map((q, i) => (
          <label key={q} style={{ display: 'block' }}>
            <input type="checkbox" checked={!!answers[i]} onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.checked }))} /> {q}
          </label>
        ))}
        <p>Risk Tier: {tier}</p>
        {tier === 'HIGH' && <a href={mailtoTriage}>Book Governance Triage Sprint — $2,500</a>}

        <h2>D — Upgrade</h2>
        <p>Need multi-user logging? Secure server-side storage? Weighted contribution modeling?</p>
        <a href={mailtoTriage}>Triage Sprint</a>

        {result && <p>{result}</p>}
      </main>
      <PortalFooter />
    </div>
  );
}
