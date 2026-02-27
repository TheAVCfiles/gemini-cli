'use client';

import { useMemo, useState, type CSSProperties } from 'react';

type AgreementType = 'faculty' | 'pilot' | 'investor' | 'license';
type AgreementStatus = 'active' | 'pending' | 'draft';

interface Provision {
  title: string;
  items: string[];
}

interface Agreement {
  id: string;
  title: string;
  type: AgreementType;
  status: AgreementStatus;
  description: string;
  lastUpdated: string;
  parties?: string[];
  provisions: Provision[];
  fullText?: string;
}

function formatStatus(status: AgreementStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function downloadAgreement(agreement: Agreement) {
  const titleUpper = agreement.title.toUpperCase();

  const lines = [
    titleUpper,
    '='.repeat(titleUpper.length),
    '',
    `Status: ${formatStatus(agreement.status)}`,
    `Last Updated: ${agreement.lastUpdated}`,
    agreement.parties ? `Parties: ${agreement.parties.join(' | ')}` : '',
    '',
    '---',
    '',
    agreement.description,
    ''
  ];

  for (const provision of agreement.provisions) {
    lines.push(provision.title);
    lines.push('-'.repeat(provision.title.length));
    for (const item of provision.items) lines.push(`  • ${item}`);
    lines.push('');
  }

  if (agreement.fullText) {
    lines.push('---');
    lines.push('');
    lines.push('FULL DOCUMENT TEXT');
    lines.push('');
    lines.push(agreement.fullText);
  }

  lines.push('');
  lines.push('© Global AVC Systems. All rights reserved.');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${agreement.id}-${agreement.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const agreements: Agreement[] = [
  {
    id: 'ffa-001',
    title: 'Founding Faculty Participation Agreement',
    type: 'faculty',
    status: 'active',
    description:
      'Preserves, codifies, and credentializes the embodied artistic knowledge of Faculty Members into educational modules and digital credentials.',
    lastUpdated: '2024-12-15',
    parties: ['Faculty Member', 'Athletes of AlgoRhythm'],
    provisions: [
      {
        title: 'Section 1: Contribution',
        items: [
          'Recorded conversations and oral history',
          'Demonstrations or descriptions of signature sequences',
          'Name, likeness, and materials for credentialized modules'
        ]
      },
      {
        title: 'Section 2: Rights & Legacy',
        items: [
          'Moral rights retained as source of codified knowledge',
          'Credit line: "Codified from the legacy of [Artist Name]"',
          'Heir/trust designation for royalties in event of death or incapacity'
        ]
      },
      {
        title: 'Section 3: Royalties',
        items: [
          'Platform/Operations: 50-60%',
          'Artist Pool: 30-40%',
          'Community/Scholarship Fund: 10%',
          'Quarterly royalty disbursements to Faculty or designated heirs'
        ]
      },
      {
        title: 'Section 4: Term',
        items: [
          'Agreement lasts lifetime + 50 years posthumously',
          'After posthumous term, royalties revert to Community Fund'
        ]
      },
      {
        title: 'Section 5: Deliverables',
        items: [
          'Filmed/archived session',
          'Draft credential mockups',
          'Recognition as Founding Faculty',
          'Official digital badge lineage',
          'Ongoing royalty payments'
        ]
      }
    ],
    fullText:
      'This Founding Faculty Participation Agreement ("Agreement") is entered into between the Faculty Member and Athletes of AlgoRhythm ("Company"), operating the StagePort Systems platform.\n\nThe Faculty Member agrees to contribute recorded conversations, oral histories, demonstrations or descriptions of signature sequences, and the use of their name, likeness, and related materials for the purpose of creating credentialized educational modules within the StagePort ecosystem.\n\nThe Faculty Member retains full moral rights as the recognized source of codified knowledge. All modules derived from Faculty contributions shall carry the credit line: "Codified from the legacy of [Artist Name]." In the event of death or incapacity, royalty rights transfer to the designated heir or trust.\n\nRoyalty Structure:\n  - Platform/Operations: 50-60%\n  - Artist Pool: 30-40%\n  - Community/Scholarship Fund: 10%\n  - Disbursements: Quarterly\n\nTerm: This agreement remains in effect for the lifetime of the Faculty Member plus fifty (50) years posthumously. After the posthumous term expires, all remaining royalties revert to the Community Fund.\n\nDeliverables to Faculty: Filmed/archived session, draft credential mockups, recognition as Founding Faculty, official digital badge lineage, and ongoing royalty payments.'
  },
  {
    id: 'sfa-001',
    title: 'StagePort Founding Faculty Addendum',
    type: 'investor',
    status: 'active',
    description:
      'Defines faculty role, rights, and boundaries. Establishes ownership separation between personal creative works and system architecture.',
    lastUpdated: '2024-12-10',
    parties: ['Faculty Member', 'StagePort'],
    provisions: [
      {
        title: 'Faculty Rights',
        items: [
          'Faculty retain ownership of personal creative works',
          'Original choreography remains Faculty intellectual property'
        ]
      },
      {
        title: 'System Ownership',
        items: [
          'StagePort retains all system logic and credentialing',
          'System architecture is non-negotiable',
          'Scoring logic protected as exclusive IP',
          'Governance weighting protected as exclusive IP',
          'Token logic protected as exclusive IP'
        ]
      },
      {
        title: 'Confidentiality',
        items: [
          'No disclosure of system internals permitted',
          'No replication of system architecture permitted',
          'Governed by New York State law'
        ]
      }
    ],
    fullText:
      'This Addendum supplements the Founding Faculty Participation Agreement and establishes clear boundaries between Faculty intellectual property and StagePort system architecture.\n\nFaculty Rights: The Faculty Member retains complete ownership of all personal creative works, including but not limited to original choreography, personal artistic materials, and pre-existing intellectual property created independently of StagePort.\n\nSystem Ownership: StagePort retains exclusive ownership of all system logic, credentialing mechanisms, scoring algorithms, governance weighting structures, token economics, and compiler architectures. These elements are non-negotiable and constitute protected trade secrets.\n\nConfidentiality: The Faculty Member agrees not to disclose system internals, replicate system architecture, or share proprietary methods with third parties. This agreement is governed by the laws of the State of New York.'
  },
  {
    id: 'l1p-001',
    title: 'Level I Pilot License',
    type: 'license',
    status: 'pending',
    description:
      'Limited, revocable license for local StagePort installation with non-exclusive, non-transferable, outcome-only access.',
    lastUpdated: '2024-12-08',
    parties: ['Operator', 'StagePort'],
    provisions: [
      {
        title: 'License Terms',
        items: [
          'Limited, revocable license for local installation',
          'Non-exclusive access rights',
          'Non-transferable to third parties',
          'Outcome-only access (no system internals)'
        ]
      },
      {
        title: 'Operator Obligations',
        items: [
          'Must agree to system non-interference',
          'No reverse engineering permitted',
          'No extraction of system logic',
          'Compliance with usage guidelines'
        ]
      },
      {
        title: 'Revocation Conditions',
        items: [
          'Breach of confidentiality',
          'Attempt to replicate system architecture',
          'Unauthorized disclosure of outputs'
        ]
      }
    ],
    fullText:
      'Level I Pilot License Agreement grants the Operator a limited, revocable, non-exclusive, and non-transferable license to install and operate a local instance of the StagePort platform.\n\nAccess is outcome-only: Operators may view and use system outputs but have no access to underlying system internals, scoring logic, or governance architecture.\n\nOperator Obligations: The Operator must agree to system non-interference, must not attempt reverse engineering or extraction of system logic, and must comply with all usage guidelines as specified by StagePort.\n\nRevocation: This license may be revoked immediately upon breach of confidentiality, any attempt to replicate system architecture, or unauthorized disclosure of system outputs to third parties.'
  },
  {
    id: 'ffb-001',
    title: 'Founding Faculty Briefing Memo',
    type: 'faculty',
    status: 'draft',
    description:
      'Defines the role, rights, limits, and protections for Founding Faculty in a StagePort Level I pilot. Includes corridor selection and consent vow.',
    lastUpdated: '2024-12-05',
    parties: ['Founding Faculty', 'StagePort'],
    provisions: [
      {
        title: 'Faculty Role Definition',
        items: [
          'Defines role, rights, and limits in Level I pilot',
          'Establishes protections for Founding Faculty',
          'Clarifies boundaries of participation'
        ]
      },
      {
        title: 'Corridor Selection',
        items: [
          'Teach: Educational contribution pathway',
          'Invest: Financial participation pathway',
          'Build: System development contribution pathway'
        ]
      },
      {
        title: 'Consent Vow',
        items: [
          '"We agree to teach with constraint"',
          '"We agree to govern with clarity"',
          '"We agree to protect embodied labor"'
        ]
      }
    ],
    fullText:
      'Founding Faculty Briefing Memo outlines the role, rights, limits, and protections for Founding Faculty participating in a StagePort Level I pilot.\n\nRole Definition: Founding Faculty serve as the embodied knowledge source for credentialized modules. Their participation is collaborative and archival in nature — StagePort handles all technical and logistical work.\n\nCorridor Selection: Each Faculty Member selects a primary corridor of participation:\n  - Teach: Educational contribution and methodology transfer\n  - Invest: Financial participation in platform revenue\n  - Build: Direct contribution to system development\n\nConsent Vow: All Founding Faculty affirm the following principles:\n  "We agree to teach with constraint."\n  "We agree to govern with clarity."\n  "We agree to protect embodied labor."'
  },
  {
    id: 'iga-001',
    title: 'Institutional Governance Audit',
    type: 'license',
    status: 'active',
    description:
      'Structured governance audit template for institutional readiness assessment. Evaluates boundary clarity, data exposure, infrastructure posture, and regulatory surface across five scored dimensions.',
    lastUpdated: '2025-01-15',
    parties: ['Institution / Studio', 'AVC Governance Architect'],
    provisions: [
      {
        title: 'Structural Risk Review',
        items: [
          'Boundary clarity assessment',
          'Data exposure mapping',
          'Infrastructure posture evaluation',
          'Escalation control verification'
        ]
      },
      {
        title: 'Governance Compression Index (Scored 1–5)',
        items: [
          'Liability Exposure',
          'Data Boundary Clarity',
          'Escalation Controls',
          'Institutional Readiness',
          'Regulatory Surface'
        ]
      },
      {
        title: 'Recommendation',
        items: ['Safe to Deploy', 'Deploy with Conditions', 'Defer Deployment']
      }
    ],
    fullText:
      'INSTITUTIONAL GOVERNANCE AUDIT\n\nThis audit provides a structured assessment of governance readiness for organizations operating in dynamic, high-stakes environments.\n\nSECTION 1 — STRUCTURAL RISK REVIEW\n\nBoundary Clarity: Evaluate whether system boundaries are documented, communicated, and enforced. Assess separation between operational domains, data environments, and decision authority.\n\nData Exposure: Map all data collection, storage, retention, and deletion practices. Identify exposed surfaces, unprotected transfers, and retention policy gaps.\n\nInfrastructure Posture: Review cloud, repository, domain, and email infrastructure for security posture, access control, and dependency risk.\n\nEscalation Controls: Verify that human-in-the-loop triggers exist, incident escalation flows are documented, and escalation paths are tested.\n\nSECTION 2 — GOVERNANCE COMPRESSION INDEX\n\nEach dimension is scored 1–5 (1 = Critical Gap, 5 = Institutional Grade):\n\n  1. Liability Exposure — How exposed is the organization to governance-related liability?\n  2. Data Boundary Clarity — Are data boundaries documented and enforced?\n  3. Escalation Controls — Do escalation paths exist and function under pressure?\n  4. Institutional Readiness — Can the organization survive due diligence or regulatory scrutiny?\n  5. Regulatory Surface — What is the organization\'s regulatory exposure and compliance posture?\n\nComposite Score: Sum of all dimensions (5–25).\n  - 20–25: Institutional Grade\n  - 14–19: Operational but requires hardening\n  - 8–13: Significant gaps — remediation required before deployment\n  - 5–7: Critical — defer deployment until remediation is complete\n\nSECTION 3 — RECOMMENDATION\n\nBased on the Governance Compression Index composite score, one of three recommendations is issued:\n\n  A. Safe to Deploy — Organization meets institutional governance standards. No material gaps identified.\n\n  B. Deploy with Conditions — Organization may proceed with specific remediation commitments documented and time-bound.\n\n  C. Defer Deployment — Material governance gaps exist that expose the organization to unacceptable risk. Deployment should be deferred until remediation is verified.\n\nThis audit is an evaluation artifact — not an install. It produces a scored assessment and actionable recommendation, not operational infrastructure.\n\n© Global AVC Systems. All rights reserved.'
  }
];

const typeLabels: Record<AgreementType, string> = {
  faculty: 'Faculty Agreement',
  pilot: 'Pilot Agreement',
  investor: 'Investor Addendum',
  license: 'License'
};

const statusStyles: Record<AgreementStatus, CSSProperties> = {
  active: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  pending: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  draft: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }
};

export default function ContractsPage() {
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [viewingFullTextId, setViewingFullTextId] = useState<string | null>(null);

  const selectedAgreement = useMemo(
    () => agreements.find((agreement) => agreement.id === selectedAgreementId) ?? null,
    [selectedAgreementId]
  );

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', padding: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Contract Management</h2>
      <p style={{ marginBottom: 20, color: '#4b5563' }}>
        Governance-ready legal infrastructure with auditable agreements and downloadable records.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {agreements.map((agreement) => (
          <section
            key={agreement.id}
            style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, cursor: 'pointer' }}
            onClick={() => setSelectedAgreementId((prev) => (prev === agreement.id ? null : agreement.id))}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 6px' }}>{agreement.title}</h3>
                <p style={{ margin: 0, color: '#4b5563' }}>{agreement.description}</p>
                <p style={{ margin: '10px 0 0', color: '#6b7280', fontSize: 12 }}>
                  {typeLabels[agreement.type]} · Updated {agreement.lastUpdated}
                </p>
              </div>
              <span
                style={{
                  ...statusStyles[agreement.status],
                  borderRadius: 999,
                  fontSize: 12,
                  padding: '4px 10px',
                  alignSelf: 'start'
                }}
              >
                {formatStatus(agreement.status)}
              </span>
            </div>

            {selectedAgreement?.id === agreement.id && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <div
                  style={{
                    display: 'grid',
                    gap: 16,
                    gridTemplateColumns: agreement.parties ? '2fr 1fr' : '1fr'
                  }}
                >
                  <div>
                    {agreement.provisions.map((provision) => (
                      <div key={provision.title} style={{ marginBottom: 12 }}>
                        <strong>{provision.title}</strong>
                        <ul style={{ margin: '8px 0 0', color: '#4b5563' }}>
                          {provision.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {agreement.parties ? (
                    <div>
                      <strong>Parties</strong>
                      <ul style={{ margin: '8px 0 0', color: '#4b5563' }}>
                        {agreement.parties.map((party) => (
                          <li key={party}>{party}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setViewingFullTextId((prev) => (prev === agreement.id ? null : agreement.id));
                    }}
                  >
                    {viewingFullTextId === agreement.id ? 'Hide Document' : 'View Document'}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      downloadAgreement(agreement);
                    }}
                  >
                    Download
                  </button>
                </div>

                {viewingFullTextId === agreement.id && agreement.fullText ? (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      marginTop: 12,
                      padding: 12,
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      color: '#374151'
                    }}
                  >
                    {agreement.fullText}
                  </pre>
                ) : null}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
