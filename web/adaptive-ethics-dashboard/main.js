import React, { useMemo, useState } from 'https://esm.sh/react@18.3.1?dev';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?dev';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
} from 'https://esm.sh/chart.js@4.4.7';
import { Doughnut, Line } from 'https://esm.sh/react-chartjs-2@5.2.0';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler);

const VAR = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const KEY_CONCEPTS = [
  {
    name: 'Cunning Mercy Posture',
    description: "The system's defensive, capital preservation priority posture.",
  },
  {
    name: 'Adaptive Ethics',
    description: 'The governance framework allowing systems to move with complexity.',
  },
  {
    name: 'Glissé Engine',
    description: 'The core trading system designed to translate emotion into executable precision.',
  },
  {
    name: 'Temporal Inversion Operator',
    description: "The mechanism in the Glissé Engine based on kinesthetic cognition.",
  },
];

const TRANSLATIONS = {
  'Cunning Mercy Posture': {
    poetic:
      'The portfolio leans into a deep plié, one heel anchored and the other tracing circles in the dust.\nMercy is the hinge—patience holding back the strike until the partner commits.\nTo spectators it looks like stillness, but every tendon is coiled to guard the capital body.',
    technical:
      'Implements a three-tier capital defense: (1) rolling value-at-risk caps tied to intraday liquidity, (2) adaptive drawdown throttles that taper order size after two consecutive variance breaches, and (3) conditional re-entry bands synced to cross-validated confirmation scores.',
  },
  'Adaptive Ethics': {
    poetic:
      'A rotating council of stewards tunes the choreography.\nEach rule is a lantern passed hand to hand so the stage never goes dark.\nThe ethic bends without breaking, matching tempo with whatever storm the market plays.',
    technical:
      'Applies a layered policy engine: baseline compliance templates, context-aware overrides driven by monitoring signals, and immutable audit frames that log every override path for review. Policies refresh nightly against latest scenario stressors.',
  },
  'Glissé Engine': {
    poetic:
      'Signals glide like a dancer’s trailing silk—emotion translated into velocity.\nMomentum becomes breath, compression becomes lift.\nThe engine listens for the heartbeat beneath noise and turns it into deliberate motion.',
    technical:
      'Uses a sensor-fusion stack combining order-book microstructure, sentiment volatility, and kinesthetic telemetry proxies. Sequence models output conviction scores that gate execution into micro-batches with latency-aware hedging.',
  },
  'Temporal Inversion Operator': {
    poetic:
      'Time pirouettes backwards for a measure.\nWe preview the landing before the leap, tracing the arc in reverse so the present can choose wisely.\nThe dancer memorizes tomorrow’s balance and brings it back to now.',
    technical:
      'Runs counterfactual rollouts across mirrored timelines using delay-embedded features. The operator scores trajectories on stability and compliance slack, then surfaces only those that preserve risk tolerances under inverted sequencing.',
  },
};

const DEFAULT_NARRATIVE =
  'Both systems show parallel logic: cautious defense in markets mirrors strong artistic presence but restrained execution. Market equals a cautious jeté, waiting for confirmation. Art equals elegant performance, but timing gaps reduce scoring. Narrative: Hold back until confirmation is absolute.';

function Dashboard() {
  const [concept, setConcept] = useState('');
  const [poetic, setPoetic] = useState('');
  const [technical, setTechnical] = useState('');
  const [tError, setTError] = useState(null);
  const [narrating, setNarrating] = useState(false);

  const confirmed = [0.0302, 0.0521, 0.0718];
  const unconfirmed = [0.0112, 0.0535, 0.0892];
  const confirmed90 = (confirmed[2] * 100).toFixed(2);
  const unconfirmed90 = (unconfirmed[2] * 100).toFixed(2);

  const doughnutData = useMemo(
    () => ({
      labels: [`Confirmed (${confirmed90}%)`, `Unconfirmed (${unconfirmed90}%)`],
      datasets: [
        {
          label: 'R_90d Return (%)',
          data: [Number(confirmed90), Number(unconfirmed90)],
          backgroundColor: [VAR('--rose', '#CF8DA6'), '#E5E5E5'],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    }),
    [confirmed90, unconfirmed90],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: VAR('--ink', '#101014'), font: { size: 12 } },
        },
        title: {
          display: true,
          text: 'R_90d Split (Absolute %)',
          color: VAR('--ink', '#101014'),
          font: { size: 14, weight: 'bold' },
        },
      },
    }),
    [],
  );

  const lineLabels = ['2020-07', '2021-01', '2021-07', '2022-01', '2022-07', '2023-01', '2023-07', '2024-01'];
  const lineData = useMemo(
    () => ({
      labels: lineLabels,
      datasets: [
        {
          label: 'Strategy (Confirmed Weight)',
          data: [25, 30, 35, 38, 42, 45, 55, 65],
          borderColor: VAR('--rose', '#CF8DA6'),
          backgroundColor: 'rgba(207,141,166,0.2)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Benchmark (Equity/Value)',
          data: [20, 28, 38, 45, 40, 50, 60, 75],
          borderColor: VAR('--border', '#202338'),
          backgroundColor: 'rgba(32,35,56,0.1)',
          borderWidth: 1,
          pointRadius: 3,
          tension: 0.3,
          fill: false,
        },
      ],
    }),
    [],
  );

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Equity / Value', color: VAR('--ink', '#101014') },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          title: { display: true, text: 'Date', color: VAR('--ink', '#101014') },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { position: 'top', labels: { color: VAR('--ink', '#101014') } },
        tooltip: { mode: 'index', intersect: false },
      },
    }),
    [],
  );

  function handleTranslate() {
    setTError(null);
    setPoetic('');
    setTechnical('');
    if (!concept) {
      setTError('Select a concept first.');
      return;
    }

    const translation = TRANSLATIONS[concept] || TRANSLATIONS[concept.trim()];
    if (!translation) {
      setTError('Translation not yet prepared.');
      return;
    }

    setPoetic(translation.poetic);
    setTechnical(translation.technical);
  }

  function handleNarrate() {
    if (narrating) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setNarrating(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Narration is not supported in this browser.');
      return;
    }

    setNarrating(true);
    const utterance = new SpeechSynthesisUtterance(DEFAULT_NARRATIVE);
    utterance.onend = () => setNarrating(false);
    utterance.onerror = () => {
      setNarrating(false);
      alert('Could not generate audio. Try again.');
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ivory)', color: 'var(--ink)' }}>
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'white', padding: '28px 0 12px' }}>
        <div className="container mx-auto px-4">
          <h1 className="text-[28px] font-bold" style={{ color: 'var(--rose)' }}>
            Adaptive Ethics: From Vision to Verification
          </h1>
          <p className="text-[13px] text-[#545760]">Investor & Critic Response Live Metrics & Roadmap (2025)</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-[1200px]">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Core Thesis: Intelligence as Care</h2>
          <p className="text-gray-700">
            This report verifies the adaptive ethical framework that transforms poetic theory into quantitative proof. The system,
            based on the Glissé Engine, uses a dual-layer explainability model to align financial precision with ethical restraint,
            ensuring the model&apos;s complexity moves with the market&apos;s &lsquo;dance&rsquo; rather than flattening it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card border rounded-xl p-5 flex flex-col" style={{ borderColor: 'var(--border)', background: 'white' }}>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Quant Snapshot (Selected Metrics)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Risk-adjusted returns for 30, 60, and 90-day horizons, segmented by the system&apos;s internal confirmation status.
            </p>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Is Confirmed</th>
                  <th className="py-2">R_30d</th>
                  <th className="py-2">R_60d</th>
                  <th className="py-2">R_90d</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Unconfirmed</td>
                  <td className="py-2 text-rose-600">1.12%</td>
                  <td className="py-2 text-rose-600">5.35%</td>
                  <td className="py-2 text-rose-600">8.92%</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Confirmed</td>
                  <td className="py-2 font-semibold text-rose-800">3.02%</td>
                  <td className="py-2 font-semibold text-rose-800">5.21%</td>
                  <td className="py-2 font-semibold text-rose-800">7.18%</td>
                </tr>
              </tbody>
            </table>
            <div className="h-[320px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          <div className="card md:col-span-2 border rounded-xl p-5 flex flex-col" style={{ borderColor: 'var(--border)', background: 'white' }}>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Equity Curve Overlay (Strategy vs Benchmarks)</h3>
            <p className="text-sm text-gray-600 mb-4">
              24-month backtest comparing the Glissé Engine&apos;s strategy (Confirmed Weight) against a Value/Equity composite (2020-07 to 2024-01).
            </p>
            <div className="h-[350px]">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          <div className="card md:col-span-3 border rounded-xl p-5" style={{ borderColor: 'var(--border)', background: 'white' }}>
            <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'var(--rose)' }}>
              ✨ Rosetta Translator Console
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Bridge poetic concepts ↔ technical mandates via Gemini.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select a Core Concept:</label>
                <select
                  value={concept}
                  onChange={(event) => setConcept(event.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-rose-500 focus:border-rose-500 transition"
                >
                  <option value="">— Choose Concept —</option>
                  {KEY_CONCEPTS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-1/2 flex justify-center sm:justify-start">
                <button onClick={handleTranslate} className="btn-rose w-full sm:w-auto px-4 py-2">
                  GENERATE TRANSLATION
                </button>
              </div>
            </div>

            {tError && <p className="text-red-600 text-sm mt-2">{tError}</p>}
            {(poetic || technical) && (
              <div className="mt-4 p-4 border rounded-lg" style={{ borderColor: '#f4cadd', background: '#fff5f8' }}>
                <h4 className="text-xl font-semibold mb-3 border-b pb-2" style={{ borderColor: '#f4cadd' }}>
                  Translation Result
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-lg mb-1" style={{ color: 'var(--rose)' }}>
                      Poetic/Analogous View
                    </p>
                    <p className="text-gray-700 italic text-sm whitespace-pre-wrap">{poetic}</p>
                  </div>
                  <div className="pt-4 md:pt-0 md:border-l md:pl-4" style={{ borderColor: '#f4cadd' }}>
                    <p className="font-bold text-lg mb-1" style={{ color: 'var(--rose)' }}>
                      Technical/Algorithmic Definition
                    </p>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{technical}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card border rounded-xl p-5 mb-8" style={{ borderColor: 'var(--border)', background: 'white' }}>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">3. Fusion Insight (Synthesis)</h3>
          <p className="text-sm text-gray-600 mb-4">Aligning Market Gate (quant) with Artistic/Scoring (Pyrouette).</p>
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            <p className="text-gray-800 italic mb-4">
              Both systems show parallel logic: cautious defense in markets mirrors strong artistic presence but restrained execution.
              Market = cautious Jeté, waiting for confirmation. Art = elegant performance, but timing gaps reduce scoring. Narrative:
              Hold back until confirmation is absolute.
            </p>
            <button onClick={handleNarrate} className="btn-rose text-sm px-3 py-1.5">
              {narrating ? '⏹ Stop Narration' : '🔊 Narrate Insight'}
            </button>
          </div>
        </div>

        <div className="card border rounded-xl p-5 mb-8" style={{ borderColor: 'var(--border)', background: 'white' }}>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">From Poetic Theory to Quantitative Proof (Solvable Challenges)</h3>
          <p className="text-sm text-gray-600 mb-4">Roadmap: actions to make the system verifiable & auditable.</p>
          <div className="space-y-4">
            {[
              {
                id: 'c1',
                title: 'Statistical Proof / IP-as-Narrative',
                action: 'Publish a quantitative whitepaper: 24m backtest, Sharpe/Sortino/MaxDD vs 3–5 benchmarks.',
              },
              {
                id: 'c2',
                title: 'N=1 Kinesthetic → Generalizable Signal',
                action:
                  'Abstract CTR Z to non-somatic HRV/GSR inputs; N≥50 cohort test; arXiv preprint + operationalizing the Glissé Engine.',
              },
              {
                id: 'c3',
                title: 'Audit Friction → Dual-Layer Explainability',
                action: 'Keep poetic UI while all gates log to an immutable ledger for auditor review.',
              },
            ].map((challenge) => (
              <details key={challenge.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <summary className="cursor-pointer font-semibold text-gray-800">{challenge.title}</summary>
                <p className="mt-3 text-sm text-gray-700 border-l-4 pl-3" style={{ borderColor: '#f4cadd' }}>
                  <span className="font-medium" style={{ color: 'var(--rose)' }}>
                    Action Mandate:
                  </span>{' '}
                  {challenge.action}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
createRoot(root).render(<Dashboard />);
