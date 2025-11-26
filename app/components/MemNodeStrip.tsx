"use client";

import React from "react";

type NodeStatus = "online" | "pending" | "offline";

interface StripNode {
  id: string;
  label: string;
  status: NodeStatus;
  hint?: string;
}

const statusStyles: Record<NodeStatus, string> = {
  online: "bg-emerald-400/80 text-emerald-950 border-emerald-300/60",
  pending: "bg-amber-300/70 text-amber-950 border-amber-200/60",
  offline: "bg-slate-700 text-slate-200 border-slate-500/60",
};

const statusPulse: Record<NodeStatus, string> = {
  online: "animate-pulse",
  pending: "animate-pulse",
  offline: "",
};

const nodes: StripNode[] = [
  { id: "a", label: "Temperament", status: "online", hint: "Inputs streaming" },
  { id: "b", label: "Regime", status: "pending", hint: "Calibration" },
  { id: "c", label: "Guard Bands", status: "pending", hint: "Draft rules" },
  { id: "d", label: "Sizing", status: "offline", hint: "Route locked" },
  { id: "e", label: "Execution", status: "offline", hint: "Awaiting uplink" },
];

export function MemNodeStrip() {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 shadow-inner">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-3">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Engine C · Memory Line</div>
        <div className="flex flex-wrap gap-2">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 shadow-lg shadow-amber-900/10"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-2.5 w-2.5 items-center justify-center rounded-full border ${statusStyles[node.status]} ${statusPulse[node.status]}`}
                />
                <p className="text-sm font-medium text-slate-100">{node.label}</p>
              </div>
              {node.hint ? (
                <p className="mt-1 text-[11px] text-slate-400">{node.hint}</p>
              ) : null}
              <div className="absolute inset-x-0 -bottom-6 h-12 bg-gradient-to-t from-amber-400/10 via-amber-300/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
