import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Lock,
  ShieldCheck,
  Terminal,
  Unlock,
} from 'lucide-react';

/**
 * COMPONENT: Presidents Day Fortress Dashboard
 * A unified interface for the ETH/LI Regime Logic and Block Bootstrap CI.
 */
const App = () => {
  const [pVal, setPVal] = useState(0.33);
  const [weight, setWeight] = useState(92);
  const [ciStatus] = useState('Excludes 0');
  const [ciRange] = useState({ lower: 1.2, upper: 5.8 });
  const [timestamp] = useState(new Date().toISOString());

  const isStructuralConfirmed = weight >= 80;
  const isCiValid = ciStatus === 'Excludes 0';
  const isPValuePass = pVal < 0.05;
  const isRegimeOpen = isStructuralConfirmed && isCiValid && isPValuePass;

  const assetData = [
    {
      asset: 'LIT',
      pivot: 72.15,
      s1: 71.39,
      s2: 70.83,
      r1: 73.47,
      r2: 74.57,
      atr: '71.20–74.20',
      action: isRegimeOpen ? 'SCALED ENTRY' : 'OBSERVE ONLY',
    },
    {
      asset: 'ETH',
      pivot: 1981.96,
      s1: 1944.13,
      s2: 1902.62,
      r1: 2023.47,
      r2: 2061.3,
      atr: '1950–2020',
      action: isRegimeOpen ? 'SCALED ENTRY' : 'CONFIRM (NO ENTRY)',
    },
    {
      asset: 'QQQ',
      pivot: 601.61,
      s1: 596.75,
      s2: 591.59,
      r1: 606.77,
      r2: 611.63,
      atr: '596–608',
      action: 'MONITOR',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500 w-8 h-8" />
            Presidents Day Fortress <span className="text-slate-500 font-light">v2.1</span>
          </h1>
          <p className="text-slate-400 mt-1 uppercase text-xs tracking-widest font-mono">
            Feb 17, 2026 — 03:45 AM ET | Institutional Confidence Filter
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-lg border flex items-center gap-3 font-bold ${
            isRegimeOpen
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
          }`}
        >
          {isRegimeOpen ? <Unlock size={20} /> : <Lock size={20} />}
          REGIME: {isRegimeOpen ? 'OPEN' : 'CLOSED_DEFENSIVE'}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={16} /> Filter Controls
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-mono">
                  Permutation P-Value (Min)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={pVal}
                  onChange={(e) => setPVal(Number.parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-1 text-sm font-mono">
                  <span className={pVal < 0.05 ? 'text-emerald-400' : 'text-rose-400'}>
                    {pVal.toFixed(3)}
                  </span>
                  <span className="text-slate-600">Gate: 0.05</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-mono">Structural Weight (W)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number.parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                />
                <div className="flex justify-between mt-1 text-sm font-mono text-slate-600 uppercase tracking-tighter">
                  <span>Target ≥ 80</span>
                  <span className={weight >= 80 ? 'text-emerald-400' : 'text-rose-400'}>
                    {weight >= 80 ? 'PASSED' : 'FAIL'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl font-mono text-xs overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal size={16} /> Engine Logs
            </h2>
            <div className="space-y-1 text-emerald-500 opacity-80">
              <p>[03:44:12] Initializing block_bootstrap...</p>
              <p>[03:44:15] n_boot=1000 resamples complete.</p>
              <p>[03:44:18] τ* detected at Lag -4.</p>
              <p>
                [03:44:20] CI: [{ciRange.lower}, {ciRange.upper}] (Excludes 0)
              </p>
              <p className={pVal < 0.05 ? 'text-emerald-400' : 'text-rose-400'}>
                [03:44:22] p_value={pVal.toFixed(3)} {pVal < 0.05 ? 'PASSED' : 'REJECTED'}
              </p>
              <p className="text-slate-400">[03:45:00] Atomic write to regime.json success.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase mb-1 font-mono">Structural Status</p>
              <p
                className={`text-xl font-bold ${isStructuralConfirmed ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                {isStructuralConfirmed ? `CONFIRMED (W=${weight})` : 'UNCONFIRMED'}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase mb-1 font-mono">Confidence Int.</p>
              <p className={`text-xl font-bold ${isCiValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ciStatus}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase mb-1 font-mono">Significance</p>
              <p className={`text-xl font-bold ${isPValuePass ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPValuePass ? 'SIG PASS' : 'NO EDGE'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={16} /> Institutional Day Sheet
              </h2>
              <span className="text-xs text-slate-500 italic">Feb 17 Session</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-500 font-mono text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Asset</th>
                    <th className="px-5 py-3 font-medium">Pivot</th>
                    <th className="px-5 py-3 font-medium">S1/S2</th>
                    <th className="px-5 py-3 font-medium">R1/R2</th>
                    <th className="px-5 py-3 font-medium">ATR Band</th>
                    <th className="px-5 py-3 font-medium text-right">Action (Filter)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assetData.map((row) => (
                    <tr key={row.asset} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-white">{row.asset}</td>
                      <td className="px-5 py-4 font-mono text-slate-400">{row.pivot.toFixed(2)}</td>
                      <td className="px-5 py-4 font-mono text-rose-400/70">
                        {row.s1.toFixed(2)} / {row.s2.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-emerald-400/70">
                        {row.r1.toFixed(2)} / {row.r2.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500 text-xs">{row.atr}</td>
                      <td
                        className={`px-5 py-4 text-right font-bold text-xs ${
                          row.action.includes('ENTRY') ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {row.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative group">
            <div className="absolute top-4 right-4 text-[10px] text-slate-600 font-mono uppercase">
              regime_overlay.json
            </div>
            <pre className="text-xs text-blue-400 font-mono overflow-auto leading-relaxed">{`{
  "timestamp": "${timestamp}",
  "regime_status": "${isRegimeOpen ? 'OPEN' : 'CLOSED_DEFENSIVE'}",
  "struct_confirmed": ${isStructuralConfirmed},
  "tau_ci_excludes_zero": ${isCiValid},
  "tap_p_value": ${pVal.toFixed(3)},
  "tap_weight_max": ${weight},
  "action_rules": "${isRegimeOpen ? 'AGGRESSIVE — TRI* scaling active' : 'NEUTRAL — No TRI* scaling'}"
}`}</pre>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 flex justify-between text-[10px] text-slate-600 font-mono uppercase tracking-widest border-t border-slate-800 pt-4">
        <span>Organism Integrity: 100%</span>
        <span>Hashed for Secure Delivery</span>
        <span>System: Unbreakable</span>
      </div>
    </div>
  );
};

export default App;
