import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, ShieldAlert, CreditCard } from 'lucide-react';
import UpcomingExpensesSection from '../components/UpcomingExpensesSection';

export default function UpcomingExpensesPage() {
  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-neutral-200/80 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <Link to="/" className="font-semibold text-neutral-700 hover:text-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-black font-bold">Upcoming Payables</span>
            <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-rose-300">
              15-Day Cash Liabilities
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/fixed-expenses"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs"
            >
              Monthly Fixed Expenses &rarr;
            </Link>
            <Link
              to="/runway"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs"
            >
              Runway Forecast &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
                <Calendar className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Upcoming Expenses & Scheduled Payables
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              All financial outlays due within the next 15 days, automatically combining vendor raw materials, tax filing dates, and synchronized monthly rent/EMIs.
            </p>
          </div>
        </div>

        {/* Dedicated Upcoming Expenses Component */}
        <UpcomingExpensesSection />
      </div>
    </div>
  );
}
