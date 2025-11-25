"use client";

import React from "react";

const nodes = [
  { label: "Core", status: "Online" },
  { label: "Tempos", status: "Live" },
  { label: "Regime", status: "Mapping" },
  { label: "Sizing", status: "Calibrating" },
  { label: "Execution", status: "Guarded" },
];

export function MemNodeStrip() {
  return (
    <div className="border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto text-xs text-slate-300">
        {nodes.map((node) => (
          <div
            key={node.label}
            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300">
              {node.label}
            </span>
            <span className="text-[11px] text-slate-200">{node.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
