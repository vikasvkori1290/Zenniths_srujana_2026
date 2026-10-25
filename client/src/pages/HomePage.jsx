import React, { useState, useEffect } from 'react';
import PredictiveCashRunwayCard from '../components/PredictiveCashRunwayCard';
import UpcomingExpensesSection from '../components/UpcomingExpensesSection';
import EKhataReceivablesSection from '../components/EKhataReceivablesSection';
import FirstTimeOnboardingModal from '../components/FirstTimeOnboardingModal';
import { Sliders, Sparkles } from 'lucide-react';
import { loadUserDataFromDb } from '../services/api';

export default function HomePage() {
  // Always ensure fresh data is loaded from MongoDB on page mount
  useEffect(() => {
    loadUserDataFromDb().catch(() => {});
  }, []);

  const [showSetupBanner, setShowSetupBanner] = useState(() => {
    // Only show if user just registered for the first time AND hasn't pressed "Launch My Financial Runway"
    const isFirstTime = localStorage.getItem('finsafe_first_time_setup') === 'true';
    const isCompleted = localStorage.getItem('finsafe_onboarding_completed') === 'true';
    return isFirstTime && !isCompleted;
  });

  useEffect(() => {
    const handleCompleted = () => setShowSetupBanner(false);
    const handleStorage = () => {
      const isFirstTime = localStorage.getItem('finsafe_first_time_setup') === 'true';
      const isCompleted = localStorage.getItem('finsafe_onboarding_completed') === 'true';
      setShowSetupBanner(isFirstTime && !isCompleted);
    };

    window.addEventListener('finsafe_setup_completed', handleCompleted);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('finsafe_setup_completed', handleCompleted);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const triggerWizard = () => {
    window.dispatchEvent(new Event('finsafe_open_setup_wizard'));
  };

  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">
      <FirstTimeOnboardingModal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8 sm:space-y-10">
        {/* Quick Setup Launcher Banner: Shown once for new registrant until Launch Runway is pressed */}
        {showSetupBanner && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-amber-50 via-yellow-50 to-amber-100/60 border border-amber-300/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-black text-yellow-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 fill-yellow-300" />
              </div>
              <div>
                <span className="text-xs font-black text-black block">First-Time Setup & Financial Parameters</span>
                <span className="text-[11px] text-neutral-600 block">Customize opening cash reserves, margin %, and monthly commitments</span>
              </div>
            </div>
            <button
              onClick={triggerWizard}
              className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-black text-black border border-yellow-400 shadow-2xs hover:scale-102 transition-transform cursor-pointer flex items-center justify-center space-x-1.5 min-h-11 sm:min-h-0"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize Store Financials</span>
            </button>
          </div>
        )}

        {/* 1. Predictive Cash Runway & Burn Rate Engine */}
        <section id="runway" className="scroll-mt-20">
          <PredictiveCashRunwayCard />
        </section>

        {/* 2. Upcoming Expenses & Scheduled Payables (15-Day Liabilities) */}
        <section id="payables" className="scroll-mt-20">
          <UpcomingExpensesSection />
        </section>

        {/* 3. Customer Udhar & Near-Term Receivables (Cash Inflows) */}
        <section id="receivables" className="scroll-mt-20">
          <EKhataReceivablesSection />
        </section>
      </div>
    </div>
  );
}
