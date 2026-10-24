import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  X,
  Sparkles,
  Search,
  Repeat,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  getFixedExpensesDueWithin15Days,
  toggleFixedExpenseStatus,
} from '../services/expenseSync';

const DEFAULT_UPCOMING_EXPENSES = [
  {
    id: 'up-1',
    title: 'Raw Material Inventory Batch #42',
    payee: 'Apex Distributors India',
    amount: 12500,
    dueDate: '2026-10-28',
    urgency: 'High',
    category: 'Supplier Dues',
    status: 'Upcoming',
  },
  {
    id: 'up-2',
    title: 'Quarterly GST Filing & Accounting Fees',
    payee: 'Chartered Accountant Services',
    amount: 7800,
    dueDate: '2026-10-31',
    urgency: 'Urgent',
    category: 'Taxes & Compliance',
    status: 'Upcoming',
  },
  {
    id: 'up-3',
    title: 'Commercial Insurance Policy Installment',
    payee: 'ICICI Lombard General Insurance',
    amount: 3200,
    dueDate: '2026-11-04',
    urgency: 'Medium',
    category: 'Insurance',
    status: 'Upcoming',
  },
  {
    id: 'up-4',
    title: 'Packaging Box & Bulk Supplies',
    payee: 'EcoPack India Supplies',
    amount: 2450,
    dueDate: '2026-11-09',
    urgency: 'Low',
    category: 'Packaging',
    status: 'Upcoming',
  },
];

export default function UpcomingExpensesSection() {
  // 1. One-off / scheduled upcoming expenses
  const [upcomingExpenses, setUpcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_UPCOMING_EXPENSES;
  });

  // 2. Auto-synced monthly fixed expenses due within 15 days
  const [fixedExpensesDue, setFixedExpensesDue] = useState(() =>
    getFixedExpensesDueWithin15Days()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [feedbackToast, setFeedbackToast] = useState(null);

  const [form, setForm] = useState({
    title: '',
    payee: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    urgency: 'Medium',
    category: 'Supplier Dues',
  });

  // Sync manual upcoming expenses to localStorage
  useEffect(() => {
    localStorage.setItem('aurum_upcoming_expenses', JSON.stringify(upcomingExpenses));
    window.dispatchEvent(new Event('aurum_expenses_updated'));
  }, [upcomingExpenses]);

  // Sync fixed expenses due within 15 days whenever profile or fixed expenses change
  useEffect(() => {
    const handleRefresh = () => {
      setFixedExpensesDue(getFixedExpensesDueWithin15Days());
    };
    window.addEventListener('aurum_fixed_expenses_updated', handleRefresh);
    window.addEventListener('aurum_expenses_updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('aurum_fixed_expenses_updated', handleRefresh);
      window.removeEventListener('aurum_expenses_updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    const newItem = {
      id: 'up-' + Date.now(),
      title: form.title.trim(),
      payee: form.payee.trim() || 'Vendor',
      amount: Number(form.amount),
      dueDate: form.dueDate,
      urgency: form.urgency,
      category: form.category,
      status: 'Upcoming',
    };

    setUpcomingExpenses([newItem, ...upcomingExpenses]);
    setForm({
      title: '',
      payee: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      urgency: 'Medium',
      category: 'Supplier Dues',
    });
    setIsModalOpen(false);
    showToast(`Scheduled expense: ${newItem.title} (₹${newItem.amount.toLocaleString()})`);
  };

  const handleDeleteExpense = (id, title) => {
    setUpcomingExpenses(upcomingExpenses.filter((item) => item.id !== id));
    showToast(`Removed expense: ${title || 'Entry'}`);
  };

  const handleToggleFixed = (fixedId, title) => {
    toggleFixedExpenseStatus(fixedId);
    showToast(`Marked "${title}" as paid in Monthly Fixed Expenses.`);
  };

  // Combine manual upcoming expenses with auto-synced monthly fixed expenses
  const combinedExpenses = useMemo(() => {
    const list = [...upcomingExpenses, ...fixedExpensesDue];
    list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return list;
  }, [upcomingExpenses, fixedExpensesDue]);

  const totalUpcoming = useMemo(() => {
    return combinedExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [combinedExpenses]);

  const filteredExpenses = combinedExpenses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency =
      urgencyFilter === 'ALL' || item.urgency.toUpperCase() === urgencyFilter;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-amber-700 hover:text-black cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6 font-['Plus_Jakarta_Sans']">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Upcoming Expenses & Scheduled Payables
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                Near-term Liabilities
              </span>
              {fixedExpensesDue.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1">
                  <Repeat className="w-3 h-3 text-amber-600" />
                  <span>{fixedExpensesDue.length} Fixed Due in &le;15 Days</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Vendor dues, invoices, tax deadlines, and monthly fixed commitments due within 15 days.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Upcoming Dues
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 font-['Outfit']">
                ₹{totalUpcoming.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Schedule Upcoming Expense</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setUrgencyFilter(lvl)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                  urgencyFilter === lvl
                    ? 'bg-black text-yellow-300 border border-black shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                {lvl === 'ALL' ? 'All Urgencies' : lvl}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search expenses, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
            />
          </div>
        </div>

        {/* Table of Upcoming Expenses */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-175">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px] tracking-wider bg-neutral-50/50">
                <th className="py-3 px-4">Expense / Purpose</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4 text-right">Amount Due</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-400">
                    No upcoming expenses found. Click "+ Schedule Upcoming Expense" above to add one!
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/70 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-black">{item.title}</span>
                        {item.isFixedMonthly && (
                          <span
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                            title="Auto-synced from Monthly Fixed Expenses"
                          >
                            <Repeat className="w-2.5 h-2.5 text-amber-700" />
                            <span>Monthly Fixed</span>
                          </span>
                        )}
                      </div>
                      {item.isFixedMonthly && (
                        <span className="text-[10px] text-neutral-400 block font-normal mt-0.5">
                          Recurs every {item.dueDay}th of month
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 font-medium">
                      {item.payee}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold text-[10px] border border-neutral-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700 font-semibold font-mono">
                      <div>{item.dueDate}</div>
                      {item.diffDays !== undefined && (
                        <span
                          className={`text-[10px] block font-sans font-medium ${
                            item.diffDays <= 2
                              ? 'text-rose-600 font-bold'
                              : item.diffDays <= 7
                              ? 'text-amber-700 font-semibold'
                              : 'text-neutral-400'
                          }`}
                        >
                          {item.diffDays === 0
                            ? 'Due Today'
                            : item.diffDays < 0
                            ? `${Math.abs(item.diffDays)}d overdue`
                            : `in ${item.diffDays} days`}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.urgency === 'Urgent'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : item.urgency === 'High'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : item.urgency === 'Medium'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 font-['Outfit'] text-sm">
                      ₹{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isFixedMonthly ? (
                        <button
                          onClick={() => handleToggleFixed(item.fixedId, item.title)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs hover:scale-105"
                          title="Mark as paid in Monthly Fixed Expenses"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteExpense(item.id, item.title)}
                          className="p-1 rounded hover:bg-rose-50 text-neutral-300 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remove expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Add Upcoming Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl relative font-['Plus_Jakarta_Sans']">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-800 flex items-center justify-center border border-yellow-400/40">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black font-['Outfit']">
                  Schedule Upcoming Expense
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Track vendor liabilities and near-term payables
                </p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Expense Purpose / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Raw Material Batch #43, Transport Bill"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Payee / Vendor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Apex Distributors India"
                  value={form.payee}
                  onChange={(e) => setForm({ ...form, payee: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g., 5000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-bold focus:border-yellow-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
                  >
                    <option value="Supplier Dues">Supplier Dues</option>
                    <option value="Taxes & Compliance">Taxes & Compliance</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Urgency
                  </label>
                  <select
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:border-yellow-400 outline-none"
                  >
                    <option value="Urgent">Urgent (&le; 2 Days)</option>
                    <option value="High">High (&le; 7 Days)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-button-gradient px-4 py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer hover:scale-[1.02] transition-all"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
