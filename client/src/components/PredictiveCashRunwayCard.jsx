import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react';
import { calculatePredictiveCashRunway } from '../services/predictiveAnalytics';
import { getStoredFixedExpenses } from '../services/expenseSync';

export default function PredictiveCashRunwayCard() {
  const [todayIncome, setTodayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState(() => getStoredFixedExpenses());

  const [upcomingExpenses, setUpcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [eKhataCustomers, setEKhataCustomers] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_data');
    return saved ? JSON.parse(saved) : [];
  });

  // What-If Simulation Toggle
  const [simulateAllCollections, setSimulateAllCollections] = useState(false);

  // Sync with global events
  useEffect(() => {
    const refreshData = () => {
      try {
        const savedInc = localStorage.getItem('aurum_today_income');
        if (savedInc) setTodayIncome(JSON.parse(savedInc));

        setFixedExpenses(getStoredFixedExpenses());

        const savedUp = localStorage.getItem('aurum_upcoming_expenses');
        if (savedUp) setUpcomingExpenses(JSON.parse(savedUp));

        const savedKhata = localStorage.getItem('aurum_ekhata_data');
        if (savedKhata) setEKhataCustomers(JSON.parse(savedKhata));
      } catch (e) {}
    };

    window.addEventListener('aurum_income_updated', refreshData);
    window.addEventListener('aurum_fixed_expenses_updated', refreshData);
    window.addEventListener('aurum_expenses_updated', refreshData);
    window.addEventListener('aurum_ekhata_updated', refreshData);
    window.addEventListener('storage', refreshData);

    return () => {
      window.removeEventListener('aurum_income_updated', refreshData);
      window.removeEventListener('aurum_fixed_expenses_updated', refreshData);
      window.removeEventListener('aurum_expenses_updated', refreshData);
      window.removeEventListener('aurum_ekhata_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  // Compute analytics using business logic engine
  const analytics = useMemo(() => {
    // If simulation active, inject full collection into starting balance
    const totalPendingUdhar = eKhataCustomers.reduce(
      (sum, c) => sum + Number(c.totalAmount || 0),
      0
    );
    const simulatedStartingCash = simulateAllCollections
      ? 45000 + totalPendingUdhar
      : 45000;

    return calculatePredictiveCashRunway({
      startingBalance: simulatedStartingCash,
      todayIncomeList: todayIncome,
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      eKhataCustomersList: eKhataCustomers,
    });
  }, [todayIncome, fixedExpenses, upcomingExpenses, eKhataCustomers, simulateAllCollections]);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6 font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      {/* Background visual aura */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-linear-to-bl from-amber-100/40 via-yellow-50/20 to-transparent pointer-events-none rounded-bl-full"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center border border-amber-400/30">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
              Predictive Cash Runway & Burn Rate
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center space-x-1 ${
                analytics.runwayStatus === 'SAFE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : analytics.runwayStatus === 'CAUTION'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              <span>● Status: {analytics.runwayStatus}</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time projection balancing daily revenue velocity against amortized commitments and 15-day payables.
          </p>
        </div>

        {/* Estimated Runway Highlight */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Estimated Cash Runway
            </span>
            <div className="flex items-baseline justify-end space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-black font-['Outfit']">
                ~{analytics.runwayDays}
              </span>
              <span className="text-xs font-bold text-neutral-500">Days</span>
            </div>
          </div>

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              analytics.runwayStatus === 'SAFE'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : analytics.runwayStatus === 'CAUTION'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            {analytics.runwayStatus === 'SAFE' ? (
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            ) : analytics.runwayStatus === 'CAUTION' ? (
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            ) : (
              <Flame className="w-6 h-6 stroke-[2]" />
            )}
          </div>
        </div>
      </div>

      {/* 4 Financial Velocity Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Metric 1: Daily Burn Rate */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Daily Outflow Burn
            </span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 font-['Outfit']">
            ₹{analytics.dailyBurnRate.toLocaleString()}
            <span className="text-xs font-normal text-neutral-500"> /day</span>
          </div>
          <span className="text-[10px] text-neutral-400 block">
            Amortized rent, EMI + payables
          </span>
        </div>

        {/* Metric 2: Daily Inflow Velocity */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Daily Inflow Velocity
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 font-['Outfit']">
            ₹{analytics.totalDailyInflow.toLocaleString()}
            <span className="text-xs font-normal text-neutral-500"> /day</span>
          </div>
          <span className="text-[10px] text-neutral-400 block">
            Sales + estimated credit receipts
          </span>
        </div>

        {/* Metric 3: Net Daily Cash Flow */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Net Cash Flow Rate
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div
            className={`text-lg font-black font-['Outfit'] ${
              analytics.netDailyCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {analytics.netDailyCashFlow >= 0 ? '+' : ''}₹
            {analytics.netDailyCashFlow.toLocaleString()}
            <span className="text-xs font-normal text-neutral-500"> /day</span>
          </div>
          <span className="text-[10px] text-neutral-400 block">
            {analytics.netDailyCashFlow >= 0 ? 'Operating cash surplus' : 'Working capital burn'}
          </span>
        </div>

        {/* Metric 4: Liquid Buffer */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Liquid Cash Buffer
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black text-black font-['Outfit']">
            ₹{analytics.liquidCashAvailable.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-400 block">
            Working capital available today
          </span>
        </div>
      </div>

      {/* Advisory & What-If Simulation Row */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50/70 via-yellow-50/40 to-neutral-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 block">{analytics.advisoryTitle}</span>
            <p className="text-[11px] text-amber-900/80 leading-relaxed mt-0.5">
              {analytics.advisoryText}
            </p>
          </div>
        </div>

        {/* What-If Simulation Toggle */}
        <div className="shrink-0 flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200/60">
          <button
            type="button"
            onClick={() => setSimulateAllCollections(!simulateAllCollections)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              simulateAllCollections
                ? 'bg-black text-yellow-300 border border-black shadow-xs'
                : 'bg-white text-neutral-700 hover:text-black border border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>
              {simulateAllCollections ? 'Simulating 100% Udhar Collected' : 'Simulate Udhar Recovery'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
