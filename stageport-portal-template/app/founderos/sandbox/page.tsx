'use client';

import { useMemo, useState } from 'react';
import PortalFooter from '../../../components/PortalFooter';
import PortalNavigation from '../../../components/PortalNavigation';

const CONTACT_EMAIL = 'guidedtarotpeutics@gmail.com';

type RiskTier = 'LOW' | 'MODERATE' | 'HIGH';
type LedgerEntry = { documentId: string; hash: string; eventType: string; createdAt: string };
type AnchorResult = { hash: string; timestamp: string; documentId: string; kind: 'contribution' | 'decision' };

function clampDocIdCompany(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [contributionResult, setContributionResult] = useState<AnchorResult | null>(null);
  const [decisionResult, setDecisionResult] = useState<AnchorResult | null>(null);
  const [ledgerNotice, setLedgerNotice] = useState<string>('');

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

  const score = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const tier: RiskTier = useMemo(() => {
    if (score >= 8) return 'LOW';
    if (score >= 5) return 'MODERATE';
    return 'HIGH';
  }, [score]);

  const recommendation = useMemo(() => {
    if (tier === 'LOW') return 'Maintain cadence and continue anchoring decisions weekly.';
    if (tier === 'MODERATE') return 'Prioritize corridor controls and add audit checkpoints this sprint.';
    return 'Immediate governance triage recommended to prevent narrative drift and control loss.';
  }, [tier]);

  async function generateContributionAnchor() {
    const timestamp = new Date().toISOString();
    const docCompany = clampDocIdCompany(company);
    const documentId = `founderos:${docCompany}`;
    const text = `${founderName}|${company}|${role}|${contributionSummary}|${timestamp}`;
    const hash = await postHash(text);
    await notarize(documentId, hash, 'FOUNDEROS_SANDBOX_ANCHOR');
    setContributionResult({ hash, timestamp, documentId, kind: 'contribution' });
    setResult(`Contribution anchor written at ${timestamp} with hash ${hash}`);
  }

  async function generateDecisionAnchor() {
    const timestamp = new Date().toISOString();
    const docCompany = clampDocIdCompany(company);
    const documentId = `founderos:${docCompany}`;
    const text = `${company}|${decisionTitle}|${decisionContext}|${decisionDate}|${timestamp}`;
    const hash = await postHash(text);
    await notarize(documentId, hash, 'FOUNDEROS_DECISION_ANCHOR');
    setDecisionResult({ hash, timestamp, documentId, kind: 'decision' });
    setResult(`Decision anchor written at ${timestamp} with hash ${hash}`);
  }

  function downloadContributionProof() {
    if (!contributionResult) return;
    const safeCompany = clampDocIdCompany(company);
    downloadText(
      `founderos-contribution-proof-${safeCompany}.txt`,
      [
        'FOUNDEROS CONTRIBUTION PROOF',
        `Document Type: ${contributionResult.kind}`,
        `Founder: ${founderName || 'N/A'}`,
        `Company: ${company || 'N/A'}`,
        `Role: ${role || 'N/A'}`,
        `Contribution Summary: ${contributionSummary || 'N/A'}`,
        `SHA-256 Hash: ${contributionResult.hash}`,
        `Timestamp: ${contributionResult.timestamp}`,
        `Document ID: ${contributionResult.documentId}`,
      ].join('\n'),
    );
  }

  function downloadDecisionProof() {
    if (!decisionResult) return;
    const safeCompany = clampDocIdCompany(company);
    downloadText(
      `founderos-decision-proof-${safeCompany}.txt`,
      [
        'FOUNDEROS DECISION PROOF',
        `Document Type: ${decisionResult.kind}`,
        `Founder: ${founderName || 'N/A'}`,
        `Company: ${company || 'N/A'}`,
        `Role: ${role || 'N/A'}`,
        `Contribution Summary: ${decisionTitle}${decisionContext ? ` — ${decisionContext}` : ''}`,
        `SHA-256 Hash: ${decisionResult.hash}`,
        `Timestamp: ${decisionResult.timestamp}`,
        `Document ID: ${decisionResult.documentId}`,
      ].join('\n'),
    );
  }

  function downloadRiskSummary() {
    const safeCompany = clampDocIdCompany(company);
    const answeredQuestions = questions
      .map((question, index) => ({ question, checked: !!answers[index] }))
      .filter((entry) => entry.checked)
      .map((entry) => `- ${entry.question}`);

    downloadText(
      `founderos-risk-assessment-${safeCompany}.txt`,
      [
        'FOUNDEROS RISK CORRIDOR SUMMARY',
        `Company: ${company || 'N/A'}`,
        `Date: ${new Date().toISOString()}`,
        '',
        'Answered Questions:',
        ...(answeredQuestions.length ? answeredQuestions : ['- None']),
        '',
        `Score: ${score}/10`,
        `Tier: ${tier}`,
        `Recommendation: ${recommendation}`,
        tier === 'HIGH' ? 'CTA: Book the Governance Triage Sprint — $2,500' : 'CTA: Continue weekly governance anchors.',
      ].join('\n'),
    );
  }

  async function exportLedgerHistory() {
    setLedgerNotice('');
    const docId = `founderos:${clampDocIdCompany(company)}`;
    const response = await fetch('/api/ledger');
    const entries = ((await response.json()) as LedgerEntry[]).filter((entry) => entry.documentId === docId);

    if (!entries.length) {
      setLedgerNotice('No ledger entries found for this company.');
      return;
    }

    downloadText(
      `founderos-ledger-${clampDocIdCompany(company)}.txt`,
      [
        'FOUNDEROS LEDGER HISTORY',
        `Company: ${company || 'N/A'}`,
        `Document ID: ${docId}`,
        `Exported At: ${new Date().toISOString()}`,
        '',
        ...entries.map((entry, index) => `${index + 1}. ${entry.createdAt} | ${entry.eventType} | ${entry.hash}`),
      ].join('\n'),
    );
    setLedgerNotice(`Exported ${entries.length} ledger entries.`);
  }

  const mailtoTriage = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Governance Triage Sprint — $2,500')}`;

  return (
    <div>
      <PortalNavigation />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, display: 'grid', gap: 64 }}>
        <section>
          <h1>FounderOS Sandbox — Governance as a Service</h1>
          <p>Powered by StagePort. Document contribution. Anchor decisions. Export proof.</p>
          <p>Founder-authored entries only. We do not store proprietary corporate data.</p>
        </section>

        <section>
          <h2>A — Contribution Log</h2>
          <input placeholder="Founder Name" value={founderName} onChange={(e) => setFounderName(e.target.value)} />{' '}
          <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />{' '}
          <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <div>
            <textarea placeholder="Contribution Summary" value={contributionSummary} onChange={(e) => setContributionSummary(e.target.value)} rows={4} cols={80} />
          </div>
          <button disabled={!company.trim() || !contributionSummary.trim()} onClick={generateContributionAnchor}>Generate Ledger Anchor</button>
          {contributionResult && (
            <p>
              SHA-256: {contributionResult.hash}
              <br />
              Timestamp: {contributionResult.timestamp}
              <br />
              <button onClick={downloadContributionProof}>Download Proof</button>
            </p>
          )}
        </section>

        <section>
          <h2>B — Decision Log</h2>
          <input placeholder="Decision Title" value={decisionTitle} onChange={(e) => setDecisionTitle(e.target.value)} />{' '}
          <input placeholder="Date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} />
          <div>
            <textarea placeholder="Context / Constraints" value={decisionContext} onChange={(e) => setDecisionContext(e.target.value)} rows={4} cols={80} />
          </div>
          <button disabled={!company.trim() || !decisionTitle.trim()} onClick={generateDecisionAnchor}>Generate Ledger Anchor</button>
          {decisionResult && (
            <p>
              SHA-256: {decisionResult.hash}
              <br />
              Timestamp: {decisionResult.timestamp}
              <br />
              <button onClick={downloadDecisionProof}>Download Proof</button>
            </p>
          )}
        </section>

        <section>
          <h2>C — Risk Corridor Self-Assessment</h2>
          {questions.map((q, i) => (
            <label key={q} style={{ display: 'block' }}>
              <input type="checkbox" checked={!!answers[i]} onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.checked }))} /> {q}
            </label>
          ))}
          <p>Risk Tier: {tier}</p>
          <button disabled={score === 0} onClick={downloadRiskSummary}>Download Risk Summary</button>
          {tier === 'HIGH' && <p><a href={mailtoTriage}>Book Governance Triage Sprint — $2,500</a></p>}
        </section>

        <section>
          <h2>Export Ledger History</h2>
          <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />{' '}
          <button disabled={!company.trim()} onClick={exportLedgerHistory}>Export Ledger History</button>
          {ledgerNotice && <p>{ledgerNotice}</p>}
        </section>

        <section>
          <h2>D — Upgrade</h2>
          <p>Need multi-user logging? Secure server-side storage? Weighted contribution modeling?</p>
          <a href={mailtoTriage}>Triage Sprint</a>
        </section>

        {result && <p>{result}</p>}
      </main>
      <PortalFooter />
    </div>
  );
}
