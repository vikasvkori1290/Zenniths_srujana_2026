import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Wallet, Sparkles, ArrowRight } from 'lucide-react';
import PredictiveCashRunwayCard from '../components/PredictiveCashRunwayCard';
import UpcomingExpensesSection from '../components/UpcomingExpensesSection';
import EKhataReceivablesSection from '../components/EKhataReceivablesSection';

export default function HomePage() {
  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">
      {/* Top Banner / Breadcrumbs & Quick Switches */}
      <div className="border-b border-neutral-200/80 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            <span className="text-black font-extrabold">Home</span>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">Cash Radar & Liabilities</span>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-300">
              Runway • Payables • Receivables
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
            <Link
              to="/profile"
              className="min-h-[40px] px-3 py-2 rounded-xl font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs flex items-center shrink-0"
            >
              Profile & Overview &rarr;
            </Link>
            <Link
              to="/income"
              className="min-h-[40px] px-3 py-2 rounded-xl font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-emerald-400 hover:text-black transition-all shadow-2xs flex items-center shrink-0"
            >
              Today's Income &rarr;
            </Link>
            <Link
              to="/fixed-expenses"
              className="min-h-[40px] px-3 py-2 rounded-xl font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs flex items-center shrink-0"
            >
              Fixed Commitments &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
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
