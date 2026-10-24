import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, TrendingDown, DollarSign, Calendar, Tag } from 'lucide-react';

export default function SimulateModal({ isOpen, onClose, onApplyScenario }) {
  const [eventType, setEventType] = useState('inflow'); // 'inflow' or 'outflow'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [daysOut, setDaysOut] = useState('14');
  const [probability, setProbability] = useState('85');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) return;
    onApplyScenario({
      title,
      amount: Number(amount) * (eventType === 'outflow' ? -1 : 1),
      daysOut: Number(daysOut),
      probability: Number(probability),
      type: eventType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e1118] border border-yellow-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-black">
              <Sparkles className="w-4 h-4 fill-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Simulate Cash Event
              </h3>
              <p className="text-xs text-slate-400">
                Stress test your 30-90 day runway with custom cash injections or burn events.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Inflow vs Outflow toggle */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Event Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEventType('inflow')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                  eventType === 'inflow'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Cash Inflow (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setEventType('outflow')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                  eventType === 'outflow'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Cash Outflow (-)</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Event Description</label>
            <input
              type="text"
              placeholder="e.g. New Enterprise Client Contract, Equipment Purchase, Tax Payment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-yellow-400 outline-none text-white text-xs"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Amount ($ USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
              <input
                type="number"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-yellow-400 outline-none text-white text-xs font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Days out */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Timeline (Days from today)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={daysOut}
                onChange={(e) => setDaysOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-yellow-400 outline-none text-white text-xs font-mono"
              />
            </div>

            {/* Probability % */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Probability Likelihood (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-yellow-400 outline-none text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gold-button-gradient px-5 py-2 rounded-xl font-bold text-black"
            >
              Run Simulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
