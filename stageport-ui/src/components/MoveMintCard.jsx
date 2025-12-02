import React from 'react';

/**
 * MoveMintCard.jsx
 * 
 * MoveMint™ – Minted Moves Ledger component.
 * Tracks class attendance, rehearsals, and reps minted into a studio's ledger.
 * Integrates with StageCred scores, badges, and StageCoin earnings.
 */

const styles = {
  card: {
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '16px',
    padding: '1.5rem',
    maxWidth: '550px',
    margin: '0 auto',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '0.25rem',
  },
  tagline: {
    color: '#9ca3af',
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
  list: {
    margin: '0 0 1.5rem 0',
    paddingLeft: '1.5rem',
    color: '#d1d5db',
    fontSize: '0.9rem',
    lineHeight: '1.8',
  },
  metricsContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  metric: {
    flex: 1,
    background: '#111827',
    padding: '1rem',
    borderRadius: '8px',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  metricValue: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#ffffff',
    marginTop: '0.25rem',
  },
  metricNote: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  },
  ctaContainer: {
    textAlign: 'center',
  },
  button: {
    padding: '0.75rem 1.25rem',
    background: '#d97706',
    color: '#000000',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};

function Metric({ label, value, note }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricNote}>{note}</div>
    </div>
  );
}

export default function MoveMintCard() {
  return (
    <section role="region" style={styles.card} aria-labelledby="movemint-title">
      <h2 id="movemint-title" style={styles.title}>
        MoveMint™ – Minted Moves Ledger
      </h2>

      <p style={styles.tagline}>
        Every class, rehearsal, and rep minted into your studio's ledger.
      </p>

      <ul style={styles.list}>
        <li>Auto-mints attendance + routine metadata as MoveMint events</li>
        <li>Feeds StageCred scores, badges, and StageCoin earnings</li>
        <li>Exports JSON + PDF "mint statements" for parents and auditors</li>
        <li>Director's Chair OS integration – zero extra admin clicks</li>
      </ul>

      <div style={styles.metricsContainer}>
        <Metric
          label="This Week"
          value="184 Minted Moves"
          note="Logged across 6 classes"
        />
        <Metric
          label="Ledger Coverage"
          value="92%"
          note="Of enrolled StageCred dancers"
        />
      </div>

      <div style={styles.ctaContainer}>
        <button
          type="button"
          style={styles.button}
          aria-label="Enable MoveMint attendance tracking for your dance studio"
        >
          <span aria-hidden="true">✨</span>
          Enable MoveMint in my studio
        </button>
      </div>
    </section>
  );
}
