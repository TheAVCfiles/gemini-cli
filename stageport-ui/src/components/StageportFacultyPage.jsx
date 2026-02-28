import React, { useEffect, useMemo, useRef, useState } from 'react';
import StageCrest from './StageCrest.jsx';
import operatorLiteracyCredential from '../credentials/operatorLiteracyCredential.js';

const layerData = {
  layer1: {
    title: "Director's Chair OS",
    desc: 'Ledger for people, offers, scores, safety and tokens.',
    specs: {
      input: 'Classes, rehearsals, rosters, incident logs',
      function: 'One console with 28-day mutation clock and receipts',
      status: 'Built & Sellable'
    }
  },
  layer2: {
    title: 'Py.rouette TES/PCS Engine',
    desc: 'Transparent scoring with parent-safe language and JSON exports.',
    specs: {
      input: 'Videos, judge notes, rubric weights',
      function: 'Side-by-side comparisons, TES/PCS/GOE scoring, clean translations',
      status: 'Built for Pilots'
    }
  },
  layer3: {
    title: 'StageCred Marketplace',
    desc: 'Weekly receipts, badges, and portfolios to fund student travel.',
    specs: {
      input: 'Ledger events, token rules, parental preferences',
      function: 'Exports StageCred PDFs/JSON, auto emails, college-ready evidence',
      status: 'Asset · Ready to Sell'
    }
  },
  layer4: {
    title: 'StageCoin Bank',
    desc: 'Token economy for scholarships, travel, gear and leadership.',
    specs: {
      input: 'Attendance, leadership points, safety compliance',
      function: 'Mints Stage/Screen/Street tokens with clear redemption rules',
      status: 'Pilot-ready'
    }
  }
};

const taskItems = [
  { id: 'stagecred', label: 'Wire weekly StageCred email automation' },
  { id: 'titleix', label: 'Validate Title IX incident export and audit trail' },
  { id: 'tokens', label: 'Finalize StageCoin weighting for leadership vs. effort' },
  { id: 'update', label: 'Ship founder weekly update for investors' }
];

const defaultTaskState = taskItems.reduce((acc, item) => {
  acc[item.id] = false;
  return acc;
}, {});

function offlineAiFallback(prompt = '', systemInstruction = '') {
  const p = prompt.toLowerCase();
  if (p.includes('pricing') || p.includes('tier')) {
    return "Starter: $35/mo — basic Director's Chair; Pro: $349/mo — StageCreds + API; Scale: $1,999/mo — SLA + on-prem connectors. Rationale: runway-friendly pricing with clear upgrade paths.";
  }
  if (p.includes('objection')) {
    return 'Acknowledged. I hear the concern. Short reply: pilot the feature with a single class (2 weeks), verify judges and reduce admin by X hours/week. Offer to run a forensic scoring sample for one routine.';
  }
  if (p.includes('analyze') || p.includes('risk')) {
    return 'Top risk: sensor drift & data quality. Opportunity: batch reprocessing + per-studio sharding to scale to 10k users. Mitigation: input validation, local buffer + replay queue for re-scoring.';
  }
  if (p.includes('investor') || p.includes('report')) {
    return "Executive summary: momentum on product velocity, pilot plan (30 studios), and clear ask of $850k for product, pilots, and compliance. Key milestones: Director's Chair MVP, StageCred marketplace.";
  }
  return 'Demo Strategist: This is a demo fallback. For live analysis, connect to the strategy engine. Example output: 1 risk, 1 scalability opportunity, 1 mitigation step.';
}

async function callGemini(prompt, systemInstruction = '') {
  if (!prompt || !prompt.trim()) return 'No prompt provided.';

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system: systemInstruction })
    });

    if (!resp.ok) {
      let errBody = await resp.text();
      try {
        const pj = JSON.parse(errBody);
        errBody = pj.detail || pj.error || JSON.stringify(pj);
      } catch (e) {
        // ignore JSON parse errors
      }
      throw new Error(`Proxy error: ${errBody}`);
    }

    const j = await resp.json();
    return (j.text || '').trim() || offlineAiFallback(prompt, systemInstruction);
  } catch (err) {
    console.warn('Proxy error:', err);
    return offlineAiFallback(prompt, systemInstruction);
  }
}

function formatAiHtml(resultText) {
  const formatted = resultText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\* (.*)/gm, '<li>$1</li>')
    .replace(/^- (.*)/gm, '<li>$1</li>');

  if (formatted.includes('<li>')) {
    return formatted.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  }

  return formatted.replace(/\n/g, '<br>');
}

export default function StageportFacultyPage() {
  const [audienceMode, setAudienceMode] = useState('dance');
  const [selectedLayer, setSelectedLayer] = useState('layer1');
  const [taskState, setTaskState] = useState(defaultTaskState);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const modalTitleRef = useRef(null);
  const lastFocusRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLayer = localStorage.getItem('stageport.selectedLayer');
    if (savedLayer && layerData[savedLayer]) {
      setSelectedLayer(savedLayer);
    }
    const savedTasks = localStorage.getItem('stageport.tasks');
    if (savedTasks) {
      const parsed = JSON.parse(savedTasks);
      setTaskState({ ...defaultTaskState, ...parsed });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('stageport.selectedLayer', selectedLayer);
  }, [selectedLayer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('stageport.tasks', JSON.stringify(taskState));
  }, [taskState]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && aiModalOpen) {
        closeAiModal();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [aiModalOpen]);

  const progress = useMemo(() => {
    const completed = Object.values(taskState).filter(Boolean).length;
    const total = taskItems.length;
    return {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0
    };
  }, [taskState]);

  const closeAiModal = () => {
    setAiModalOpen(false);
    setAiLoading(false);
    setAiContent('');
    const lastFocused = lastFocusRef.current;
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  };

  const runAiAction = async (title, prompt, system) => {
    lastFocusRef.current = document.activeElement;
    setAiTitle(title);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiContent('');

    try {
      const text = await callGemini(prompt, system);
      setAiContent(formatAiHtml(text));
    } catch (err) {
      setAiContent(
        `<p style="color:#fca5a5">AI unavailable — showing fallback.</p><div>${formatAiHtml(offlineAiFallback(prompt, system))}</div>`
      );
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        modalTitleRef.current?.focus();
      }, 60);
    }
  };

  const analyzeLayer = () => {
    const data = layerData[selectedLayer];
    const system = 'You are a seasoned CTO and Product Strategist. Analyze software architecture components for risk and scalability.';
    const prompt = `Analyze this component of the StagePort platform:\n\nComponent: ${data.title}\nDescription: ${data.desc}\nSpecs: ${JSON.stringify(data.specs)}\n\nIdentify:\n1. One critical technical risk.\n2. One scalability opportunity.\nKeep it concise (max 3 bullets).`;
    runAiAction(`Analysis: ${data.title}`, prompt, system);
  };

  const generatePitch = () => {
    const data = layerData[selectedLayer];
    const system = 'You are an expert sales strategist for a B2B SaaS in the performing arts space.';
    const prompt = `Write a short, effective cold email pitch to a dance studio owner selling "${data.title}".\n\nKey Context: ${data.desc}\nKeep it under 150 words.`;
    runAiAction(`Drafting Pitch: ${data.title}`, prompt, system);
  };

  const handleObjection = () => {
    const data = layerData[selectedLayer];
    const system = 'You are a master negotiator and sales coach. Provide a calm 3-sentence rebuttal.';
    const prompt = `I am selling ${data.title}. They said: "We already have a portal for parents."\nGive a concise, persuasive 3-sentence response.`;
    runAiAction(`Handling Objection: ${data.title}`, prompt, system);
  };

  const generatePricingModel = () => {
    const data = layerData[selectedLayer];
    const system = 'You are a SaaS Pricing Expert. Suggest a 3-tier pricing model.';
    const prompt = `Suggest Starter/Pro/Scale pricing for ${data.title} (StagePort module). Output format: - Tier: Price - rationale.`;
    runAiAction(`Pricing Strategy: ${data.title}`, prompt, system);
  };

  const generateInvestorUpdate = () => {
    const completed = taskItems
      .filter((item) => taskState[item.id])
      .map((item) => item.label);
    const pending = taskItems
      .filter((item) => !taskState[item.id])
      .map((item) => item.label);
    const percent = progress.percent;
    const system = 'You are a founder writing a 1-paragraph update.';
    const prompt = `Weekly update. Completion ${percent}%. Completed: ${completed.join(', ')}. Next: ${pending.slice(0, 2).join(', ')}.`;
    runAiAction('Generating Weekly Report', prompt, system);
  };

  const copyToClipboard = async () => {
    const plainText = aiContent.replace(/<[^>]+>/g, ' ');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = plainText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      alert('Copied to clipboard');
    } catch (err) {
      alert('Copy failed — please select & copy manually');
    }
  };

  const downloadAiReport = (filename = 'stageport_report.md') => {
    const plainText = aiContent.replace(/<[^>]+>/g, ' ');
    const blob = new Blob([plainText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const activeLayer = layerData[selectedLayer];

  const heroContent = audienceMode === 'dance'
    ? {
        kicker: 'BUILT FOR MOVERS · BY A MOVER',
        title: 'Your movement is the product. We built the math to prove it.',
        body:
          'Every rehearsal, every class, every performance generates data that disappears the moment it ends. StagePort captures it — transparent scoring, cryptographic proof, and tokens that turn your artistry into credentials, scholarships, and leverage.',
        sub:
          'Designed by a career choreographer who got tired of vibes-only scoring. Built for the people who carry studios on their bodies.',
        primaryCta: 'See What Your Studio Generates',
        secondaryCta: 'View Pricing',
        context: 'Designed by a career choreographer who got tired of vibes-only scoring. Built for the people who carry studios on their bodies.'
      }
    : {
        kicker: 'KINETIC INTELLIGENCE · GOVERNANCE INFRASTRUCTURE',
        title: "All the world's a stage. We built the operating system for what moves inside it.",
        body:
          "Kinetic intelligence — the embodied labor of dancers, salespeople, operators, and physical workers — generates value that traditional systems can't measure. StagePort translates movement into algorithms, governance into infrastructure, and contribution into proof.",
        sub:
          "Rockettes kicklines. Rockefeller's railways. Not so disconnected. The same kinetic principles that power elite performance power elite governance.",
        primaryCta: 'Explore the Framework',
        secondaryCta: 'See Governance Pricing',
        context: "Rockettes kicklines. Rockefeller's railways. Not so disconnected. The same kinetic principles that power elite performance power elite governance."
      };

  const evolutionContent = audienceMode === 'dance'
    ? {
        title: 'Your studio runs on a 28-day mutation engine.',
        body1:
          'Your body already knows the pattern: attention, build, peak, reset. StagePort hooks your studio into the same biological schedule. Not quarterly. Not “when things slow down.” Every 28 days, the system pushes a new module, patch, or release across your ledger.',
        body2:
          'That rhythm drives pattern-recognition and endurance instead of burnout. Dancers see fresh upgrades. Parents see steady receipts. You see a studio that never stagnates, because the clock won’t let it.',
        week1Title: 'Week 1 – Scan & Score',
        week1Tagline: 'Baseline the work onstage and in class.',
        week1Bullets: [
          'Upload routines and rehearsals',
          'Py.rouette engine scores TES/PCS/GOE',
          'First StageCred reports land in inboxes'
        ],
        week2Title: 'Week 2 – Ledger & Tokens',
        week2Tagline: 'Turn effort into something bankable.',
        week2Bullets: [
          'StageCoin rules set for your studio',
          'Leadership, consistency and artistry earn extra weight',
          'Parents see how tokens fund scholarships and travel'
        ],
        week34Title: 'Week 3–4 – Patch & Release',
        week34Tagline: 'Ship the next evolution beat.',
        week34Bullets: [
          'Adjust rubrics based on what the data shows',
          'Publish a new report view or parent dashboard tweak',
          'Lock the cycle, then start the next 28-day pass'
        ]
      }
    : {
        title: 'Your operation runs on a 28-day evolution engine.',
        body1:
          'Every organization has a rhythm: attention, build, peak, reset. StagePort hooks your operation into the same predictable mutation cycle. Every 28 days, the system pushes a new module, patch, or governance upgrade across your ledger.',
        body2: '',
        week1Title: 'Week 1 – Baseline & Score',
        week1Tagline: 'Map kinetic workflows, score contribution patterns, generate first-cycle reports.',
        week1Bullets: [
          'Map kinetic workflows across teams and territories',
          'Score contribution patterns with transparent governance logic',
          'Generate first-cycle reports for operator visibility'
        ],
        week2Title: 'Week 2 – Ledger & Tokens',
        week2Tagline: 'Set governance rules, then translate effort into credentials.',
        week2Bullets: [
          'Set governance rules for consistency, leadership, and velocity',
          'Weight leadership and consistency against measurable outcomes',
          'Translate embodied effort into bankable credentials'
        ],
        week34Title: 'Week 3-4 – Patch & Release',
        week34Tagline: 'Publish governance views and launch the next pass.',
        week34Bullets: [
          'Adjust scoring based on new cycle data',
          'Publish governance views for teams and stakeholders',
          'Lock the cycle and start the next 28-day pass'
        ]
      };

  const gapContent = audienceMode === 'dance'
    ? {
        title: 'Robotics kids get ecosystems. Dancers get ribbons.',
        body:
          'In tech and STEM, students collect badges, scores, and credentials that feed real pipelines into scholarships, internships, and careers. In dance, cheer, gymnastics and performance, most girls get subjective scores, one-night trophies and no ledger. StagePort fixes that with transparent scoring, cryptographic StageCred reports and a token economy that reinvests back into the students who carry your studio.',
        quote: 'Movement deserves math. Ledgers and exits too.'
      }
    : {
        title: 'Every kinetic worker builds the stage. Almost none of them own the math.',
        body:
          'In tech, process is documented, scored, and credentialed. In movement-based industries — dance, sales, construction, logistics, performance — contribution stays verbal, subjective, and disposable. StagePort fixes that with transparent scoring, cryptographic records, and a token economy that reinvests back into the people who move.',
        quote: 'Putting the business back into show business.'
      };

  const credentialPreview = useMemo(() => {
    const svgPreview = operatorLiteracyCredential.credential.visual_archetype.visual_asset.svg
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140);

    return {
      ...operatorLiteracyCredential.credential,
      visual_archetype: {
        ...operatorLiteracyCredential.credential.visual_archetype,
        visual_asset: {
          ...operatorLiteracyCredential.credential.visual_archetype.visual_asset,
          svg: `${svgPreview}…`
        }
      }
    };
  }, []);

  return (
    <div>
      <style>{`
        :root {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
          color: #1b1613;
          background: #13100d;
        }
        body {
          margin: 0;
          background: radial-gradient(circle at top, #2a211b 0, #13100d 55%);
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
        .audience-toggle {
          background: rgba(29, 23, 20, 0.7);
          border: 1px solid rgba(96, 76, 64, 0.45);
          border-radius: 999px;
          display: inline-flex;
          padding: 0.2rem;
          margin-bottom: 0.8rem;
          gap: 0.2rem;
        }
        .audience-segment {
          border: none;
          border-radius: 999px;
          padding: 0.38rem 0.86rem;
          background: transparent;
          color: #b8a38f;
          letter-spacing: 0.08em;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .audience-segment.active {
          background: rgba(250, 204, 21, 0.15);
          color: #facc15;
          font-weight: 700;
        }
        .hero-kicker {
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #facc15;
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
          border: 1px solid #4a3f37;
          cursor: pointer;
          background: #1a1512;
          color: #e5e7eb;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .btn-secondary:hover,
        .btn-primary:hover {
          opacity: 0.92;
        }
        .icon {
          font-size: 1rem;
        }
        .hero-footnote {
          font-size: 0.82rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }
        .badge-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1.2rem;
        }
        .badge-chip {
          padding: 0.45rem 0.75rem;
          background: #1d1714;
          border-radius: 999px;
          border: 1px solid #3b322c;
          font-size: 0.8rem;
          color: #e8ddcf;
        }
        .crest-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }
        .crest-card {
          background: #1d1714;
          border: 1px solid #3b322c;
          border-radius: 16px;
          padding: 1rem 1.1rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        }
        .crest-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.6rem;
        }
        .crest-card-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }
        .crest-chip {
          font-size: 0.75rem;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          border: 1px solid #7c5a2a;
          color: #f6ddb3;
          background: rgba(202, 138, 4, 0.18);
          white-space: nowrap;
        }
        .crest-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .stagecrest-wrapper svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .crest-legend {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.55rem;
        }
        .crest-pill {
          padding: 0.6rem 0.7rem;
          border-radius: 12px;
          border: 1px solid #3b322c;
          background: #241d18;
          font-size: 0.85rem;
          color: #d1d5db;
        }
        .crest-pill small {
          display: block;
          color: #9ca3af;
          margin-top: 0.15rem;
          font-size: 0.75rem;
        }
        .crest-json {
          background: #241d18;
          border: 1px solid #3b322c;
          border-radius: 12px;
          padding: 0.8rem;
          overflow: auto;
          max-height: 320px;
          color: #e5e7eb;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .crest-note {
          color: #9ca3af;
          font-size: 0.86rem;
          margin-top: 0.5rem;
        }
        .hero-panel {
          background: #1d1714;
          border: 1px solid #3b322c;
          padding: 1.25rem;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        }
        .hero-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .hero-panel-title {
          font-weight: 700;
          font-size: 1.05rem;
        }
        .hero-panel-tag {
          font-size: 0.75rem;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          border: 1px solid #7c5a2a;
          color: #f6ddb3;
          background: rgba(79, 70, 229, 0.15);
        }
        .hero-panel-main {
          font-size: 0.92rem;
          color: #d1d5db;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .hero-panel-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .hero-panel-metric {
          padding: 0.85rem;
          background: #241d18;
          border-radius: 12px;
          border: 1px solid #3b322c;
        }
        .metric-label {
          color: #9ca3af;
          font-size: 0.78rem;
          margin-bottom: 0.2rem;
        }
        .metric-value {
          font-weight: 700;
          font-size: 0.98rem;
        }
        .section {
          margin: 2.5rem 0;
        }
        .section-kicker {
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #e4c18a;
          margin-bottom: 0.35rem;
        }
        .section-title {
          font-size: 1.6rem;
          font-weight: 720;
          margin-bottom: 0.7rem;
          color: #e5e7eb;
        }
        .section-body {
          font-size: 0.96rem;
          color: #d1d5db;
          line-height: 1.55;
          max-width: 920px;
        }
        .offers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.1rem;
          margin-top: 1.1rem;
        }
        .offer-card {
          background: #1d1714;
          border: 1px solid #3b322c;
          border-radius: 14px;
          padding: 1rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-height: 210px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .offer-name {
          font-weight: 700;
        }
        .offer-price {
          color: #fbbf24;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .offer-tagline {
          color: #9ca3af;
          font-size: 0.9rem;
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
        .ai-workbench {
          background: #1d1714;
          border: 1px solid #3b322c;
          padding: 1.5rem;
          border-radius: 18px;
          box-shadow: 0 15px 60px rgba(0,0,0,0.35);
        }
        .workbench-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .workbench-head h3 {
          margin: 0;
          font-size: 1.15rem;
          letter-spacing: 0.01em;
        }
        .workbench-sub {
          color: #9ca3af;
          font-size: 0.9rem;
          margin: 0.3rem 0 0;
        }
        .stack-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: 1rem;
        }
        .layer-card {
          background: #241d18;
          border: 1px solid #3b322c;
          border-radius: 12px;
          padding: 0.9rem 1rem;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease;
          outline: none;
        }
        .layer-card:hover,
        .layer-card:focus {
          border-color: #6366f1;
          transform: translateY(-1px);
        }
        .layer-card.active {
          border-color: #f97316;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.15);
        }
        .layer-card h4 {
          margin: 0 0 0.15rem 0;
          font-size: 1rem;
        }
        .layer-card p {
          margin: 0;
          color: #e4c18a;
          font-size: 0.88rem;
        }
        .layer-details {
          background: #241d18;
          border: 1px solid #3b322c;
          border-radius: 14px;
          padding: 1rem 1.1rem;
          min-height: 220px;
        }
        .detail-title {
          margin: 0;
          font-size: 1.05rem;
        }
        .detail-desc {
          color: #9ca3af;
          margin: 0.35rem 0 0.7rem;
          line-height: 1.45;
        }
        .spec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.55rem;
        }
        .spec-pill {
          padding: 0.7rem 0.8rem;
          border-radius: 10px;
          background: #1d1714;
          border: 1px solid #3b322c;
          font-size: 0.88rem;
        }
        .spec-label {
          display: block;
          color: #9ca3af;
          font-size: 0.76rem;
          margin-bottom: 0.2rem;
        }
        .status-good {
          color: #22c55e;
          border-color: #15803d;
          background: rgba(34, 197, 94, 0.08);
        }
        .status-asset {
          color: #c084fc;
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.1);
        }
        .ai-actions {
          margin-top: 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.6rem;
        }
        .ai-action-btn {
          padding: 0.75rem 0.9rem;
          border-radius: 12px;
          border: 1px solid #3b322c;
          background: #1d1714;
          color: #e5e7eb;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .ai-action-btn:hover,
        .ai-action-btn:focus {
          transform: translateY(-1px);
          border-color: #6366f1;
        }
        .task-panel {
          background: #241d18;
          border: 1px solid #3b322c;
          border-radius: 14px;
          padding: 1rem;
        }
        .task-list {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .task-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
        }
        .task-item input {
          accent-color: #f97316;
          width: 17px;
          height: 17px;
        }
        .progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.7rem;
        }
        .progress-track {
          background: #1d1714;
          border: 1px solid #3b322c;
          border-radius: 999px;
          width: 100%;
          height: 10px;
          overflow: hidden;
        }
        .progress-fill {
          background: linear-gradient(135deg, #f97316, #facc15);
          height: 100%;
          border-radius: 999px;
          transition: width 0.25s ease;
        }
        .progress-label {
          font-size: 0.85rem;
          color: #cbd5e1;
        }
        .ai-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
          z-index: 50;
          padding: 1rem;
        }
        .ai-modal {
          background: #1d1714;
          border: 1px solid #3b322c;
          border-radius: 16px;
          max-width: 680px;
          width: 100%;
          box-shadow: 0 25px 80px rgba(0,0,0,0.45);
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        .ai-modal header {
          padding: 1rem 1.2rem 0.4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.6rem;
        }
        .ai-modal h3 {
          margin: 0;
          font-size: 1rem;
        }
        .ai-modal-body {
          padding: 0.6rem 1.2rem 1rem;
          overflow: auto;
        }
        .ai-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem 1rem;
        }
        .ai-support-btn {
          border-radius: 10px;
          padding: 0.55rem 0.9rem;
          border: 1px solid #3b322c;
          background: #241d18;
          color: #e5e7eb;
          cursor: pointer;
        }
        .ai-support-btn:hover,
        .ai-support-btn:focus {
          border-color: #6366f1;
        }
        .ai-loading {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #cbd5e1;
          font-size: 0.9rem;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid #3b322c;
          border-top-color: #f97316;
          border-radius: 999px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ai-content {
          font-size: 0.95rem;
          color: #e5e7eb;
          line-height: 1.5;
        }
        .ai-content ul {
          padding-left: 1.2rem;
        }
        .footer-note {
          font-size: 0.78rem;
          color: #6b7280;
          border-top: 1px solid #3b322c;
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
          .crest-grid {
            grid-template-columns: minmax(0,1fr);
          }
          header {
            flex-direction: column;
            align-items: flex-start;
          }
          .stack-grid {
            grid-template-columns: minmax(0,1fr);
          }
          .ai-modal {
            max-height: 90vh;
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
            <div className="audience-toggle" role="tablist" aria-label="Audience mode toggle">
              <button
                type="button"
                data-testid="toggle-audience-dance"
                className={`audience-segment ${audienceMode === 'dance' ? 'active' : ''}`}
                onClick={() => setAudienceMode('dance')}
              >
                DANCE
              </button>
              <button
                type="button"
                data-testid="toggle-audience-pivot"
                className={`audience-segment ${audienceMode === 'pivot' ? 'active' : ''}`}
                onClick={() => setAudienceMode('pivot')}
              >
                PIVOT
              </button>
            </div>
            <div className="hero-kicker">{heroContent.kicker}</div>
            <h1 className="hero-title">
              {heroContent.title}
            </h1>
            <p className="hero-body">
              {heroContent.body}
            </p>
            <p className="hero-sub">{heroContent.sub}</p>
            <div className="hero-actions">
              <a href="/token-economy">
                <button className="btn-primary">
                  <span className="icon">📊</span>
                  {heroContent.primaryCta}
                </button>
              </a>
              <a href="#pricing">
                <button className="btn-secondary">
                  <span className="icon">💳</span>
                  {heroContent.secondaryCta}
                </button>
              </a>
            </div>
            <div className="hero-footnote">{heroContent.context}</div>
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
              <strong> who’s thriving and who needs support</strong> at a glance,
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

        <section className="section" id="operator-literacy">
          <div className="section-kicker">Operator Literacy crest</div>
          <div className="section-title">Ceremonial seal + notarized halo</div>
          <p className="section-body crest-note">
            The crest packages the Operator Literacy v1 credential into a reusable badge. Inline SVG keeps the notarized halo
            animation, and the JSON credential below includes the full SVG so you can mint it directly into the memnode stack.
          </p>
          <div className="crest-grid">
            <div className="crest-card">
              <div className="crest-card-head">
                <p className="crest-card-title">Badge states</p>
                <span className="crest-chip">Halo notarizes on mint</span>
              </div>
              <div className="crest-row" role="group" aria-label="Crest badge states">
                <StageCrest state="inactive" ariaLabel="Operator crest inactive" />
                <StageCrest state="active" ariaLabel="Operator crest active" />
                <StageCrest state="notarized" ariaLabel="Operator crest notarized" />
              </div>
              <div className="crest-legend">
                <div className="crest-pill">
                  Inactive
                  <small>Muted ring and glyph; no motion for low-priority lists.</small>
                </div>
                <div className="crest-pill">
                  Active
                  <small>Full palette + Motherboard Green glyph. Hover/press micro-motion lives in CSS.</small>
                </div>
                <div className="crest-pill">
                  Notarized
                  <small>Glow + rotating halo + star pulse. Best for minted/verified badges.</small>
                </div>
              </div>
            </div>
            <div className="crest-card">
              <div className="crest-card-head">
                <p className="crest-card-title">Operator Literacy v1 credential</p>
                <span className="crest-chip">Inline SVG attached</span>
              </div>
              <pre className="crest-json" aria-label="Operator Literacy credential JSON">
                {JSON.stringify(credentialPreview, null, 2)}
              </pre>
              <div className="crest-note">
                Full payload retains the notarized halo animation. Swap state via class name (state--inactive | state--active |
                state--notarized) on the crest root.
              </div>
            </div>
          </div>
        </section>

        <section className="section ai-workbench" id="stack">
          <div className="workbench-head">
            <div>
              <h3>Director’s Chair Workbench</h3>
              <p className="workbench-sub">
                Persisted selections, local task tracking, and AI assistance backed by the secure /api/generate proxy.
              </p>
            </div>
            <div className="progress-label">{progress.completed} / {progress.total} tasks</div>
          </div>
          <div className="stack-grid">
            <div>
              <div className="offers-grid" style={{ gap: '0.75rem' }}>
                {Object.entries(layerData).map(([key, data]) => (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedLayer === key}
                    className={`layer-card ${selectedLayer === key ? 'active' : ''}`}
                    data-layer={key}
                    onClick={() => setSelectedLayer(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedLayer(key);
                      }
                    }}
                  >
                    <h4>{data.title}</h4>
                    <p>{data.desc}</p>
                  </div>
                ))}
              </div>
              <div className="layer-details" id="layer-details">
                <h4 className="detail-title" id="detail-title">
                  {activeLayer.title}
                </h4>
                <p className="detail-desc" id="detail-desc">
                  {activeLayer.desc}
                </p>
                <div className="spec-grid" id="detail-specs">
                  <div className="spec-pill">
                    <span className="spec-label">Input</span>
                    <span id="spec-input">{activeLayer.specs.input}</span>
                  </div>
                  <div className="spec-pill">
                    <span className="spec-label">Function</span>
                    <span id="spec-function">{activeLayer.specs.function}</span>
                  </div>
                  <div
                    className={`spec-pill ${activeLayer.specs.status.includes('Sell') || activeLayer.specs.status.includes('Built') ? 'status-good' : 'status-asset'}`}
                  >
                    <span className="spec-label">Status</span>
                    <span id="spec-status">{activeLayer.specs.status}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="task-panel">
              <div className="progress-row">
                <div className="progress-label">Local tasks</div>
                <div className="progress-label">{progress.percent}%</div>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
              </div>
              <ul className="task-list">
                {taskItems.map((task) => (
                  <li key={task.id} className="task-item">
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      data-task={task.id}
                      checked={taskState[task.id]}
                      onChange={(e) =>
                        setTaskState({ ...taskState, [task.id]: e.target.checked })
                      }
                    />
                    <span>{task.label}</span>
                  </li>
                ))}
              </ul>
              <div className="ai-actions">
                <button className="ai-action-btn" onClick={analyzeLayer} aria-label="Analyze current layer">
                  <span className="icon">🧭</span>
                  Analyze risk & scale
                </button>
                <button className="ai-action-btn" onClick={generatePitch} aria-label="Generate pitch copy">
                  <span className="icon">✉️</span>
                  Draft pitch email
                </button>
                <button className="ai-action-btn" onClick={handleObjection} aria-label="Handle objection">
                  <span className="icon">🛡️</span>
                  Handle objection
                </button>
                <button className="ai-action-btn" onClick={generatePricingModel} aria-label="Generate pricing">
                  <span className="icon">💸</span>
                  3-tier pricing
                </button>
                <button className="ai-action-btn" onClick={generateInvestorUpdate} aria-label="Generate investor update">
                  <span className="icon">📜</span>
                  Weekly investor update
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-kicker">Evolution beats</div>
          <div className="section-title">{evolutionContent.title}</div>
          <p className="section-body">
            {evolutionContent.body1}
          </p>
          {evolutionContent.body2 && <p className="section-body" style={{ marginTop: '-0.75rem' }}>{evolutionContent.body2}</p>}
          <div className="offers-grid" style={{ gap: '0.9rem' }}>
            <div className="offer-card">
              <div className="offer-name">{evolutionContent.week1Title}</div>
              <div className="offer-tagline">{evolutionContent.week1Tagline}</div>
              <ul className="offer-list">
                {evolutionContent.week1Bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="offer-card">
              <div className="offer-name">{evolutionContent.week2Title}</div>
              <div className="offer-tagline">{evolutionContent.week2Tagline}</div>
              <ul className="offer-list">
                {evolutionContent.week2Bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="offer-card">
              <div className="offer-name">{evolutionContent.week34Title}</div>
              <div className="offer-tagline">{evolutionContent.week34Tagline}</div>
              <ul className="offer-list">
                {evolutionContent.week34Bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-kicker">The gap</div>
          <div className="section-title">{gapContent.title}</div>
          <p className="section-body">
            {gapContent.body}
          </p>
          <p className="section-body" style={{ marginTop: '-0.65rem', fontStyle: 'italic' }}>{gapContent.quote}</p>
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

      {aiModalOpen && (
        <div className="ai-modal-backdrop" role="presentation">
          <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
            <header>
              <h3 id="ai-modal-title" ref={modalTitleRef} tabIndex={-1}>
                {aiTitle}
              </h3>
              <button className="ai-support-btn" onClick={closeAiModal} aria-label="Close modal">
                Close
              </button>
            </header>
            <div className="ai-modal-body">
              {aiLoading ? (
                <div className="ai-loading">
                  <span className="spinner" aria-hidden="true" /> Loading secure proxy…
                </div>
              ) : (
                <div className="ai-content" id="ai-content" dangerouslySetInnerHTML={{ __html: aiContent }} />
              )}
            </div>
            <div className="ai-modal-footer">
              <button className="ai-support-btn" onClick={copyToClipboard} disabled={aiLoading}>
                Copy
              </button>
              <button className="ai-support-btn" onClick={() => downloadAiReport()} disabled={aiLoading}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
