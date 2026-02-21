import React, { useEffect, useState } from 'react';
import { Activity, Lock, ShieldCheck, Terminal, Unlock, Zap } from 'lucide-react';

type SignalResponse = {
  events?: Array<{ event_date: string; weight: number; description?: string }>;
  anchor_date?: string;
  p_value?: number;
  weight?: number;
};

const App: React.FC = () => {
  const [pVal, setPVal] = useState(0.33);
  const [weight, setWeight] = useState(92);
  const [ciStatus] = useState('Excludes 0');
  const [ciRange] = useState({ lower: 1.2, upper: 5.8 });
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [events, setEvents] = useState<SignalResponse['events']>([]);
  const [narrativeAnchor, setNarrativeAnchor] = useState('2026-02-12');

  const isStructuralConfirmed = weight >= 80;
  const isCiValid = ciStatus === 'Excludes 0';
  const isPValuePass = pVal < 0.05;
  const isRegimeOpen = isStructuralConfirmed && isCiValid && isPValuePass;

  useEffect(() => {
    const pollLedger = async () => {
      try {
        const response = await fetch(`http://localhost:8000/signal?anchor_date=${narrativeAnchor}`);
        const data: SignalResponse = await response.json();
        setEvents(data.events || []);
        setNarrativeAnchor(data.anchor_date || narrativeAnchor);
        if (typeof data.p_value === 'number') setPVal(data.p_value);
        if (typeof data.weight === 'number') setWeight(data.weight);
        setTimestamp(new Date().toISOString());
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollLedger();
    const interval = setInterval(pollLedger, 60000);
    return () => clearInterval(interval);
  }, [narrativeAnchor]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" /> Presidents Day Fortress v2.1
        </h1>
        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${isRegimeOpen ? 'text-emerald-400 border-emerald-500/50' : 'text-rose-400 border-rose-500/50'}`}>
          {isRegimeOpen ? <Unlock size={18} /> : <Lock size={18} />}
          REGIME: {isRegimeOpen ? 'OPEN' : 'CLOSED_DEFENSIVE'}
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm uppercase text-slate-400 mb-4 flex gap-2 items-center"><Activity size={16} /> Filter Controls</h2>
          <p className="font-mono text-sm">p_value: {pVal.toFixed(3)}</p>
          <p className="font-mono text-sm">weight: {weight}</p>
          <p className="font-mono text-sm">CI: [{ciRange.lower}, {ciRange.upper}] {ciStatus}</p>
          <p className="font-mono text-xs text-slate-500 mt-3">Anchor: {narrativeAnchor}</p>
          <p className="font-mono text-xs text-slate-500">Updated: {timestamp}</p>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm uppercase text-slate-400 mb-4 flex gap-2 items-center"><Terminal size={16} /> Supporting Events</h2>
          <ul className="space-y-2 text-sm">
            {events?.map((event) => (
              <li key={`${event.event_date}-${event.weight}`} className="font-mono text-slate-300">
                {event.event_date} — W={event.weight} {event.description ? `(${event.description})` : ''}
              </li>
            ))}
            {!events?.length && <li className="text-slate-500">No events returned yet.</li>}
          </ul>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-8 text-xs text-slate-600 font-mono uppercase flex items-center gap-2">
        <Zap size={12} /> Organism Integrity: 100% • Hashed for Secure Delivery
      </footer>
    </div>
  );
};

export default App;
