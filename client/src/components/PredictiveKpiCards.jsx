import React from 'react';
import {
  Wallet,
  Hourglass,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CalendarClock,
  Sparkles,
} from 'lucide-react';

export default function PredictiveKpiCards({ metrics, activeScenario }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Current Liquid Cash */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-400/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-400/5 rounded-full blur-2xl group-hover:bg-yellow-400/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-white/5 text-yellow-400 border border-white/10 group-hover:border-yellow-400/30">
              <Wallet className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Liquid Cash
            </span>
          </div>
          <span className="flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            +$4.8k today
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            ${metrics.currentCash.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>3 Accounts Synced</span>
            <span className="text-slate-300 font-medium">Real-time Balance</span>
          </div>
        </div>
      </div>

      {/* 2. Predictive Cash Runway */}
      <div className="glass-panel-gold p-5 rounded-2xl relative overflow-hidden group transition-all duration-300">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
              <Hourglass className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-yellow-200 tracking-wide uppercase">
              Runway (AI)
            </span>
          </div>
          <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-black bg-yellow-400 px-2 py-0.5 rounded-full shadow-sm">
            <ShieldCheck className="w-3 h-3 text-black" />
            <span>Optimal</span>
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
              {metrics.runwayDays}
            </span>
            <span className="text-sm font-bold text-yellow-400">Days</span>
          </div>
          {/* Visual runway bar */}
          <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-yellow-500/30">
            <div
              className="h-full bg-linear-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.runwayDays / 90) * 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-yellow-200/80">
            <span>Target: &gt;45 days</span>
            <span>Burn: ${metrics.dailyBurn}/d</span>
          </div>
        </div>
      </div>

      {/* 3. Predicted 30-Day Net Flow */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-400/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-white/5 text-amber-400 border border-white/10 group-hover:border-yellow-400/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Projected Net Flow
            </span>
          </div>
          <span className="text-[10px] font-semibold text-yellow-400/90 bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20">
            92% Confidence
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-white font-['Outfit'] tracking-tight flex items-center space-x-1.5">
            <span className="text-emerald-400">+${metrics.projectedNetFlow.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="text-emerald-400/90 font-medium">In: +${(metrics.projectedInflow / 1000).toFixed(1)}k</span>
            <span className="text-rose-400/90 font-medium">Out: -${(metrics.projectedOutflow / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      {/* 4. Projected Cash Trough */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-400/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-white/5 text-yellow-400 border border-white/10 group-hover:border-yellow-400/30">
              <CalendarClock className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Predicted Trough
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            Lowest Dip
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            ${metrics.troughAmount.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-yellow-400 font-medium">{metrics.troughDate}</span>
            <span className="text-slate-400">+$34.8k over buffer</span>
          </div>
        </div>
      </div>

      {/* 5. Invoices at Risk / Delay Hazard */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              AR Delay Hazard
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
            2 Invoices
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-amber-300 font-['Outfit'] tracking-tight">
            ${metrics.arAtRisk.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Predicted 8d late</span>
            <span className="text-yellow-400 hover:underline cursor-pointer">Auto-Nudge &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
