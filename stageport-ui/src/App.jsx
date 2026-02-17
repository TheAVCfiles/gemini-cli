import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Database,
  Fingerprint,
  Lock,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Unlock,
  Zap,
} from 'lucide-react';

/**
 * PRESIDENTS DAY FORTRESS v2.1
 * Institutional Regime & Confidence Monitor
 */
const App = () => {
  const [pVal, setPVal] = useState(0.032);
  const [weight, setWeight] = useState(92);
  const [ciStatus] = useState('Excludes 0');
  const [ciRange] = useState({ lower: 1.2, upper: 5.8 });
  const [isLive] = useState(true);

  const [signalHistory, setSignalHistory] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      val: 2.5 + Math.sin(i / 5) + Math.random() * 0.5,
      time: i,
    })),
  );

  const [logs, setLogs] = useState([
    { t: '03:44:01', m: 'AUTH_KEY verified', type: 'success' },
    { t: '03:44:12', m: 'Initializing block bootstrap engine...', type: 'info' },
    { t: '03:44:15', m: 'n_boot=1000 resamples complete.', type: 'success' },
    { t: '03:44:18', m: 'τ* detected at Lag -4.', type: 'info' },
    { t: '03:44:20', m: 'CI: [1.2, 5.8] (Excludes 0)', type: 'success' },
  ]);

  const isStructuralConfirmed = weight >= 80;
  const isCiValid = ciStatus === 'Excludes 0';
  const isPValuePass = pVal < 0.05;
  const isRegimeOpen = isStructuralConfirmed && isCiValid && isPValuePass;

  const assetData = useMemo(
    () => [
      {
        asset: 'LIT',
        pivot: 72.15,
        s1: 71.39,
        s2: 70.83,
        r1: 73.47,
        r2: 74.57,
        action: isRegimeOpen ? 'SCALED ENTRY' : 'OBSERVE ONLY',
      },
      {
        asset: 'ETH',
        pivot: 1981.96,
        s1: 1944.13,
        s2: 1902.62,
        r1: 2023.47,
        r2: 2061.3,
        action: isRegimeOpen ? 'SCALED ENTRY' : 'CONFIRM (NO ENTRY)',
      },
      {
        asset: 'QQQ',
        pivot: 601.61,
        s1: 596.75,
        s2: 591.59,
        r1: 606.77,
        r2: 611.63,
        action: 'MONITOR',
      },
    ],
    [isRegimeOpen],
  );

  useEffect(() => {
    if (!isLive) {
      return undefined;
    }

    const pollInterval = setInterval(() => {
      setSignalHistory((prev) => {
        const nextVal = prev[prev.length - 1].val + (Math.random() - 0.5) * 0.4;
        return [...prev.slice(1), { val: nextVal, time: Date.now() }];
      });

      if (Math.random() > 0.8) {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false });
        const msgs = ['Regime status verified.', 'Heartbeat active.', 'Signal audit complete.'];
        setLogs((prev) => [
          { t: now, m: msgs[Math.floor(Math.random() * msgs.length)], type: 'info' },
          ...prev.slice(0, 8),
        ]);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isLive]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white uppercase flex items-center gap-2">
                Presidents Day Fortress{' '}
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
                  v2.1
                </span>
              </h1>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 ${
              isRegimeOpen
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
            }`}
          >
            {isRegimeOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="text-xs font-bold font-mono tracking-tighter uppercase">
              {isRegimeOpen ? 'REGIME_OPEN' : 'REGIME_CLOSED'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-500" /> Origin Audit
              </h2>
            </div>
            <div className="p-4 bg-slate-950/50 text-[10px] font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 uppercase">Provider</span>
                <span className="text-slate-300">AVCSYSTEMSSTUDIOS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 uppercase">Identity</span>
                <span className="text-emerald-500">@xoAVCxo</span>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-400">
                <Terminal className="w-3.5 h-3.5" /> Filters
              </h2>
            </div>
            <div className="p-5 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                  <span>P-Value</span>
                  <span className={`text-lg font-mono font-bold ${isPValuePass ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pVal.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={pVal}
                  onChange={(e) => setPVal(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                  <span>Weight (W)</span>
                  <span className={`text-lg font-mono font-bold ${isStructuralConfirmed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {weight}
                  </span>
                </div>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-sm"
                />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl h-[300px] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-500" /> Engine Logs
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 leading-tight">
                  <span className="text-slate-600">[{log.t}]</span>
                  <span className={log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'}>{log.m}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Structural Status',
                value: isStructuralConfirmed ? `CONFIRMED (W=${weight})` : 'UNCONFIRMED',
                icon: Database,
              },
              {
                label: 'Confidence Int.',
                value: ciStatus,
                sub: `Range: [${ciRange.lower}, ${ciRange.upper}]`,
                icon: Zap,
              },
              {
                label: 'Significance',
                value: isPValuePass ? 'SIG PASS' : 'NO EDGE',
                sub: 'Target < 0.05',
                icon: BarChart3,
              },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <stat.icon className="w-10 h-10" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
                <div className={`text-lg font-mono font-bold mt-1 ${isRegimeOpen ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {stat.value}
                </div>
                {stat.sub && <div className="text-[10px] text-slate-600 font-mono mt-1 italic">{stat.sub}</div>}
              </div>
            ))}
          </div>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-300 mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" /> Scaling Signal Visualization
            </h2>
            <div className="h-40 w-full">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <path
                  d={`M ${signalHistory
                    .map((d, i) => `${(i / (signalHistory.length - 1)) * 1000},${100 - d.val * 20}`)
                    .join(' L ')}`}
                  fill="none"
                  stroke={isRegimeOpen ? '#10b981' : '#475569'}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-4 py-4 border-b border-slate-800 bg-slate-800/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Institutional Day Sheet</h2>
            </div>
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950/50 text-[10px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Pivot</th>
                  <th className="px-4 py-3">S1 / S2</th>
                  <th className="px-4 py-3">R1 / R2</th>
                  <th className="px-4 py-3">Action Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {assetData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/20">
                    <td className="px-4 py-4 font-bold">{row.asset}</td>
                    <td className="px-4 py-4">{row.pivot.toFixed(2)}</td>
                    <td className="px-4 py-4 text-rose-400">
                      {row.s1.toFixed(2)} / {row.s2.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-emerald-400">
                      {row.r1.toFixed(2)} / {row.r2.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          row.action.includes('ENTRY')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {row.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
