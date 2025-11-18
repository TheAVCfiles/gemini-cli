import React, { useState } from 'react';
import StageportFacultyPage from './components/StageportFacultyPage.jsx';

export default function App() {
  const [showStageport, setShowStageport] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowStageport((s) => !s)}
            className={`px-4 py-2 text-sm rounded-full ${
              showStageport ? 'bg-amber-600 text-black' : 'bg-indigo-600 text-white'
            }`}
          >
            {showStageport ? 'Back to Roster' : 'Pyrouette Stageport Demo'}
          </button>
        </div>

        {showStageport ? (
          <StageportFacultyPage />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Existing roster view</h2>
            <p className="text-slate-300">
              Toggle the button above to explore the Pyrouette Stageport demo experience.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
