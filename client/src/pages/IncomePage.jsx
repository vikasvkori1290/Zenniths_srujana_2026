import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  Trash2,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  DollarSign,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function IncomePage() {
  const { user } = useAuth();

  const [profile] = useState(() => {
    const saved = localStorage.getItem('aurum_profile_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      dailyGoal: 10000,
    };
  });

  const [todayIncome, setTodayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'inc-1',
        source: 'Counter Cash Sales',
        amount: 5000,
        mode: 'Cash',
        time: '11:00 AM',
        category: 'In-Store Retail',
      },
      {
        id: 'inc-2',
        source: 'UPI QR Payment (PhonePe / GPay)',
        amount: 3000,
        mode: 'UPI',
        time: '02:30 PM',
        category: 'Digital Collections',
      },
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL');

  const [form, setForm] = useState({
    source: '',
    amount: '',
    mode: 'UPI',
    category: 'Counter Sales',
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('aurum_today_income', JSON.stringify(todayIncome));
    window.dispatchEvent(new Event('aurum_income_updated'));
    window.dispatchEvent(new Event('storage'));
  }, [todayIncome]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalTodayIncome = todayIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const dailyTarget = profile.dailyGoal || 10000;
  const goalPercentage = Math.min(Math.round((totalTodayIncome / dailyTarget) * 100), 100);
  const remainingTarget = Math.max(0, dailyTarget - totalTodayIncome);

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!form.source.trim() || !form.amount) return;

    const newItem = {
      id: 'inc-' + Date.now(),
      source: form.source.trim(),
      amount: Number(form.amount),
      mode: form.mode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: form.category,
    };

    setTodayIncome([newItem, ...todayIncome]);
    setForm({ source: '', amount: '', mode: 'UPI', category: 'Counter Sales' });
    setIsModalOpen(false);
    showToast(`Added ₹${newItem.amount.toLocaleString()} to Today's Income!`);
  };

  const handleDelete = (id) => {
    setTodayIncome(todayIncome.filter((i) => i.id !== id));
    showToast('Income entry removed.');
  };

  const filteredEntries = todayIncome.filter((item) => {
    if (filterMode === 'ALL') return true;
    return item.mode.toUpperCase() === filterMode;
  });

  // Calculate payment mode breakdown
  const cashTotal = todayIncome.filter((i) => i.mode === 'Cash').reduce((s, i) => s + Number(i.amount), 0);
  const upiTotal = todayIncome.filter((i) => i.mode === 'UPI').reduce((s, i) => s + Number(i.amount), 0);
  const bankTotal = todayIncome.filter((i) => i.mode === 'Bank Transfer').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="w-full bg-white text-neutral-900 pb-16 font-['Plus_Jakarta_Sans']">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="px-5 py-3 rounded-2xl bg-black text-yellow-300 border border-yellow-400 shadow-2xl text-xs font-bold flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-neutral-200/80 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <Link to="/" className="font-semibold text-neutral-700 hover:text-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-black font-bold">Today's Income</span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-300">
              Live Daily Sales
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/receivables"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs"
            >
              Collect Receivables &rarr;
            </Link>
            <Link
              to="/fixed-expenses"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-yellow-400 hover:text-black transition-all shadow-2xs"
            >
              Fixed Expenses &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-neutral-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Today's Income & Daily Collections
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              Real-time record of all sales, payments received, and credit collections for today.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Today</span>
              <span className="text-2xl font-black text-emerald-600 font-['Outfit']">
                ₹{totalTodayIncome.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="gold-button-gradient px-4 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Today's Income</span>
            </button>
          </div>
        </div>

        {/* Progress towards Daily Target */}
        <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-200/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-black">Daily Income Target:</span>
              <span className="text-sm font-extrabold text-neutral-900">
                ₹{dailyTarget.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {goalPercentage}% Achieved
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {remainingTarget === 0
                ? '🎉 Congratulations! You have fully achieved today’s daily target!'
                : `Remaining to hit daily target: ₹${remainingTarget.toLocaleString()}`}
            </p>
          </div>

          <div className="w-full md:w-80">
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown by Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">UPI QR / PhonePe</span>
            <span className="text-xl font-black text-black font-['Outfit'] block mt-1">₹{upiTotal.toLocaleString()}</span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">{todayIncome.filter((i) => i.mode === 'UPI').length} transactions</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">In-Store Cash Sales</span>
            <span className="text-xl font-black text-black font-['Outfit'] block mt-1">₹{cashTotal.toLocaleString()}</span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">{todayIncome.filter((i) => i.mode === 'Cash').length} transactions</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Bank / Client Transfers</span>
            <span className="text-xl font-black text-black font-['Outfit'] block mt-1">₹{bankTotal.toLocaleString()}</span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">{todayIncome.filter((i) => i.mode === 'Bank Transfer').length} transactions</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-neutral-500">Filter Mode:</span>
            {['ALL', 'UPI', 'CASH', 'BANK TRANSFER'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === mode
                    ? 'bg-black text-yellow-300 border border-black shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-neutral-400">
            {filteredEntries.length} entries recorded today
          </span>
        </div>

        {/* Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEntries.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 hover:border-yellow-400 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-black leading-snug line-clamp-1 mb-1">
                  {item.source}
                </h4>
                <span className="text-xs font-semibold text-neutral-500">
                  via <strong className="text-neutral-800">{item.mode}</strong>
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between">
                <span className="text-lg font-black text-emerald-600 font-['Outfit']">
                  +₹{Number(item.amount).toLocaleString()}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded-md text-neutral-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
            <p className="text-sm text-neutral-500">No income entries found for this filter.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
            >
              + Add Today's First Income Entry
            </button>
          </div>
        )}
      </div>

      {/* Add Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-neutral-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  +
                </div>
                <h3 className="text-base font-black text-black font-['Outfit']">Record Today's Income</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="mt-4 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-neutral-600 mb-1">Source / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Cash Sales, Client Order #40"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1">Payment Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                  >
                    <option value="UPI">UPI (QR / PhonePe)</option>
                    <option value="Cash">Cash (In-store)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-xs"
                  >
                    <option value="In-Store Retail">In-Store Retail</option>
                    <option value="Digital Collections">Digital Collections</option>
                    <option value="eKhata Received">eKhata Repayment</option>
                    <option value="B2B Client Invoice">B2B Invoice</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-button-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
