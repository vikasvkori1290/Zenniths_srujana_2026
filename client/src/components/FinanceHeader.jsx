import React from 'react';
import {
  TrendingUp,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';

export default function FinanceHeader({ activePage, setActivePage }) {
  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-white/95 backdrop-blur-xl border-b border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => setActivePage('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-sm border border-yellow-400/40 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-black font-['Outfit']">
                AURUM<span className="text-amber-500">FLOW</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-neutral-600 bg-neutral-100 ml-2 px-1.5 py-0.5 rounded border border-neutral-200">
                Predictive Cash
              </span>
            </div>
          </div>
        </div>

        {/* Center / Navigation Sections (Overview & eKhata only, Profile button removed) */}
        <nav className="flex items-center space-x-2">
          {/* Dashboard / Overview button */}
          <button
            onClick={() => setActivePage('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'dashboard'
                ? 'bg-neutral-100 text-black border border-neutral-300 font-bold'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
            }`}
          >
            Overview
          </button>

          {/* eKhata Button */}
          <button
            onClick={() => setActivePage('ekhata')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer shadow-sm ${
              activePage === 'ekhata'
                ? 'bg-black text-yellow-300 border border-black shadow-md'
                : 'bg-yellow-300 hover:bg-yellow-400 text-black border border-yellow-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>eKhata</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          </button>
        </nav>

        {/* Right Info / User context */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-1.5 text-neutral-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Voice Ledger Active</span>
          </div>

          {/* Profile Icon Named VK (Clicking opens Profile Dashboard) */}
          <button
            onClick={() => setActivePage(activePage === 'profile' ? 'ekhata' : 'profile')}
            title="Profile Dashboard (VK)"
            className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              activePage === 'profile'
                ? 'bg-black text-yellow-300 ring-2 ring-yellow-400 shadow-md scale-105'
                : 'bg-black text-yellow-300 border-2 border-yellow-400 hover:scale-105'
            }`}
          >
            VK
          </button>
        </div>
      </div>
    </header>
  );
}
