import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Lock,
  Shield,
  Server,
  AlertTriangle,
  FileCheck,
  Zap,
  Play,
  Pause,
  CheckCircle2,
  Disc,
  Radio,
} from 'lucide-react';

// --- MAISON MYTHOS PALETTE & THEME CONFIG ---
const THEME = {
  bg: 'bg-[#050509]', // Ink Warm
  panel: 'bg-[#151821]', // Velvet Grey
  dock: 'bg-[#0f1219]/80',
  border: 'border-[#22262E]',
  text: 'text-[#F7F3EE]', // Parchment
  muted: 'text-[#A8AFBF]', // Muted Blue-Grey
  gold: 'text-[#D8B989]', // Champagne (Value)
  rose: 'text-[#E7C2C0]', // Dusty Rose (Risk/Care)
  sage: 'text-[#A8E4C9]', // Sage (Success)
  mauve: 'text-[#C3AEC9]', // Mauve (Cipher)
  // Utilities
  innerGlow: 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
  glass: 'backdrop-blur-xl bg-[#050509]/60',
};

// --- MOCK DATA ---
const INITIAL_DEAD_LETTERS = [
  { id: 'DL-492', payload: 'Signal.Ingest.Failed', reason: 'Schema Mismatch v2.1', timestamp: '10:42:01', status: 'PARKED' },
  { id: 'DL-493', payload: 'Auth.Token.Expired', reason: 'Dependency Timeout', timestamp: '10:45:12', status: 'PARKED' },
  { id: 'DL-494', payload: 'Snapshot.Write.Err', reason: 'MinIO Lock', timestamp: '11:01:33', status: 'PARKED' },
];

// Optional: shape for real proof stats once you wire API → UI
const DEFAULT_PROOF = {
  datasetId: 'backtest_equity.csv',
  timestampUtc: '2025-11-05T03:36:30Z',
  spearmanRho: 0.837,
  pValue: 0, // 0.000e+00 displayed
};

export default function StudioOSConsole() {
  const [activeSection, setActiveSection] = useState('lake');

  // -- KOI NODE STATE --
  const [koiPulse, setKoiPulse] = useState(true);
  const [deadLetters, setDeadLetters] = useState(INITIAL_DEAD_LETTERS);
  const [replayingIds, setReplayingIds] = useState([]);

  // -- LEDGER STATE --
  const [verificationStep, setVerificationStep] = useState('idle');
  const [proofLog, setProofLog] = useState([]);
  const [proofStats] = useState(DEFAULT_PROOF); // later: hydrate from API

  // -- FACULTY PHYSICS STATE --
  const [uRatio, setURatio] = useState(0.5);
  const [decayCurve, setDecayCurve] = useState([]);

  // -- ANIMATION LOOPS --
  useEffect(() => {
    const points = [];
    const decayFactor = 1 - uRatio * 0.5; // between 0.5 and 1

    for (let i = 0; i <= 20; i++) {
      const y = 100 * Math.pow(decayFactor, i);
      points.push({ x: i, y });
    }

    setDecayCurve(points);
  }, [uRatio]);

  const handleReplay = (id) => {
    setReplayingIds((prev) => [...prev, id]);
    setTimeout(() => {
      setDeadLetters((prev) => prev.filter((item) => item.id !== id));
      setReplayingIds((prev) => prev.filter((pid) => pid !== id));
    }, 1500);
  };

  const runProofProtocol = () => {
    if (verificationStep !== 'idle') return;
    setVerificationStep('hashing');
    setProofLog(['> INITIATING MERCY GATE PROTOCOL...']);

    setTimeout(() => {
      setProofLog((p) => [...p, `> HASHING DATASET: ${proofStats.datasetId}...`]);
      setVerificationStep('verifying');

      setTimeout(() => {
        setProofLog((p) => [
          ...p,
          '> CALCULATING SPEARMAN RHO...',
          `> RHO: ${proofStats.spearmanRho.toFixed(3)} (PASS)`,
        ]);

        setTimeout(() => {
          setProofLog((p) => [
            ...p,
            '> CHECKING P-VALUE...',
            `> P: ${proofStats.pValue.toExponential(3)} (SIG)`,
          ]);
          setVerificationStep('complete');
        }, 800);
      }, 1000);
    }, 1200);
  };

  const resetProof = () => {
    setVerificationStep('idle');
    setProofLog([]);
  };

  const StatusDot = ({ status }) => {
    let color = 'bg-slate-500';
    if (status === 'ok' || status === 'FLOWING') color = 'bg-[#A8E4C9] shadow-[0_0_8px_rgba(168,228,201,0.4)]';
    if (status === 'warn') color = 'bg-[#D8B989]';
    if (status === 'err') color = 'bg-[#E7C2C0]';
    return <div className={`w-2 h-2 rounded-full ${color}`} />;
  };

  // normalize decay for SVG path (0–100 space)
  const maxY = decayCurve.reduce((m, p) => Math.max(m, p.y), 1);
  const decayPath = decayCurve.length
    ? decayCurve
        .map((p, i) => {
          const x = (i / Math.max(decayCurve.length - 1, 1)) * 100;
          const y = 100 - (p.y / maxY) * 100;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ')
    : '';

  return (
    <div
      className={`flex h-screen w-full ${THEME.bg} ${THEME.text} font-sans selection:bg-[#D8B989] selection:text-[#050509] overflow-hidden`}
    >
      {/* --- SIDE NAVIGATION (Fixed Left) --- */}
      <nav className={`w-20 flex-shrink-0 border-r ${THEME.border} flex flex-col items-center py-6 z-30 ${THEME.glass}`}>
        <div className={`text-2xl font-serif font-bold ${THEME.gold} mb-10 tracking-tighter`}>S.OS</div>

        <div className="flex flex-col gap-6 w-full items-center">
          {[
            { id: 'lake', icon: Disc, label: 'LAKE' },
            { id: 'ledger', icon: Database, label: 'LEDGER' },
            { id: 'faculty', icon: Activity, label: 'FACULTY' },
            { id: 'salon', icon: Shield, label: 'SALON' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`group relative p-3 rounded-2xl transition-all duration-300
                ${activeSection === item.id ? 'bg-[#151821] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'hover:bg-[#151821]/50'}
              `}
            >
              <item.icon
                className={`w-5 h-5 transition-colors duration-300
                  ${activeSection === item.id ? THEME.gold : THEME.muted}
                `}
              />
              {activeSection === item.id && (
                <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-[#D8B989] shadow-[0_0_4px_#D8B989]" />
              )}

              {/* Tooltipish label */}
              <span className="absolute left-14 bg-[#151821] px-2 py-1 rounded border border-[#22262E] text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-4 mb-4">
          <div className={`w-8 h-8 rounded-full border border-[#22262E] flex items-center justify-center ${THEME.muted}`}>
            <Lock className="w-3 h-3" />
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* TOP BAR */}
        <header className={`h-16 border-b ${THEME.border} flex items-center justify-between px-8 bg-[#050509]/50 backdrop-blur-sm z-20`}>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-mono uppercase tracking-[0.2em] ${THEME.muted}`}>
              Regime: <span className={THEME.sage}>OPEN</span>
            </span>
            <span className="h-3 w-px bg-[#22262E]" />
            <span className={`text-xs font-mono uppercase tracking-[0.2em] ${THEME.muted}`}>
              Hash: 0x7F...9A2
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D8B989]/30 bg-[#D8B989]/5 text-[10px] font-bold text-[#D8B989] uppercase tracking-wider hover:bg-[#D8B989]/10 transition-colors">
              <Zap className="w-3 h-3" /> Connect Wallet
            </button>
          </div>
        </header>

        {/* CANVAS */}
        <div className="flex-grow overflow-y-auto p-8 pb-24 relative">
          {/* 1. LAKE / KOI NODE */}
          {activeSection === 'lake' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-4xl font-serif text-[#F7F3EE] mb-2">Koi Resilience Node</h1>
                <p className={`${THEME.muted} font-mono text-sm tracking-wide`}>
                  MYTHOS CLOUD // DAEMON: <span className={THEME.sage}>RUNNING</span>
                </p>
              </div>

              {/* Visual Sigil & Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* The Sigil (Pulse) */}
                <div
                  className={`${THEME.panel} rounded-3xl border ${THEME.border} p-8 flex flex-col items-center justify-center relative overflow-hidden group`}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-32 h-32 rounded-full border border-[#D8B989]/20 flex items-center justify-center transition-all duration-[3000ms] ${koiPulse ? 'scale-105 border-[#D8B989]/40' : 'scale-100'}`}
                    >
                      <div
                        className={`w-24 h-24 rounded-full bg-[#D8B989]/10 flex items-center justify-center backdrop-blur-md border border-[#D8B989]/30 transition-all duration-[1500ms] ${koiPulse ? 'scale-110 shadow-[0_0_40px_rgba(216,185,137,0.2)]' : 'scale-90 shadow-none'}`}
                      >
                        <Disc className={`w-10 h-10 text-[#D8B989] ${koiPulse ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4 z-20">
                    <button
                      onClick={() => setKoiPulse(!koiPulse)}
                      className={`w-10 h-10 rounded-full border ${THEME.border} flex items-center justify-center hover:bg-[#22262E] transition-colors`}
                    >
                      {koiPulse ? <Pause className="w-4 h-4 text-[#E7C2C0]" /> : <Play className="w-4 h-4 text-[#A8E4C9]" />}
                    </button>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-mono text-[#D8B989] uppercase tracking-widest">
                        {koiPulse ? 'Pulse: Active' : 'Pulse: Paused'}
                      </span>
                      <span className="text-[10px] font-mono text-[#A8AFBF]">60 BPM // Latency: 42ms</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Cards */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
                  <div className={`${THEME.panel} rounded-3xl border ${THEME.border} p-6 flex flex-col justify-between ${THEME.innerGlow}`}>
                    <div className="flex justify-between items-start">
                      <Server className="w-5 h-5 text-[#A8AFBF]" />
                      <span className="text-xs font-mono px-2 py-1 rounded bg-[#A8E4C9]/10 text-[#A8E4C9] border border-[#A8E4C9]/20">
                        CLOSED (HEALTHY)
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif text-[#F7F3EE] mt-4">1,402</h3>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#A8AFBF] mt-1">Total Attempts</p>
                    </div>
                  </div>

                  <div className={`${THEME.panel} rounded-3xl border ${THEME.border} p-6 flex flex-col justify-between ${THEME.innerGlow}`}>
                    <div className="flex justify-between items-start">
                      <AlertTriangle className="w-5 h-5 text-[#E7C2C0]" />
                      <span className="text-xs font-mono px-2 py-1 rounded bg-[#E7C2C0]/10 text-[#E7C2C0] border border-[#E7C2C0]/20">
                        ACTION REQ
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif text-[#F7F3EE] mt-4">{deadLetters.length}</h3>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#A8AFBF] mt-1">Dead Letters</p>
                    </div>
                  </div>

                  {/* Dead Letter Lake List */}
                  <div className={`col-span-2 ${THEME.panel} rounded-3xl border ${THEME.border} p-0 overflow-hidden`}>
                    <div className="px-6 py-4 border-b border-[#22262E] flex justify-between items-center bg-[#0f1219]">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-[#A8AFBF]">Dead-Letter Lake</h4>
                      <button className="text-[10px] text-[#D8B989] hover:underline">View All Archives</button>
                    </div>
                    <div className="divide-y divide-[#22262E]">
                      {deadLetters.map((letter) => (
                        <div
                          key={letter.id}
                          className="px-6 py-3 flex items-center justify-between group hover:bg-[#1A1E29] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E7C2C0]" />
                            <div>
                              <p className="text-sm font-medium text-[#F7F3EE] font-mono">{letter.payload}</p>
                              <p className="text-[10px] text-[#A8AFBF] font-mono">
                                {letter.id} // {letter.reason}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleReplay(letter.id)}
                            disabled={replayingIds.includes(letter.id)}
                            className={`px-3 py-1.5 rounded border border-[#22262E] text-[10px] font-mono uppercase transition-all
                              ${replayingIds.includes(letter.id)
                                ? 'bg-[#A8E4C9]/20 text-[#A8E4C9] border-[#A8E4C9]/30'
                                : 'hover:bg-[#22262E] text-[#A8AFBF]'}
                            `}
                          >
                            {replayingIds.includes(letter.id) ? 'Replaying...' : 'Replay'}
                          </button>
                        </div>
                      ))}
                      {deadLetters.length === 0 && (
                        <div className="px-6 py-8 text-center">
                          <CheckCircle2 className="w-8 h-8 text-[#A8E4C9] mx-auto mb-2 opacity-50" />
                          <p className="text-sm text-[#A8AFBF]">Lake is clear. Flow is optimal.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. LEDGER / PROOF */}
          {activeSection === 'ledger' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-12 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-serif text-[#F7F3EE] mb-2">Sovereign Ledger</h1>
                  <p className={`${THEME.muted} font-mono text-sm tracking-wide`}>
                    PROOF OF HISTORY // INTUITION LABS // <span className={THEME.sage}>AUDITABLE</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono text-[#F7F3EE] tabular-nums">{proofStats.spearmanRho.toFixed(3)}</div>
                  <div className="text-[10px] text-[#A8E4C9] uppercase tracking-widest font-mono">Spearman Rho (Current)</div>
                </div>
              </div>

              <div className={`${THEME.panel} rounded-3xl border ${THEME.border} overflow-hidden shadow-2xl relative`}>
                <div className="bg-[#0f1219] px-8 py-6 border-b border-[#22262E] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-[#D8B989]" />
                    <span className="text-sm font-bold text-[#F7F3EE] tracking-wide">Proof Protocol v4.1</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-[#151821] border border-[#22262E] text-[10px] font-mono ${THEME.muted}`}>
                    ID: {proofStats.datasetId}
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left: Metadata */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#A8AFBF] font-mono mb-1 block">Timestamp (UTC)</label>
                      <p className="text-sm text-[#F7F3EE] font-mono border-b border-[#22262E] pb-2">{proofStats.timestampUtc}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#A8AFBF] font-mono mb-1 block">Mercy Gate Status</label>
                      <div className="flex items-center gap-2 pt-1">
                        {verificationStep === 'complete' ? (
                          <span className="flex items-center gap-2 text-[#A8E4C9] font-bold text-sm bg-[#A8E4C9]/10 px-3 py-1 rounded border border-[#A8E4C9]/20">
                            <CheckCircle2 className="w-4 h-4" /> OPEN
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[#A8AFBF] font-mono text-sm">
                            <Lock className="w-3 h-3" /> LOCKED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      {verificationStep === 'complete' ? (
                        <button
                          onClick={resetProof}
                          className="w-full py-4 rounded-xl border border-[#22262E] text-[#A8AFBF] font-mono text-xs uppercase tracking-widest hover:bg-[#22262E] transition-all"
                        >
                          Reset Protocol
                        </button>
                      ) : (
                        <button
                          onClick={runProofProtocol}
                          disabled={verificationStep !== 'idle'}
                          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300
                            ${verificationStep === 'idle'
                              ? 'bg-[#D8B989] text-[#050509] hover:bg-[#E5CFA5] shadow-[0_0_20px_rgba(216,185,137,0.3)]'
                              : 'bg-[#151821] text-[#A8AFBF] border border-[#22262E] cursor-not-allowed'}
                          `}
                        >
                          {verificationStep === 'idle' ? 'Run Proof Verification' : 'Processing...'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Terminal Output */}
                  <div className="bg-[#050509] rounded-xl border border-[#22262E] p-4 font-mono text-xs h-64 overflow-y-auto flex flex-col">
                    <div className="text-[#A8AFBF] opacity-50 mb-2 border-b border-[#22262E] pb-2">
                      root@avc-ledger:~$ ./verify_proof --target={proofStats.datasetId.replace('.csv', '')}
                    </div>

                    <div className="flex-grow space-y-1">
                      {proofLog.map((log, i) => (
                        <div key={i} className={log.includes('PASS') || log.includes('SIG') ? 'text-[#A8E4C9]' : 'text-[#D8B989]'}>
                          {log}
                        </div>
                      ))}
                      {verificationStep === 'hashing' && <div className="text-[#A8AFBF] animate-pulse">_</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FACULTY / PHYSICS */}
          {activeSection === 'faculty' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-12">
                <h1 className="text-4xl font-serif text-[#F7F3EE] mb-2">Physics Engine</h1>
                <p className={`${THEME.muted} font-mono text-sm tracking-wide`}>
                  O:PEN V2.1 // RETIRE MODEL // <span className={THEME.rose}>KINETIC DECAY</span>
                </p>
              </div>

              <div className={`${THEME.panel} rounded-3xl border ${THEME.border} p-8`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-[#D8B989]">Continuum Simulation</h3>
                  <div className="px-3 py-1 rounded bg-[#050509] border border-[#22262E] text-xs font-mono text-[#F7F3EE]">
                    uRatio: {uRatio.toFixed(2)}
                  </div>
                </div>

                <div className="h-64 bg-[#050509] rounded-xl border border-[#22262E] mb-8 relative overflow-hidden flex items-end p-4 gap-1">
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px)', backgroundSize: '100% 20px' }}
                  ></div>

                  {decayCurve.map((point, i) => {
                    const normalized = (point.y / maxY) * 100;
                    return (
                      <div
                        key={i}
                        style={{
                          height: `${normalized}%`,
                          width: `${100 / Math.max(decayCurve.length, 1)}%`,
                          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        className="bg-[#D8B989] opacity-80 rounded-t-sm hover:opacity-100 hover:bg-[#E5CFA5]"
                      />
                    );
                  })}

                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={decayPath} fill="none" stroke="#E7C2C0" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="px-4">
                  <label className="text-[10px] uppercase tracking-widest text-[#A8AFBF] font-mono mb-4 block flex justify-between">
                    <span>Full Pulse (0.0)</span>
                    <span>Retired (1.0)</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={uRatio}
                    onChange={(e) => setURatio(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#22262E] rounded-lg appearance-none cursor-pointer accent-[#D8B989]"
                  />
                </div>

                <p className="text-center mt-8 text-xs font-mono text-[#A8AFBF]">
                  Adjust the uRatio slider to model kinetic energy dissipation over time.
                </p>
              </div>
            </div>
          )}

          {/* 4. SALON */}
          {activeSection === 'salon' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-center pt-20">
              <Shield className="w-16 h-16 text-[#D8B989] mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl font-serif text-[#F7F3EE] italic mb-4">"Structure is the foundation of care."</h2>
              <div className="max-w-md mx-auto">
                <p className="text-[#A8AFBF] font-mono text-sm leading-relaxed">
                  The Salon module manages governance threads and Title IX logs.
                  Access restricted to Ethics Committee members.
                </p>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <button className="px-6 py-2 rounded-full border border-[#22262E] text-[#F7F3EE] text-xs font-mono uppercase tracking-widest hover:bg-[#22262E] transition-colors">
                  Request Access
                </button>
                <button className="px-6 py-2 rounded-full bg-[#151821] border border-[#22262E] text-[#A8AFBF] text-xs font-mono uppercase tracking-widest cursor-not-allowed opacity-50">
                  View Audit Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- GLOBAL STATUS FOOTER (Glassmorphism Dock) --- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className={`flex items-center gap-6 px-8 py-3 rounded-full border border-[#22262E] ${THEME.dock} backdrop-blur-md shadow-2xl`}>
            <div className="flex items-center gap-2">
              <StatusDot status="ok" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F7F3EE]">System: Ready</span>
            </div>
            <div className="w-px h-3 bg-[#22262E]" />
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-[#A8AFBF]" />
              <span className="text-[10px] font-mono text-[#A8AFBF]">neon-pooled-v4</span>
            </div>
            <div className="w-px h-3 bg-[#22262E]" />
            <div className="flex items-center gap-2">
              <Radio className="w-3 h-3 text-[#D8B989]" />
              <span className="text-[10px] font-mono text-[#D8B989]">us-east-1</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
