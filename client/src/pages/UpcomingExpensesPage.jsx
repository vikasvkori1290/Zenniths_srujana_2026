import React from 'react';
import { Calendar, ArrowLeft, ArrowRight, ShieldAlert, CreditCard } from 'lucide-react';
import UpcomingExpensesSection from '../components/UpcomingExpensesSection';

export default function UpcomingExpensesPage() {
  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">

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
