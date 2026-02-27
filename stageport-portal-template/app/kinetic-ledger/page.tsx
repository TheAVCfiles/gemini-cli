'use client';

import { useMemo, useState } from 'react';
import PortalFooter from '../../components/PortalFooter';
import PortalNavigation from '../../components/PortalNavigation';

const CONTACT_EMAIL = 'guidedtarotpeutics@gmail.com';

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(digest);
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

export default function KineticLedgerPage() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [summary, setSummary] = useState('');
  const [hash, setHash] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const mailtoTriage = useMemo(() => {
    const subject = encodeURIComponent('Governance Triage Sprint — $2,500 (Kinetic Ledger)');
    return `mailto:${CONTACT_EMAIL}?subject=${subject}`;
  }, []);

  const canGenerate = company.trim().length > 0 && summary.trim().length > 0;

  async function generateSnapshot() {
    const ts = new Date().toISOString();
    const payload = [`NAME=${name.trim()}`, `COMPANY=${company.trim()}`, `ROLE=${role.trim()}`, `SUMMARY=${summary.trim()}`, `TS=${ts}`].join('|');
    const sha = await sha256Hex(payload);
    setTimestamp(ts);
    setHash(sha);

    downloadText(
      `kinetic-ledger-proof-${company.trim().replace(/\s+/g, '-').toLowerCase() || 'snapshot'}.txt`,
      `KINETIC LEDGER — FOUNDER PROOF SNAPSHOT\nTimestamp: ${ts}\nSHA-256: ${sha}\n\nName: ${name}\nCompany: ${company}\nRole: ${role}\nSummary:\n${summary}`,
    );
  }

  return (
    <div>
      <PortalNavigation />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <h1>Protect What You Build Before Anyone Questions It</h1>
        <p>Kinetic Ledger anchors founder contribution in dynamic environments. Capture motion. Hash transitions. Export proof.</p>
        <p>
          <a href={mailtoTriage}>Book Governance Triage Sprint — $2,500</a>
        </p>

        <h2>Why Founders Lose Leverage</h2>
        <ul>
          <li>Contribution not recorded.</li>
          <li>Territory not documented.</li>
          <li>Architecture decisions not timestamped.</li>
          <li>Early IP not anchored.</li>
          <li>Verbal alignment replaces written record.</li>
        </ul>
        <p>When conflict happens, the person who controls the record controls the narrative.</p>

        <h2>What Kinetic Ledger Is</h2>
        <p>Capture Motion · Anchor Authorship · Export Proof</p>
        <p>Legal clarity: We do not store proprietary corporate data. We anchor founder-authored contribution declarations.</p>

        <section id="proof-snapshot">
          <h2>Founder Proof Snapshot</h2>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />{' '}
          <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />{' '}
          <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <div>
            <textarea placeholder="Contribution Summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} cols={80} />
          </div>
          <button onClick={generateSnapshot} disabled={!canGenerate}>Generate Founder Proof Snapshot</button>
          {hash && timestamp && (
            <p>
              Timestamp: {timestamp}
              <br />
              SHA-256: {hash}
            </p>
          )}
        </section>

        <h2>Governance Triage Sprint — $2,500</h2>
        <ul>
          <li>75–90 min intake call</li>
          <li>One-page risk map + corridor sketch</li>
          <li>Ledger-notarized Findings + Constraints PDF</li>
          <li>Go/no-go + next tier recommendation</li>
        </ul>

        <h2>Escalation Path</h2>
        <p>Systems Triage $12K · Governance Install $25K–$50K · Institutional Licensing</p>
      </main>
      <PortalFooter />
    </div>
  );
}
