import React, { useState } from 'react';
import FinanceHeader from './components/FinanceHeader';
import EKhataPage from './components/EKhataPage';
import ProfileDashboard from './components/ProfileDashboard';
import { BookOpen, User, ArrowRight, TrendingUp } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('profile'); // Can default to profile or ekhata

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
          /* Workspace Overview */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                AurumFlow Financial Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-black tracking-tight">
                Enterprise Merchant Overview
              </h2>
              <p className="text-xs text-neutral-500">
                Choose a module to navigate directly to your daily accounts, voice credit ledger, or financial profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Profile Card */}
              <div
                onClick={() => setActivePage('profile')}
                className="p-6 rounded-3xl bg-neutral-50/80 border border-neutral-200/90 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-black text-yellow-300 flex items-center justify-center font-bold mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-black font-['Outfit'] mb-1">
                    Profile Dashboard
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Track your <strong>Today's Income</strong>, manage <strong>Monthly Fixed Expenses</strong> (Rent, EMI), plan <strong>Upcoming Expenses</strong>, and monitor <strong>Cash to Receive</strong>.
                  </p>
                </div>

                <div className="mt-6 flex items-center text-xs font-bold text-amber-600 group-hover:text-amber-700">
                  <span>Open Profile Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* eKhata Card */}
              <div
                onClick={() => setActivePage('ekhata')}
                className="p-6 rounded-3xl bg-neutral-50/80 border border-neutral-200/90 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-yellow-300 text-black flex items-center justify-center font-bold mb-4 border border-yellow-400 shadow-sm group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-black font-['Outfit'] mb-1">
                    eKhata Smart Voice Ledger
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Voice-enabled customer credit ledger. Add and track udhar, customer dues, and payment histories using AI voice commands.
                  </p>
                </div>

                <div className="mt-6 flex items-center text-xs font-bold text-neutral-800 group-hover:text-black">
                  <span>Open eKhata Ledger</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
