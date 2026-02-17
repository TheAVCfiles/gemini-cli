import React, { useState } from 'react';
import FacilityOSCathedral from './components/FacilityOSCathedral.jsx';
import StageportFacultyPage from './components/StageportFacultyPage.jsx';
import DirectorConsole from './components/DirectorConsole.jsx';

export default function App() {
  const [view, setView] = useState('facility');
  const [snapshot, setSnapshot] = useState({
    auraLoad: 0.68,
    aureMode: 'MAINTENANCE',
    sovereignGap: 0.62,
    notes: 'Somatic flag quiet. Holding maintenance while scene stitches.',
  });

  const handleOverrideMode = (mode) => {
    const order = ['OVERWHELM', 'RESTORE', 'MAINTENANCE', 'BASELINE'];
    const currentIdx = order.indexOf(snapshot.aureMode);
    const requestedIdx = order.indexOf(mode);

    if (requestedIdx >= currentIdx) {
      setSnapshot((prev) => ({ ...prev, aureMode: mode }));
    }
  };

  return (
    <div className="relative">
      <div className="fixed top-3 right-3 z-50 flex gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
        <button
          onClick={() => setView('facility')}
          className={`px-3 py-2 border border-slate-700 bg-slate-900/70 text-white ${view === 'facility' ? 'opacity-100' : 'opacity-60'}`}
        >
          Facility OS
        </button>
        <button
          onClick={() => setView('faculty')}
          className={`px-3 py-2 border border-slate-700 bg-slate-900/70 text-white ${view === 'faculty' ? 'opacity-100' : 'opacity-60'}`}
        >
          Faculty Vault
        </button>
        <button
          onClick={() => setView('director')}
          className={`px-3 py-2 border border-slate-700 bg-slate-900/70 text-white ${view === 'director' ? 'opacity-100' : 'opacity-60'}`}
        >
          Director Console
        </button>
      </div>
      {view === 'facility' && <FacilityOSCathedral />}
      {view === 'faculty' && <StageportFacultyPage />}
      {view === 'director' && (
        <DirectorConsole
          snapshot={snapshot}
          onOverrideMode={handleOverrideMode}
        />
      )}
    </div>
  );
}
