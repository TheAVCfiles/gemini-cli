"use client";

import { MemNodeStrip } from "../components/MemNodeStrip";

export default function ConsolePage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#0F0F12] text-slate-50">
      <MemNodeStrip />

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
        <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300 mb-4">
          ATP · AstroTrader Pro · Engine C · Operator Console
        </p>

        <h1 className="text-4xl md:text-5xl font-semibold mb-3">
          AstroTrader Pro Console
        </h1>

        <p className="text-sm text-slate-300 max-w-xl mb-8">
          Cinematic skin. Quant discipline. This console does not predict the
          future. It enforces temperament and regime rules so you stop trading
          like a movie and start trading like an operating system.
        </p>

        {/* Status block */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
              Build Status
            </p>
            <p className="text-sm font-medium mb-1 text-amber-300">
              Operator Mode: Loading
            </p>
            <p className="text-xs text-slate-300">
              V0 UI shell online. Regime engine and order-routing integrations
              are in R&amp;D. This page is the nerve center for everything that
              comes next.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
              Engine Map
            </p>
            <p className="text-xs text-slate-300">
              Temperament inputs → Regime engine → Guard bands → Sizing rules →
              Execution protocol. No signals. No calls. Just structure.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
              Access Tiers
            </p>
            <ul className="space-y-1 text-xs text-slate-300">
              <li>• View-only regime overlays</li>
              <li>• Risk Charter &amp; Protocol Sheets</li>
              <li>• Fund temperament mapping (by engagement)</li>
            </ul>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href="/charter"
            className="px-4 py-2 rounded-lg border border-amber-400/70 text-amber-200"
          >
            View Risk Charter
          </a>
          <a
            href="/protocol"
            className="px-4 py-2 rounded-lg border border-slate-600"
          >
            Open Protocol Sheets
          </a>
          <a
            href="/minute-runner"
            className="px-4 py-2 rounded-lg border border-slate-600"
          >
            Minute Runner · ETH
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-4 text-[11px] text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>© {year} AstroTrader Pro · Myth-tech regimes for real capital.</span>
          <span>Part of AVC Systems Studio · Engine C.</span>
        </div>
      </footer>
    </main>
  );
}
