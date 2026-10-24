import React, { useState } from 'react';
import FinanceHeader from './components/FinanceHeader';
import EKhataPage from './components/EKhataPage';
import ProfileDashboard from './components/ProfileDashboard';
import UpcomingExpensesSection from './components/UpcomingExpensesSection';
import EKhataReceivablesSection from './components/EKhataReceivablesSection';
import PredictiveCashRunwayCard from './components/PredictiveCashRunwayCard';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard', 'ekhata', 'profile', 'login'

  // If user is explicitly logged out, render the Login page
  if (!isAuthenticated || activePage === 'login') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-amber-300 selection:text-black">
        <FinanceHeader activePage="login" setActivePage={setActivePage} />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginPage onLoginSuccess={() => setActivePage('dashboard')} />
        </main>
      </div>
    );
  }

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
            {/* 1. Predictive Cash Runway & Burn Rate Analytics Engine */}
            <PredictiveCashRunwayCard />

            {/* 2. Upcoming Expenses & Scheduled Payables (Near-term liabilities) */}
            <UpcomingExpensesSection />

            {/* 3. eKhata Customer Receivables (Near-term cash inflows & undated udhar) */}
            <EKhataReceivablesSection setActivePage={setActivePage} />
          </div>
        )}
      </main>
    </div>
  );
}
