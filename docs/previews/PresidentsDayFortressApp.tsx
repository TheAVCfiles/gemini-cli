import React, { useState } from 'react';

export default function PresidentsDayFortressApp() {
  const [pVal, setPVal] = useState(0.33);
  const [weight, setWeight] = useState(92);
  const ciRange = { lower: 1.2, upper: 5.8 };

  const isStructuralConfirmed = weight >= 80;
  const isCiValid = (ciRange.lower > 0 && ciRange.upper > 0) || (ciRange.lower < 0 && ciRange.upper < 0);
  const isPValuePass = pVal < 0.05;
  const isRegimeOpen = isStructuralConfirmed && isCiValid && isPValuePass;

  return (
    <main>
      <h1>Presidents Day Fortress v2.1</h1>
      <p>Institutional Confidence Filter</p>
      <p>Regime: {isRegimeOpen ? 'OPEN' : 'CLOSED_DEFENSIVE'}</p>

      <label>
        p-value
        <input type="range" min="0" max="1" step="0.01" value={pVal} onChange={(e) => setPVal(Number(e.target.value))} />
      </label>
      <label>
        Structural Weight
        <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value || 0))} />
      </label>
    </main>
  );
}
