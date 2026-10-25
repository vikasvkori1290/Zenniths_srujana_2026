import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import EKhataPage from '../components/EKhataPage';

export default function EKhataLedgerPage() {
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
            <span className="text-black font-bold">eKhata Ledger</span>
            <span className="bg-yellow-200 text-black font-bold px-2 py-0.5 rounded-full text-[10px] border border-yellow-400">
              Multilingual Voice AI
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1 sm:pb-0 max-w-full scrollbar-none">
            <Link
              to="/"
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs whitespace-nowrap flex items-center shrink-0"
            >
              &larr; Home Overview
            </Link>
            <Link
              to="/income"
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs whitespace-nowrap flex items-center shrink-0"
            >
              Today's Income &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Render the full eKhata component */}
      <EKhataPage />
    </div>
  );
}
