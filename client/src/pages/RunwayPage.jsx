import React from 'react';
import { TrendingUp, ArrowLeft, ShieldCheck, Sparkles, Zap, Info } from 'lucide-react';
import PredictiveCashRunwayCard from '../components/PredictiveCashRunwayCard';

export default function RunwayPage() {
  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Predictive Cash Runway & Burn Rate Engine
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              Calculates daily net cash burn, projected runway safety days, and interactive recovery simulation when customer debts are recovered.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Real-time Inflow / Outflow Velocity</span>
            </div>
          </div>
        </div>

        {/* Predictive Runway Component */}
        <PredictiveCashRunwayCard />

        {/* Explanatory / Formula card */}
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/80 flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-600 space-y-1">
            <span className="font-bold text-black block">How the Predictive Engine Works:</span>
            <p>
              Runway Days is calculated as <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-800 font-mono">Current Cash ÷ (Daily Outflow Burn - Daily Inflow Velocity)</code>. 
              The interactive slider dynamically projects your survival horizon under 0% to 100% eKhata udhar collection scenarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
