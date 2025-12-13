import React from 'react';

const MODE_BADGE = {
  BASELINE: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60',
  MAINTENANCE: 'bg-sky-500/20 text-sky-300 border-sky-400/60',
  OVERWHELM: 'bg-red-500/20 text-red-300 border-red-500/70',
  RESTORE: 'bg-amber-500/20 text-amber-300 border-amber-400/70',
};

const MODE_ORDER = ['OVERWHELM', 'RESTORE', 'MAINTENANCE', 'BASELINE'];

export default function DirectorConsole({ snapshot, onOverrideMode }) {
  const { auraLoad, aureMode, sovereignGap, notes } = snapshot;

  const auraPercent = Math.round(auraLoad * 100);
  const gapPercent = Math.round(sovereignGap * 100);

  const handleOverride = (mode) => {
    if (!onOverrideMode) return;
    const currentIdx = MODE_ORDER.indexOf(aureMode);
    const requestedIdx = MODE_ORDER.indexOf(mode);
    if (requestedIdx >= 0 && requestedIdx >= currentIdx) {
      onOverrideMode(mode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Director Console
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              The Studio Core.
            </h1>
          </div>
          <div className={`px-3 py-1 rounded-full border text-xs font-medium ${MODE_BADGE[aureMode]}`}>
            AURE · {aureMode}
          </div>
        </header>

        {/* Dual gauges */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* AURA load */}
          <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              AURA · Mythic Load
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold">{auraPercent}</span>
              <span className="text-sm text-slate-400">/ 100 · resonance index</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  auraPercent < 60
                    ? 'bg-emerald-400'
                    : auraPercent < 80
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(auraPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              High AURA = high narrative voltage. AURE will narrow fork-choice automatically.
            </p>
          </section>

          {/* Sovereign gap */}
          <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              Sovereign Gap · Safe Action Band
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-semibold">{gapPercent}</span>
              <span className="text-sm text-slate-400">/ 100 · overlap</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  gapPercent > 70
                    ? 'bg-emerald-400'
                    : gapPercent > 40
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(gapPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              When the gap narrows, irreversible actions (deletes, cashouts, casting locks) are blocked.
            </p>
          </section>
        </div>

        {/* Overrides + notes */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <section className="flex-1 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              Operator Note
            </p>
            <p className="text-sm text-slate-200 min-h-[3rem]">
              {notes || 'No note logged. Director may annotate this snapshot in the Vault.'}
            </p>
          </section>

          {onOverrideMode && (
            <section className="w-full md:w-52 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
                Human Override
              </p>
              <p className="text-xs text-slate-400">
                Director may <strong>only</strong> step mode <em>downward</em> (from OVERWHELM → RESTORE → MAINTENANCE → BASELINE).
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {MODE_ORDER.slice().reverse().map((mode) => (
                  <button
                    key={mode}
                    disabled={mode === aureMode}
                    onClick={() => handleOverride(mode)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      mode === aureMode
                        ? 'opacity-50 cursor-default border-slate-600 text-slate-400'
                        : 'hover:border-sky-400/80 hover:text-sky-200 border-slate-700 text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
