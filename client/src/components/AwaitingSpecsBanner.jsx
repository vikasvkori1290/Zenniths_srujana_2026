import React from 'react';
import {
  Code2,
  Terminal,
  Cpu,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';

export default function AwaitingSpecsBanner({ onSelectSpecArea }) {
  const readyModules = [
    {
      id: 'ml_models',
      title: 'ML Forecasting & Statistical Models',
      desc: 'ARIMA, Prophet, Monte Carlo, or custom cash variance neural networks.',
      status: 'Ready to Mount',
    },
    {
      id: 'banking_ledger',
      title: 'Bank & ERP Ingestion Engines',
      desc: 'Plaid, QuickBooks, Xero, Stripe, or custom CSV/OFX transactional sync.',
      status: 'Connector Ready',
    },
    {
      id: 'scenario_stress',
      title: 'Scenario & Stress-Testing Rules',
      desc: 'Configurable shock tests: inflation, customer insolvency, supply price jumps.',
      status: 'Simulator Ready',
    },
    {
      id: 'ar_automation',
      title: 'Autonomous Invoicing & Early Pay',
      desc: 'Dynamic APR discount rules, automated WhatsApp/SMS debtor reminders.',
      status: 'Workflow Ready',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-yellow-400/30 shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
              System Ready for Your Blueprint
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit'] mt-1">
            Predictive Cash Engine Shell Initialized
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            The high-contrast Black, White, Gold, and Yellow UI system is locked and fully responsive. Tell me what specific logic, models, backend endpoints, or SMB workflows to wire up next.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-xl bg-black/60 border border-yellow-400/30 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono text-yellow-300">Awaiting your specs...</span>
          </div>
        </div>
      </div>

      {/* Suggested Architecture Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {readyModules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => onSelectSpecArea(mod.title)}
            className="p-4 rounded-xl bg-white/2 hover:bg-white/6 border border-white/5 hover:border-yellow-400/40 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                {mod.status}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-400 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors">
              {mod.title}
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {mod.desc}
            </p>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-yellow-400/80 group-hover:text-yellow-300">
              <span>Specify requirements</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
