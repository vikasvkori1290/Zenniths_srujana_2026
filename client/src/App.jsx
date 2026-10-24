import React, { useState } from 'react';
import FinanceHeader from './components/FinanceHeader';
import EKhataPage from './components/EKhataPage';

export default function App() {
  const [activePage, setActivePage] = useState('ekhata'); // default to eKhata page as requested

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-amber-300 selection:text-black">
      {/* Sleek White, Black, Yellow & Golden Navbar */}
      <FinanceHeader activePage={activePage} setActivePage={setActivePage} />

      {/* Main Page Area */}
      <main className="flex-1 w-full bg-white">
        {activePage === 'ekhata' ? (
          <EKhataPage />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
            <h2 className="text-xl font-bold font-['Outfit'] text-black">
              Workspace Overview
            </h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Click on the <strong className="text-black">eKhata</strong> section in the navbar above to manage your customer credit ledger with voice commands.
            </p>
            <button
              onClick={() => setActivePage('ekhata')}
              className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400"
            >
              Open eKhata Page &rarr;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
