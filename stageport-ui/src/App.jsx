import React, { useState } from 'react';
import FacilityOSCathedral from './components/FacilityOSCathedral.jsx';
import StageportFacultyPage from './components/StageportFacultyPage.jsx';

export default function App() {
  const [view, setView] = useState('facility');

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
      </div>
      {view === 'facility' ? <FacilityOSCathedral /> : <StageportFacultyPage />}
    </div>
  );
}
