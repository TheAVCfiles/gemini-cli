'use client';

type Agreement = {
  id: string;
  title: string;
  type: 'license' | 'service';
  status: 'active' | 'draft';
  provisions: string[];
  fullText: string;
};

const agreements: Agreement[] = [
  {
    id: 'a-1',
    title: 'Founder Governance Baseline',
    type: 'service',
    status: 'active',
    provisions: ['Scope boundaries', 'Data posture declaration', 'Escalation policy'],
    fullText: 'Founder Governance Baseline agreement template.',
  },
  {
    id: 'a-2',
    title: 'Operational Confidentiality',
    type: 'license',
    status: 'active',
    provisions: ['Confidential handling', 'Need-to-know access', 'Retention limits'],
    fullText: 'Operational Confidentiality template.',
  },
  {
    id: 'a-3',
    title: 'Contribution Record Policy',
    type: 'service',
    status: 'active',
    provisions: ['Timestamp requirements', 'Attribution controls', 'Export policy'],
    fullText: 'Contribution Record Policy template.',
  },
  {
    id: 'a-4',
    title: 'Evidence Export License',
    type: 'license',
    status: 'active',
    provisions: ['Export scope', 'Integrity expectations', 'Distribution limits'],
    fullText: 'Evidence Export License template.',
  },
  {
    id: 'iga-001',
    title: 'Institutional Governance Audit',
    type: 'license',
    status: 'active',
    provisions: [
      'Structural Risk Review: boundary clarity, data exposure, infrastructure posture',
      'Governance Compression Index: Liability Exposure, Data Boundary Clarity, Escalation Controls, Institutional Readiness, Regulatory Surface (1-5 each)',
      'Recommendation: Safe to Deploy, Deploy with Conditions, or Defer Deployment',
    ],
    fullText: `Institutional Governance Audit\n\nStructural Risk Review\n- Boundary clarity\n- Data exposure\n- Infrastructure posture\n\nGovernance Compression Index (1-5)\n- Liability Exposure\n- Data Boundary Clarity\n- Escalation Controls\n- Institutional Readiness\n- Regulatory Surface\n\nRecommendation\n- Safe to Deploy\n- Deploy with Conditions\n- Defer Deployment\n`,
  },
];

export default function ContractsPage() {
  return (
    <main style={{ maxWidth: 980, margin: '40px auto', padding: 24 }}>
      <h2>Contracts</h2>
      <p>Institutional contract and audit templates.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {agreements.map((agreement) => (
          <article key={agreement.id} style={{ border: '1px solid #d4d8e5', borderRadius: 8, padding: 16, background: '#fff' }}>
            <h3 style={{ marginTop: 0 }}>{agreement.title}</h3>
            <p style={{ fontSize: 12 }}>{agreement.type.toUpperCase()} · {agreement.status.toUpperCase()}</p>
            <ul>
              {agreement.provisions.map((provision) => (
                <li key={provision}>{provision}</li>
              ))}
            </ul>
            <details>
              <summary>View full text</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{agreement.fullText}</pre>
            </details>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(agreement.fullText)}`}
              download={`${agreement.id}.txt`}
            >
              Download
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
