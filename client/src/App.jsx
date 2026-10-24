import React, { useState } from 'react';
import FinanceHeader from './components/FinanceHeader';
import EKhataPage from './components/EKhataPage';
import ProfileDashboard from './components/ProfileDashboard';
import UpcomingExpensesSection from './components/UpcomingExpensesSection';
import EKhataReceivablesSection from './components/EKhataReceivablesSection';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard'); // Default to Home / Overview

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-amber-300 selection:text-black">
      {/* Sleek White, Black, Yellow & Golden Navbar */}
      <FinanceHeader activePage={activePage} setActivePage={setActivePage} />

      {/* Main Page Area */}
      <main className="flex-1 w-full bg-white">
        {activePage === 'profile' ? (
          <ProfileDashboard setActivePage={setActivePage} />
        ) : activePage === 'ekhata' ? (
          <EKhataPage />
        ) : (
          /* Home / Overview Page */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <UpcomingExpensesSection />
            <EKhataReceivablesSection setActivePage={setActivePage} />
          </div>
        )}
      </main>
    </div>
  );
}
