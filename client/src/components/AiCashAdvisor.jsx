import React from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Cpu,
  BadgePercent,
  Clock,
} from 'lucide-react';

export default function AiCashAdvisor({ onTriggerAction }) {
  const recommendations = [
    {
      id: 'rec-1',
      type: 'opportunity',
      badge: 'Cash Float Optimization',
      title: 'Shift Silicon Precision Bill by 5 Days (Nov 4 → Nov 9)',
      impact: 'Preserves +$12,400 liquidity cushion through payroll window',
      details: 'Vendor allows a 5-day grace period with zero interest or penalty. Moving payment date avoids dipping below your $80k operating target on Nov 4.',
      actionText: 'Apply Float Timing',
      actionType: 'primary',
      icon: Clock,
      color: 'yellow',
    },
    {
      id: 'rec-2',
      type: 'warning',
      badge: 'Late Payment Hedge',
      title: 'Accelerate Invoice #1075 ($9,800) with 2% Early Settlement',
      impact: 'Eliminates 14-day payment lag risk from Helios Logistics',
      details: 'Helios historically accepts prompt-pay discounts 80% of the time, pulling $9,604 into your account 9 days ahead of forecasted baseline.',
      actionText: 'Dispatch 2% Offer',
      actionType: 'warning',
      icon: BadgePercent,
      color: 'amber',
    },
    {
      id: 'rec-3',
      type: 'growth',
      badge: 'Growth Runway Capacity',
      title: 'Surplus Runway: Capacity to safely hire 1 Full-time Engineer',
      impact: 'Runway remains >62 days with +$9,500/mo ongoing burn',
      details: 'Based on recurring pipeline velocity, your business can absorb an additional $114k annual salary while maintaining a 60+ day cash buffer.',
      actionText: 'Model Hiring Burn',
      actionType: 'neutral',
      icon: TrendingUp,
      color: 'gold',
    },
  ];

  return (
    <div className="glass-panel-gold rounded-2xl p-6 relative overflow-hidden border border-yellow-500/25 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-yellow-500/20 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
            <Cpu className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white font-['Outfit'] tracking-tight">
                AI Cash Doctor & Prescriptive Decisions
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-black bg-yellow-400 px-2 py-0.5 rounded-full">
                Active Intelligence
              </span>
            </div>
            <p className="text-xs text-yellow-200/80 mt-0.5">
              Autonomous recommendations synthesized from invoice behavior, vendor agreements, and cash burn.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-yellow-300">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Continuous ML Optimization</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-[#090b10]/80 border border-yellow-500/20 hover:border-yellow-400/50 flex flex-col justify-between transition-all group hover:scale-[1.01]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-md">
                    {rec.badge}
                  </span>
                  <Icon className="w-4 h-4 text-yellow-400" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors line-clamp-2">
                  {rec.title}
                </h4>
                <div className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {rec.impact}
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {rec.details}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => onTriggerAction(rec.actionText)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer bg-white/5 hover:bg-yellow-400 hover:text-black text-white border border-white/10 hover:border-yellow-400 shadow-sm"
                >
                  <span>{rec.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
