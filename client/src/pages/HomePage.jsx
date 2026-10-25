import React, { useState, useEffect, useMemo } from 'react';
import PredictiveCashRunwayCard from '../components/PredictiveCashRunwayCard';
import UpcomingExpensesSection from '../components/UpcomingExpensesSection';
import EKhataReceivablesSection from '../components/EKhataReceivablesSection';
import FirstTimeOnboardingModal from '../components/FirstTimeOnboardingModal';
import { Sliders, Sparkles, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { loadUserDataFromDb } from '../services/api';
import { calculatePredictiveCashRunway } from '../services/predictiveAnalytics';

export default function HomePage() {
  // Always ensure fresh data is loaded from MongoDB on page mount
  useEffect(() => {
    loadUserDataFromDb().catch(() => {});
  }, []);

  const [stockSyncKey, setStockSyncKey] = useState(0);

  useEffect(() => {
    const handleSync = () => setStockSyncKey((k) => k + 1);
    window.addEventListener('aurum_stock_reserve_updated', handleSync);
    window.addEventListener('aurum_expenses_updated', handleSync);
    window.addEventListener('aurum_fixed_expenses_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('aurum_stock_reserve_updated', handleSync);
      window.removeEventListener('aurum_expenses_updated', handleSync);
      window.removeEventListener('aurum_fixed_expenses_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const stockReserve = useMemo(() => {
    try {
      const todayIncome = JSON.parse(localStorage.getItem('aurum_today_income') || '[]');
      const allFixed = JSON.parse(localStorage.getItem('aurum_fixed_expenses') || '[]');
      const khata = JSON.parse(localStorage.getItem('aurum_ekhata_data') || '[]');
      const up = JSON.parse(localStorage.getItem('aurum_upcoming_expenses') || '[]');
      const isFestivalOn = localStorage.getItem('aurum_festival_toggle') !== 'false';
      const analytics = calculatePredictiveCashRunway({
        todayIncomeList: todayIncome,
        fixedExpensesList: allFixed,
        upcomingExpensesList: up,
        eKhataCustomersList: khata,
        isFestivalAdjustmentOn: isFestivalOn,
      });
      return analytics.stockReserve;
    } catch (e) {
      return null;
    }
  }, [stockSyncKey]);

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

        {/* Stock Reserve Borrowing Alert Card on Home */}
        {stockReserve?.triggered && (
          <div
            className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all animate-in fade-in ${
              stockReserve.status === 'RISK'
                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                : stockReserve.status === 'WATCH'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    stockReserve.status === 'RISK'
                      ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                      : stockReserve.status === 'WATCH'
                      ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                  }`}
                >
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-black font-['Outfit'] tracking-tight">
                      Stock money borrowed: Rs {stockReserve.restockAmount?.toLocaleString()}, restock scheduled {stockReserve.restockPlan?.earliestDate}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300">
                      ⚡ Auto
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        stockReserve.status === 'RISK'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : stockReserve.status === 'WATCH'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      Status: {stockReserve.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Customer Khata cash was borrowed to pay {stockReserve.triggerDue?.primaryDueTitle || 'scheduled liability'} on {stockReserve.triggerDue?.date}.
                    {stockReserve.restockPlan?.isSplit && ` (Split into ${stockReserve.restockPlan.splitCount} instalments)`}
                  </p>
                  {stockReserve.status === 'RISK' && (
                    <div className="text-xs font-bold text-rose-700 flex items-center space-x-1.5 pt-0.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>
                        Buffer breach: arrange Rs {stockReserve.restockPlan?.gap?.toLocaleString()} by {stockReserve.restockPlan?.minLaterDate} (Path B options available below).
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="#payables"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-neutral-800 hover:text-black border border-neutral-300 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
                >
                  View in Payables
                </a>
                <a
                  href="#runway"
                  className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-2xs cursor-pointer hover:scale-102 transition-transform flex items-center space-x-1"
                >
                  <span>Compare Paths</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
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
