"use client";

import { compileTransit } from "@/deck/compiler";
import { POEM_MAP } from "@/deck/poems";

export default function RegimeCardPage() {
  // TEMP: hard-code a transit; later you plug in real ephemeris
  const transit = { sign: "Gemini", degree: 12, planet: "Moon" };
  const { minor, major } = compileTransit(transit);

  const minorPoem = minor?.poem_slot ? POEM_MAP[minor.poem_slot] : null;
  const majorPoem = major?.poem_slot ? POEM_MAP[major.poem_slot] : null;

  return (
    <main className="min-h-screen bg-[#0F0F12] text-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300 mb-2">
            DeCrypt the Girl · Myth-Tech Deck
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Regime Card · Today
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Transit: {transit.planet} {transit.degree}° {transit.sign}
          </p>
          <p className="text-[11px] text-amber-200 mt-1">
            Product lane: Daily Regime Card · weekly digest hook.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          {minor && (
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-sky-300 mb-1">
                Minor Decan
              </p>
              <h2 className="text-lg font-semibold mb-1">{minor.name}</h2>
              <p className="text-[11px] text-slate-400 mb-2">
                {minor.element} · {minor.astro.key} · {minor.poem_slot}
              </p>
              <p className="text-xs text-emerald-200">↑ {minor.upright}</p>
              <p className="text-xs text-pink-200">↯ {minor.shadow}</p>
            </div>
          )}

          {major && (
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300 mb-1">
                Major · Planetary
              </p>
              <h2 className="text-lg font-semibold mb-1">{major.name}</h2>
              <p className="text-[11px] text-slate-400 mb-2">
                {major.astro.key} · {major.poem_slot}
              </p>
              <p className="text-xs text-emerald-200">↑ {major.upright}</p>
              <p className="text-xs text-pink-200">↯ {major.shadow}</p>
            </div>
          )}
        </section>

        {(minorPoem || majorPoem) && (
          <section className="bg-slate-950/80 border border-slate-700 rounded-xl p-4 text-xs">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
              ScrollOS · Narrative Hook
            </p>
            {minorPoem && <p className="text-slate-200">Minor thread: {minorPoem}</p>}
            {majorPoem && <p className="text-slate-200">Major thread: {majorPoem}</p>}
          </section>
        )}

        <section className="bg-black/60 border border-amber-500/40 rounded-xl p-4 text-xs">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300 mb-1">
            Engine-C · Operator Note
          </p>
          <p className="text-slate-200 mb-1">Treat today&apos;s regime as:</p>
          <p className="text-amber-100">{minor?.upright} × {major?.upright} → risk tilt.</p>
          <p className="text-slate-400 mt-2">Shadow watch: {minor?.shadow} / {major?.shadow}</p>
        </section>
      </div>
    </main>
  );
}
