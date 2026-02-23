import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CloudRain,
  Database,
  Fingerprint,
  Flame,
  Lock,
  ShieldCheck,
  Sun,
  Terminal,
  TrendingUp,
  Unlock,
  Wind,
  Zap,
} from 'lucide-react';

const KILL_SWITCH_THRESHOLD = 0.35;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const calcRsi = (series, period = 14) => {
  if (series.length <= period) {
    return 50;
  }

  const window = series.slice(-period - 1);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < window.length; i += 1) {
    const delta = window[i].val - window[i - 1].val;
    if (delta >= 0) {
      gains += delta;
    } else {
      losses += Math.abs(delta);
    }
  }

  if (losses === 0) {
    return 100;
  }

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
};

const App = () => {
  const [pVal, setPVal] = useState(0.032);
  const [weight, setWeight] = useState(92);
  const [ciStatus] = useState('Excludes 0');
  const [ciRange] = useState({ lower: 1.2, upper: 5.8 });
  const [isLive] = useState(true);

  const [rainIntensity, setRainIntensity] = useState(0.78);
  const [sunIntensity, setSunIntensity] = useState(0.35);
  const [lightningIntensity, setLightningIntensity] = useState(0.44);

  const [signalHistory, setSignalHistory] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      val: 2.5 + Math.sin(i / 5) + Math.random() * 0.35,
      rain: clamp(0.65 + Math.sin(i / 6) * 0.2 + (Math.random() - 0.5) * 0.1),
      sun: clamp(0.4 + Math.cos(i / 4) * 0.25 + (Math.random() - 0.5) * 0.1),
      lightning: clamp(0.3 + Math.sin(i / 3) * 0.3 + (Math.random() - 0.5) * 0.15),
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

  const [brierScore, setBrierScore] = useState(0.18);
  const [tradeLog, setTradeLog] = useState([]);
  const [sentimentData, setSentimentData] = useState({ buzzIntensity: 62, tilt: 0.22 });

  const isStructuralConfirmed = weight >= 80;
  const isCiValid = ciStatus === 'Excludes 0';
  const isPValuePass = pVal < 0.05;
  const isRegimeOpen = isStructuralConfirmed && isCiValid && isPValuePass;
  const killSwitchTriggered = brierScore > KILL_SWITCH_THRESHOLD;

  const recommendations = useMemo(
    () => [
      { signal: 'RAIN', confidence: rainIntensity, color: 'text-blue-400', bg: 'bg-blue-500/15' },
      { signal: 'SUN', confidence: sunIntensity, color: 'text-amber-400', bg: 'bg-amber-500/15' },
      { signal: 'ZAP', confidence: lightningIntensity, color: 'text-rose-400', bg: 'bg-rose-500/15' },
      {
        signal: 'HEDGE',
        confidence: clamp(1 - (sunIntensity + lightningIntensity) / 2),
        color: 'text-violet-400',
        bg: 'bg-violet-500/15',
      },
    ],
    [rainIntensity, sunIntensity, lightningIntensity],
  );

  const completedTrades = tradeLog.filter((trade) => trade.outcome !== null);
  const wins = completedTrades.filter((trade) => trade.outcome > 0).length;
  const losses = completedTrades.filter((trade) => trade.outcome <= 0).length;
  const cumulativePnl = completedTrades.reduce((acc, trade) => acc + trade.outcome, 0);
  const missedOpportunities = completedTrades.filter((trade) => trade.regret > 0).length;
  const rsi = calcRsi(signalHistory);
  const latestSignal = signalHistory[signalHistory.length - 1]?.val ?? 0;
  const atr = 0.18;
  const upperBand = latestSignal + atr;
  const lowerBand = latestSignal - atr;

  const actionFor = (asset) => {
    if (asset === 'QQQ') {
      return 'MONITOR';
    }

    if (asset === 'ETH') {
      return isRegimeOpen ? 'SCALED ENTRY' : 'CONFIRM (NO ENTRY)';
    }

    return isRegimeOpen ? 'SCALED ENTRY' : 'OBSERVE ONLY';
  };

  const assetData = useMemo(
    () => [
      {
        asset: 'LIT',
        pivot: 72.15,
        s1: 71.39,
        s2: 70.83,
        r1: 73.47,
        r2: 74.57,
      },
      {
        asset: 'ETH',
        pivot: 1981.96,
        s1: 1944.13,
        s2: 1902.62,
        r1: 2023.47,
        r2: 2061.3,
      },
      {
        asset: 'QQQ',
        pivot: 601.61,
        s1: 596.75,
        s2: 591.59,
        r1: 606.77,
        r2: 611.63,
      },
    ],
    [],
  );

  const executeTrade = (signal, confidence) => {
    if (killSwitchTriggered) {
      return;
    }

    const edge = confidence - (1 - confidence);
    const kellySize = clamp(edge, 0, 0.25);
    const outcome = Number(((Math.random() - 0.45) * 2.2).toFixed(2));
    const regret = Number(Math.max(0, confidence * 1.2 - outcome).toFixed(2));

    const trade = {
      id: Date.now(),
      signal,
      confidence,
      kellySize,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      outcome,
      regret,
    };

    setTradeLog((prev) => [trade, ...prev].slice(0, 12));
  };

  useEffect(() => {
    if (!isLive) {
      return undefined;
    }

    const pollInterval = setInterval(() => {
      setSignalHistory((prev) => {
        const nextVal = prev[prev.length - 1].val + (Math.random() - 0.5) * 0.35;
        const next = {
          val: nextVal,
          rain: clamp(rainIntensity + (Math.random() - 0.5) * 0.08),
          sun: clamp(sunIntensity + (Math.random() - 0.5) * 0.08),
          lightning: clamp(lightningIntensity + (Math.random() - 0.5) * 0.1),
          time: Date.now(),
        };

        setRainIntensity(next.rain);
        setSunIntensity(next.sun);
        setLightningIntensity(next.lightning);

        return [...prev.slice(1), next];
      });

      setSentimentData((prev) => ({
        buzzIntensity: Math.max(1, Math.round(prev.buzzIntensity + (Math.random() - 0.5) * 12)),
        tilt: clamp(prev.tilt + (Math.random() - 0.5) * 0.18, -1, 1),
      }));

      setBrierScore((prev) => clamp(prev + (Math.random() - 0.5) * 0.03, 0.02, 0.65));

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
  }, [isLive, lightningIntensity, rainIntensity, sunIntensity]);

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
                PRIMA Fortress Dashboard
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">v2.2</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">KILL SWITCH</span>
            <span
              className={`px-3 py-1 rounded-full border font-mono ${
                killSwitchTriggered
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              }`}
            >
              {killSwitchTriggered ? 'TRADING HALTED' : 'TRADING ENABLED'}
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
              <div className="space-y-3">
                <div className="flex justify-between items-end text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                  <span>Brier Score</span>
                  <span className={`text-lg font-mono font-bold ${killSwitchTriggered ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {brierScore.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.001"
                  value={brierScore}
                  onChange={(e) => setBrierScore(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {
                label: 'Sentiment Tilt',
                value: sentimentData.tilt >= 0 ? 'BULLISH' : 'BEARISH',
                sub: `${sentimentData.tilt >= 0 ? '+' : ''}${(sentimentData.tilt * 100).toFixed(1)}%`,
                icon: Flame,
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
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" /> Advanced Signal Telemetry
            </h2>
            <div className="h-44 w-full">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 120">
                <line x1="0" x2="1000" y1={100 - upperBand * 20} y2={100 - upperBand * 20} stroke="#a78bfa" strokeDasharray="4 4" opacity="0.65" />
                <line x1="0" x2="1000" y1={100 - lowerBand * 20} y2={100 - lowerBand * 20} stroke="#a78bfa" strokeDasharray="4 4" opacity="0.65" />
                <path
                  d={`M ${signalHistory
                    .map((d, i) => `${(i / (signalHistory.length - 1)) * 1000},${100 - d.val * 20}`)
                    .join(' L ')}`}
                  fill="none"
                  stroke={isRegimeOpen ? '#10b981' : '#475569'}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={`M ${signalHistory
                    .map((d, i) => `${(i / (signalHistory.length - 1)) * 1000},${112 - d.lightning * 35}`)
                    .join(' L ')}`}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.6"
                  opacity="0.85"
                />
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-400" /> RAIN {(rainIntensity * 100).toFixed(0)}%
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-300" /> SUN {(sunIntensity * 100).toFixed(0)}%
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400" /> ZAP {(lightningIntensity * 100).toFixed(0)}%
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                <Wind className="w-4 h-4 text-violet-300" /> RSI {rsi.toFixed(1)}
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Trade Execution Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.signal} className={`flex items-center justify-between rounded-lg border border-slate-700 ${rec.bg} px-3 py-2`}>
                    <div>
                      <div className="text-[11px] uppercase text-slate-400">{rec.signal} Signal</div>
                      <div className={`font-mono font-bold ${rec.color}`}>Confidence {(rec.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <button
                      onClick={() => executeTrade(rec.signal, rec.confidence)}
                      disabled={killSwitchTriggered}
                      className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs uppercase disabled:opacity-40"
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="text-[11px] uppercase text-slate-500 mb-2">Recent Trades (Kelly Sizing)</div>
                <ul className="space-y-1 text-xs font-mono max-h-48 overflow-y-auto pr-1">
                  {tradeLog.length === 0 && <li className="text-slate-500">No simulated trades yet.</li>}
                  {tradeLog.map((trade) => (
                    <li key={trade.id} className="text-slate-300">
                      {trade.timestamp} • {trade.signal} • Conf {trade.confidence.toFixed(2)} • Kelly {(trade.kellySize * 100).toFixed(1)}% • PnL{' '}
                      <span className={trade.outcome >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{trade.outcome.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Historical Performance</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Win/Loss Ratio</span><span>{wins}:{losses}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cumulative PnL</span>
                  <span className={cumulativePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{cumulativePnl.toFixed(2)}</span>
                </div>
                <div className="flex justify-between"><span className="text-slate-400">Regret Events</span><span>{missedOpportunities}</span></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Sentiment Analysis Overlay</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Buzz Intensity</span><span>{sentimentData.buzzIntensity}</span></div>
                  <div className="h-2 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${Math.min(sentimentData.buzzIntensity, 100)}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-slate-400">Sentiment Tilt</span>
                  <span className={sentimentData.tilt >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {sentimentData.tilt >= 0 ? 'Bullish' : 'Bearish'} ({(sentimentData.tilt * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
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
                          actionFor(row.asset).includes('ENTRY')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {actionFor(row.asset)}
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
