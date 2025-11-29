import React from 'react';

export default function StageportFacultyPage() {
  return (
    <div>
      <style>{`
        :root {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
          color: #0b1120;
          background: #020617;
        }
        body {
          margin: 0;
          background: radial-gradient(circle at top, #0f172a 0, #020617 55%);
          color: #e5e7eb;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        .page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem 3.5rem;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .logo {
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-mark {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
        }
        nav {
          display: flex;
          gap: 1.5rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 2.5rem;
          align-items: center;
          margin-bottom: 3rem;
        }
        .hero-kicker {
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #a5b4fc;
          margin-bottom: 0.75rem;
        }
        .hero-title {
          font-size: clamp(2.2rem, 3vw, 2.8rem);
          font-weight: 750;
          letter-spacing: 0.02em;
          line-height: 1.1;
          margin-bottom: 0.75rem;
        }
        .hero-highlight {
          color: #f97316;
        }
        .hero-body {
          font-size: 0.98rem;
          color: #e5e7eb;
          max-width: 32rem;
          line-height: 1.5;
          margin-bottom: 1.2rem;
        }
        .hero-sub {
          font-size: 0.82rem;
          color: #9ca3af;
          max-width: 30rem;
          margin-bottom: 1.6rem;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          align-items: center;
          margin-bottom: 1.4rem;
        }
        .btn-primary {
          border-radius: 999px;
          padding: 0.7rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #0b1120;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-secondary {
          border-radius: 999px;
          padding: 0.65rem 1.3rem;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid #4b5563;
          cursor: pointer;
          background: transparent;
          color: #e5e7eb;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-primary span.icon,
        .btn-secondary span.icon {
          font-size: 0.95rem;
        }
        .hero-footnote {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .badge-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 1rem;
        }
        .badge-chip {
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          border: 1px solid #374151;
          background: rgba(15,23,42,0.9);
        }
        .hero-panel {
          border-radius: 18px;
          border: 1px solid #374151;
          background: radial-gradient(circle at top left, #1f2937 0, #020617 70%);
          padding: 1.5rem 1.4rem;
          font-size: 0.82rem;
          color: #e5e7eb;
        }
        .hero-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
        }
        .hero-panel-title {
          font-size: 0.82rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .hero-panel-tag {
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          border: 1px solid #4b5563;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a5b4fc;
        }
        .hero-panel-main {
          font-size: 0.88rem;
          margin-bottom: 0.8rem;
        }
        .hero-panel-main strong {
          color: #facc15;
        }
        .hero-panel-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 0.6rem;
        }
        .hero-panel-metric {
          border-radius: 12px;
          border: 1px solid #334155;
          padding: 0.6rem 0.7rem;
          font-size: 0.78rem;
        }
        .metric-label {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.66rem;
          color: #9ca3af;
          margin-bottom: 0.2rem;
        }
        .metric-value {
          font-size: 0.95rem;
          font-weight: 600;
        }
        .section {
          margin-bottom: 3rem;
        }
        .section-kicker {
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 0.4rem;
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 650;
          margin-bottom: 0.75rem;
        }
        .section-body {
          font-size: 0.9rem;
          color: #d1d5db;
          max-width: 40rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .offers-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.2rem;
        }
        .offer-card {
          border-radius: 16px;
          border: 1px solid #374151;
          background: rgba(15,23,42,0.9);
          padding: 1.2rem 1.1rem 1.3rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .offer-name {
          font-size: 0.95rem;
          font-weight: 600;
        }
        .offer-price {
          font-size: 1.05rem;
          font-weight: 650;
          color: #facc15;
        }
        .offer-tagline {
          font-size: 0.8rem;
          color: #9ca3af;
        }
        .offer-list {
          margin: 0.25rem 0 0.4rem 1rem;
          padding: 0;
          font-size: 0.8rem;
          color: #d1d5db;
        }
        .offer-list li {
          margin-bottom: 0.18rem;
        }
        .offer-cta {
          margin-top: auto;
          padding-top: 0.4rem;
        }
        .offer-cta button {
          width: 100%;
          justify-content: center;
        }
        .footer-note {
          font-size: 0.78rem;
          color: #6b7280;
          border-top: 1px solid #1f2937;
          padding-top: 1.2rem;
          text-align: center;
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .offers-grid {
            grid-template-columns: minmax(0,1fr);
          }
          header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="page">
        <header>
          <div className="logo">
            <div className="logo-mark">SP</div>
            StagePort Systems
          </div>
          <nav>
            <span>Product</span>
            <span>Pricing</span>
            <span>Safety</span>
            <span>Book a Call</span>
          </nav>
        </header>

        <section className="hero">
          <div>
            <div className="hero-kicker">Transparent math • 28-day evolution clock</div>
            <h1 className="hero-title">
              Turn rehearsals into <span className="hero-highlight">credentials</span>,
              tokens and Title&nbsp;IX-ready reports.
            </h1>
            <p className="hero-body">
              StagePort is the operating system for movement-based studios.
              We run every routine through transparent scoring, generate cryptographic
              StageCred reports, and mint tokens that fund scholarships, travel, and leadership.
            </p>
            <p className="hero-sub">
              Under the hood, your studio runs on a 28-day mutation engine:
              every cycle we ship a new module, patch, or reporting upgrade so your
              ledger stays alive, accurate, and impossible to ignore.
            </p>
            <div className="hero-actions">
              <a href="stagecred_demo_url_here" target="_blank" rel="noopener">
                <button className="btn-primary">
                  <span className="icon">📊</span>
                  View Live StageCred Report
                </button>
              </a>
              <a href="#pricing">
                <button className="btn-secondary">
                  <span className="icon">💳</span>
                  See Studio Pricing
                </button>
              </a>
            </div>
            <div className="hero-footnote">
              Designed by a career choreographer & neurolinguistic consultant.
              Built for studios who want receipts, not vibes.
            </div>
            <div className="badge-strip">
              <div className="badge-chip">Clock-28 Evolution Beats™</div>
              <div className="badge-chip">Py.rouette™ TES/PCS/GOE Engine</div>
              <div className="badge-chip">StageCred™ Weekly Reports</div>
              <div className="badge-chip">StageCoin™ Token Economy</div>
              <div className="badge-chip">Director’s Chair OS™ Dashboard</div>
            </div>
          </div>
          <aside className="hero-panel">
            <div className="hero-panel-header">
              <div className="hero-panel-title">Director’s Chair Snapshot</div>
              <div className="hero-panel-tag">Studio OS</div>
            </div>
            <div className="hero-panel-main">
              One console for <strong>students, offers, scores, tokens</strong> and
              safety incidents. Built so a studio owner can see
              <strong>who’s thriving and who needs support</strong> at a glance,
              then evolve the system on a predictable 28-day rhythm.
            </div>
            <div className="hero-panel-metrics">
              <div className="hero-panel-metric">
                <div className="metric-label">This Week</div>
                <div className="metric-value">37 StageCred Reports</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Auto-emailed to parents</div>
              </div>
              <div className="hero-panel-metric">
                <div className="metric-label">Tokens Minted</div>
                <div className="metric-value">612 Stage / 184 Screen</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Scholarships · Travel · Gear</div>
              </div>
              <div className="hero-panel-metric">
                <div className="metric-label">Safety</div>
                <div className="metric-value">0 Open Incidents</div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Title IX view up to date</div>
              </div>
              <div className="hero-panel-metric">
                <div className="metric-label">Pipeline</div>
                <div className="metric-value">6 College-Track Dancers</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Portfolios exporting as PDFs</div>
              </div>
            </div>
          </aside>
        </section>

        <section className="section">
          <div className="section-kicker">Evolution beats</div>
          <div className="section-title">Your studio runs on a 28-day mutation engine.</div>
          <p className="section-body">
            Your body already knows the pattern: attention, build, peak, reset. StagePort
            hooks your studio into the same biological schedule. Not quarterly. Not
            “when things slow down.” Every 28 days, the system pushes a new module,
            patch, or release across your ledger.
          </p>
          <p className="section-body" style={{ marginTop: '-0.75rem' }}>
            That rhythm drives pattern-recognition and endurance instead of burnout.
            Dancers see fresh upgrades. Parents see steady receipts. You see a studio
            that never stagnates, because the clock won’t let it.
          </p>
          <div className="offers-grid" style={{ gap: '0.9rem' }}>
            <div className="offer-card">
              <div className="offer-name">Week 1 – Scan &amp; Score</div>
              <div className="offer-tagline">Baseline the work onstage and in class.</div>
              <ul className="offer-list">
                <li>Upload routines and rehearsals</li>
                <li>Py.rouette engine scores TES/PCS/GOE</li>
                <li>First StageCred reports land in inboxes</li>
              </ul>
            </div>
            <div className="offer-card">
              <div className="offer-name">Week 2 – Ledger &amp; Tokens</div>
              <div className="offer-tagline">Turn effort into something bankable.</div>
              <ul className="offer-list">
                <li>StageCoin rules set for your studio</li>
                <li>Leadership, consistency and artistry earn extra weight</li>
                <li>Parents see how tokens fund scholarships and travel</li>
              </ul>
            </div>
            <div className="offer-card">
              <div className="offer-name">Week 3–4 – Patch &amp; Release</div>
              <div className="offer-tagline">Ship the next evolution beat.</div>
              <ul className="offer-list">
                <li>Adjust rubrics based on what the data shows</li>
                <li>Publish a new report view or parent dashboard tweak</li>
                <li>Lock the cycle, then start the next 28-day pass</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-kicker">The gap</div>
          <div className="section-title">Robotics kids get ecosystems. Dancers get ribbons.</div>
          <p className="section-body">
            In tech and STEM, students collect badges, scores, and credentials that feed real
            pipelines into scholarships, internships, and careers. In dance, cheer, gymnastics
            and performance, most girls get subjective scores, one-night trophies and no ledger.
            StagePort fixes that with transparent scoring, cryptographic StageCred reports and
            a token economy that reinvests back into the students who carry your studio.
          </p>
        </section>

        <section className="section" id="pricing">
          <div className="section-kicker">Pricing</div>
          <div className="section-title">Start small. Scale with your studio.</div>
          <div className="section-body">
            Three offers. No contracts. We start with your existing classes and performances
            and layer StagePort on top.
          </div>
          <div className="offers-grid">
            <div className="offer-card">
              <div className="offer-name">StageCred Personal Ledger</div>
              <div className="offer-price">$19 / month per dancer</div>
              <div className="offer-tagline">For serious students and their parents.</div>
              <ul className="offer-list">
                <li>Weekly StageCred report (TES/PCS/GOE)</li>
                <li>Badges for technique, leadership, effort</li>
                <li>Stage / Screen / Street token earnings</li>
                <li>Downloadable JSON + PDF portfolio pages</li>
              </ul>
              <div className="offer-cta">
                <button className="btn-secondary"><span className="icon">📝</span>Enroll a dancer</button>
              </div>
            </div>
            <div className="offer-card">
              <div className="offer-name">Py.rouette Judging Package</div>
              <div className="offer-price">$249 intro · from $900 / event</div>
              <div className="offer-tagline">Transparent scoring for auditions &amp; shows.</div>
              <ul className="offer-list">
                <li>Custom scoring rubric built on Py.rouette</li>
                <li>Side-by-side routine comparison reports</li>
                <li>Judge notes converted to clean parent-friendly language</li>
                <li>JSON archive for future portfolios and appeals</li>
              </ul>
              <div className="offer-cta">
                <button className="btn-secondary"><span className="icon">📆</span>Book a judging consult</button>
              </div>
            </div>
            <div className="offer-card">
              <div className="offer-name">StagePort Starter OS</div>
              <div className="offer-price">$297 one-time</div>
              <div className="offer-tagline">Your studio’s Director’s Chair in a week.</div>
              <ul className="offer-list">
                <li>People, offers, scores, tokens &amp; safety in one console</li>
                <li>Templates for StageCred, tokens and Title IX log</li>
                <li>Owner training: how to read the ledger in 15 minutes</li>
                <li>Roadmap to expand into franchise or competition mode</li>
              </ul>
              <div className="offer-cta">
                <button className="btn-primary"><span className="icon">🚀</span>Set up my studio OS</button>
              </div>
            </div>
          </div>
        </section>

        <div className="footer-note">
          StagePort Systems™ — designed by a choreographer who got tired of vibes-only scoring.
          Movement deserves math, ledgers and exits too.
        </div>
      </div>
    </div>
  );
}
