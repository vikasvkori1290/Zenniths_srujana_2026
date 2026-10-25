import React from 'react';
import PredictiveCashRunwayCard from '../components/PredictiveCashRunwayCard';
import UpcomingExpensesSection from '../components/UpcomingExpensesSection';
import EKhataReceivablesSection from '../components/EKhataReceivablesSection';

export default function HomePage() {
  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">
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
