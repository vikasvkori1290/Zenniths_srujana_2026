import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Calendar,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Coins,
} from 'lucide-react';

export default function InflowOutflowMatrix() {
  const [activeTab, setActiveTab] = useState('all'); // all, inflows, outflows
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-1092',
      client: 'Apex Industrial Robotics',
      amount: 18400,
      nominalDue: 'Nov 02',
      predictedDate: 'Nov 03',
      confidence: 96,
      status: 'On-Track',
      riskLevel: 'low',
      note: 'Client pays consistently within 48h of invoice date.',
    },
    {
      id: 'INV-1088',
      client: 'Vanguard Retail Systems',
      amount: 14200,
      nominalDue: 'Nov 06',
      predictedDate: 'Nov 14',
      confidence: 72,
      status: 'Delayed Risk',
      riskLevel: 'medium',
      note: 'Historic payment cycle indicates 8-day typical payment lag.',
    },
    {
      id: 'INV-1104',
      client: 'Krypton Creative Agency',
      amount: 28500,
      nominalDue: 'Nov 18',
      predictedDate: 'Nov 19',
      confidence: 91,
      status: 'On-Track',
      riskLevel: 'low',
      note: 'Retainer approved by finance department.',
    },
    {
      id: 'INV-1075',
      client: 'Helios Logistics Group',
      amount: 9800,
      nominalDue: 'Oct 29',
      predictedDate: 'Nov 08',
      confidence: 45,
      status: 'High Hazard',
      riskLevel: 'high',
      note: 'Past 3 invoices delayed by 14+ days. Early reminder recommended.',
    },
  ]);

  const [outflows, setOutflows] = useState([
    {
      id: 'BILL-4091',
      vendor: 'Core Team Payroll & Benefits',
      amount: 22500,
      due: 'Nov 01',
      recommendedDate: 'Nov 01',
      flexibility: 'Rigid Deadline',
      category: 'Payroll',
      floatImpact: 'Zero float possible',
    },
    {
      id: 'BILL-4085',
      vendor: 'Silicon Precision Components',
      amount: 12400,
      due: 'Nov 04',
      recommendedDate: 'Nov 09',
      flexibility: '5-Day Grace Float',
      category: 'Suppliers',
      floatImpact: 'Saves $12.4k float through payroll dip',
    },
    {
      id: 'BILL-4102',
      vendor: 'Amazon Web Services Cloud',
      amount: 3850,
      due: 'Nov 10',
      recommendedDate: 'Nov 10',
      flexibility: 'Auto-Debit',
      category: 'Infrastructure',
      floatImpact: 'Fixed recurring',
    },
    {
      id: 'BILL-4078',
      vendor: 'Urban Heights Commercial Lease',
      amount: 8200,
      due: 'Nov 15',
      recommendedDate: 'Nov 15',
      flexibility: 'Rigid Deadline',
      category: 'Facilities',
      floatImpact: 'Zero float possible',
    },
  ]);

  const [actionNotice, setActionNotice] = useState(null);

  const handleAction = (message) => {
    setActionNotice(message);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
      {/* Toast Alert */}
      {actionNotice && (
        <div className="absolute top-4 right-4 z-30 bg-black/90 border border-yellow-400 text-yellow-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-white font-['Outfit'] tracking-tight">
              Predictive Cash Matrix: Inflows vs Outflows
            </h3>
            <span className="text-[10px] font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full">
              Smart float engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine learning predicts invoice collection delays and calculates optimal disbursement timing to preserve cash runway.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-yellow-400 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Ledger
          </button>
          <button
            onClick={() => setActiveTab('inflows')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all ${
              activeTab === 'inflows' ? 'bg-emerald-400 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Receivables (AR)
          </button>
          <button
            onClick={() => setActiveTab('outflows')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all ${
              activeTab === 'outflows' ? 'bg-amber-400 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Payables (AP)
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns for Inflows and Outflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Column 1: Predicted Inflows (AR) */}
        {(activeTab === 'all' || activeTab === 'inflows') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white font-['Outfit']">
                  Predicted Inflows (Next 30 Days)
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                +$70,900
              </span>
            </div>

            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-yellow-400/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">{inv.id}</span>
                        <span className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors">
                          {inv.client}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{inv.note}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        +${inv.amount.toLocaleString()}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                          inv.riskLevel === 'low'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : inv.riskLevel === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-4 text-[11px]">
                      <span className="text-slate-400">
                        Invoice Due: <strong className="text-slate-300">{inv.nominalDue}</strong>
                      </span>
                      <span className="text-slate-400">
                        AI Predicted: <strong className="text-yellow-400">{inv.predictedDate}</strong>
                      </span>
                      <span className="text-slate-400">
                        Confidence: <strong className="text-slate-200">{inv.confidence}%</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {inv.riskLevel !== 'low' ? (
                        <button
                          onClick={() => handleAction(`Automated Smart Reminder queued for ${inv.client}`)}
                          className="px-2.5 py-1 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Smart Reminder</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(`Early-Pay discount (2/10 Net 30) offered to ${inv.client}`)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <Percent className="w-3 h-3 text-yellow-400" />
                          <span>2% Fast-Pay</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column 2: Predicted Outflows (AP) */}
        {(activeTab === 'all' || activeTab === 'outflows') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white font-['Outfit']">
                  Scheduled Outflows & Smart Float
                </span>
              </div>
              <span className="font-mono text-rose-400 font-bold text-sm">
                -$46,950
              </span>
            </div>

            <div className="space-y-3">
              {outflows.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-amber-400/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">{bill.id}</span>
                        <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {bill.vendor}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          {bill.category}
                        </span>
                        <span className="text-[11px] text-yellow-300/80">{bill.floatImpact}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        -${bill.amount.toLocaleString()}
                      </div>
                      <span className="inline-block text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full mt-1">
                        {bill.flexibility}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-4 text-[11px]">
                      <span className="text-slate-400">
                        Invoice Due: <strong className="text-slate-300">{bill.due}</strong>
                      </span>
                      <span className="text-slate-400">
                        AI Recommended Pay: <strong className="text-yellow-400">{bill.recommendedDate}</strong>
                      </span>
                    </div>

                    <div>
                      {bill.recommendedDate !== bill.due ? (
                        <button
                          onClick={() => handleAction(`Float scheduled for ${bill.vendor} (Pay date: ${bill.recommendedDate})`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span>Apply Float Buffer</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Exact Date Required</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
