import React from 'react';
import { Wallet, ArrowLeft, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import EKhataReceivablesSection from '../components/EKhataReceivablesSection';

export default function ReceivablesPage() {
  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Wallet className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Customer Udhar & Near-Term Receivables
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              Tracks customer credit amounts due within 15 days as well as undated open accounts. Settle payments with 1-click and immediately credit them to Today's Income.
            </p>
          </div>
        </div>

        {/* Dedicated Receivables Component */}
        <EKhataReceivablesSection />
      </div>
    </div>
  );
}
