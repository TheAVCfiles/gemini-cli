import React, { useState } from 'react';
import StageportFacultyPage from './components/StageportFacultyPage.jsx';
import MoveMintCard from './components/MoveMintCard.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('stageport');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => setCurrentView('stageport')}
            className={`px-4 py-2 text-sm rounded-full ${
              currentView === 'stageport' ? 'bg-amber-600 text-black' : 'bg-gray-700 text-white'
            }`}
          >
            Pyrouette Stageport
          </button>
          <button
            onClick={() => setCurrentView('movemint')}
            className={`px-4 py-2 text-sm rounded-full ${
              currentView === 'movemint' ? 'bg-amber-600 text-black' : 'bg-gray-700 text-white'
            }`}
          >
            MoveMint Ledger
          </button>
          <button
            onClick={() => setCurrentView('roster')}
            className={`px-4 py-2 text-sm rounded-full ${
              currentView === 'roster' ? 'bg-amber-600 text-black' : 'bg-gray-700 text-white'
            }`}
          >
            Roster View
          </button>
        </div>

        {currentView === 'stageport' && <StageportFacultyPage />}

        {currentView === 'movemint' && <MoveMintCard />}

        {currentView === 'roster' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Existing roster view</h2>
            <p className="text-slate-300">
              Toggle the buttons above to explore the Pyrouette Stageport demo experience.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
