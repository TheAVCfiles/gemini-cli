# Sovereignty Console React widget

This example shows a self-contained React component that visualizes a "Sovereignty" score calculated from three inputs: control, clarity, and continuum. Each input is normalized to a 0–1 range, multiplied to form the final score, and color-coded into tiers.

- **Control** measures the ratio of self-directed to reactive actions.
- **Clarity** inversely tracks the current noise level (panic, projection, or distraction).
- **Continuum** captures alignment with the long arc or overall intent.

Use it as a drop-in widget for dashboards or prototypes when you want a quick, expressive indicator of systemic stability.

```jsx
import React, { useState, useMemo } from "react";

function boundedScore(n) {
  if (typeof n !== "number" || isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function measureControl(state) {
  return boundedScore(state.selfDirectedRatio);
}

function measureClarity(state) {
  return boundedScore(1 - state.noiseLevel);
}

function measureContinuum(state) {
  return boundedScore(state.longArcAlignment);
}

/**
 * Sovereignty Score 0.0–1.0
 */
function Sovereignty(state = {}) {
  const control = measureControl(state);
  const clarity = measureClarity(state);
  const continuum = measureContinuum(state);
  return control * clarity * continuum;
}

function classifyTier(score) {
  if (score < 0.3) return { tier: "Brittle", color: "#ef4444" };        // red
  if (score < 0.6) return { tier: "Recalibrating", color: "#f97316" };  // amber
  if (score < 0.8) return { tier: "Stable", color: "#22c55e" };         // green
  return { tier: "Locked Axis", color: "#38bdf8" };                     // blue
}

export default function SovereigntyConsole() {
  const [state, setState] = useState({
    selfDirectedRatio: 0.5,
    noiseLevel: 0.5,
    longArcAlignment: 0.5,
  });

  const [log, setLog] = useState([]);

  const score = useMemo(() => Sovereignty(state), [state]);
  const tierInfo = useMemo(() => classifyTier(score), [score]);

  function snapshot() {
    setLog(prev => [
      {
        timestamp: new Date().toISOString(),
        ...state,
        score,
      },
      ...prev.slice(0, 49), // keep last 50
    ]);
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <div className="max-w-4xl w-full p-6 space-y-6 border border-gray-800 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              Sovereignty <span className="text-gray-500">Console</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Control × Clarity × Continuum · 0.0 — 1.0
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              Current Score
            </div>
            <div
              className="px-4 py-2 rounded-lg inline-block"
              style={{ backgroundColor: `${tierInfo.color}22`, border: `1px solid ${tierInfo.color}55` }}
            >
              <div className="text-3xl font-light tabular-nums">
                {score.toFixed(3)}
              </div>
              <div className="text-xs text-gray-300 text-right">
                {tierInfo.tier}
              </div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* CONTROL */}
          <SliderBlock
            label="Control"
            description="Chosen vs reactive behavior"
            value={state.selfDirectedRatio}
            onChange={v => setState(s => ({ ...s, selfDirectedRatio: v }))}
          />

          {/* CLARITY */}
          <SliderBlock
            label="Clarity"
            description="Signal vs panic / projection"
            value={1 - state.noiseLevel}
            onChange={v => setState(s => ({ ...s, noiseLevel: 1 - v }))}
          />

          {/* CONTINUUM */}
          <SliderBlock
            label="Continuum"
            description="Alignment with long arc"
            value={state.longArcAlignment}
            onChange={v => setState(s => ({ ...s, longArcAlignment: v }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={snapshot}
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          >
            Snapshot State
          </button>
          <p className="text-xs text-gray-500">
            Any axis at 0 collapses the fouetté chain.
          </p>
        </div>

        <div className="bg-black/40 border border-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto text-xs">
          {log.length === 0 ? (
            <p className="text-gray-600">
              No snapshots yet. Adjust sliders and hit “Snapshot State”.
            </p>
          ) : (
            <table className="w-full text-[11px]">
              <thead className="text-gray-500">
                <tr>
                  <th className="text-left pr-2">Time</th>
                  <th className="text-right pr-2">Control</th>
                  <th className="text-right pr-2">Clarity</th>
                  <th className="text-right pr-2">Continuum</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {log.map((row, i) => (
                  <tr key={i}>
                    <td className="pr-2 align-top">
                      {new Date(row.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="text-right pr-2">{row.selfDirectedRatio.toFixed(2)}</td>
                    <td className="text-right pr-2">{(1 - row.noiseLevel).toFixed(2)}</td>
                    <td className="text-right pr-2">{row.longArcAlignment.toFixed(2)}</td>
                    <td className="text-right">{row.score.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderBlock({ label, description, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="text-sm text-gray-200">{label}</div>
        <div className="text-xs text-gray-500 tabular-nums">
          {value.toFixed(2)}
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mb-1">{description}</p>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
```

To mount the widget in your own project, import `SovereigntyConsole` into a React application that has Tailwind (or similar) styles available. The component keeps its own slider state and logs up to 50 snapshots locally for quick iteration demos.
