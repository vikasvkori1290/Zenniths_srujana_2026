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
  Edit3,
} from 'lucide-react';
import {
  getFixedExpensesDueWithin15Days,
  toggleFixedExpenseStatus,
  getStoredFixedExpenses,
  getDueEvents,
} from '../services/expenseSync';
import { calculatePredictiveCashRunway } from '../services/predictiveAnalytics';
import { getRetainedCashBeforeDueDate } from '../services/contextAdjuster';
import { useBodyScrollLock } from '../services/useBodyScrollLock';
import { syncUpcomingExpensesToDb } from '../services/api';

const DEFAULT_UPCOMING_EXPENSES = [];

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
    return [];
  });

  // 2. Auto-synced monthly fixed expenses due within 15 days
  const [fixedExpensesDue, setFixedExpensesDue] = useState(() =>
    getFixedExpensesDueWithin15Days()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Lock background scroll when modal is open
  useBodyScrollLock(isModalOpen);

  const [form, setForm] = useState({
    title: '',
    payee: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    urgency: 'Medium',
    category: 'Supplier Dues',
  });

  // Sync manual upcoming expenses to localStorage and MongoDB
  useEffect(() => {
    localStorage.setItem('aurum_upcoming_expenses', JSON.stringify(upcomingExpenses));
    window.dispatchEvent(new Event('aurum_expenses_updated'));
    window.dispatchEvent(new Event('storage'));

    syncUpcomingExpensesToDb(upcomingExpenses).catch((err) => {
      console.warn('Failed to sync upcoming expenses to DB:', err);
    });
  }, [upcomingExpenses]);

  // Sync fixed expenses due within 15 days whenever profile or fixed expenses change
  useEffect(() => {
    const handleRefresh = () => {
      setFixedExpensesDue(getFixedExpensesDueWithin15Days());
      const saved = localStorage.getItem('aurum_upcoming_expenses');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setUpcomingExpenses(parsed);
        } catch (e) {}
      }
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

  const handleStartEditExpense = (item) => {
    setEditingExpense(item);
    setForm({
      title: item.title,
      payee: item.payee || '',
      amount: item.amount,
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      urgency: item.urgency || 'Medium',
      category: item.category || 'Supplier Dues',
    });
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setForm({
      title: '',
      payee: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      urgency: 'Medium',
      category: 'Supplier Dues',
    });
    setIsModalOpen(true);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    if (editingExpense) {
      if (editingExpense.isFixedMonthly) {
        const allFixed = getStoredFixedExpenses();
        const updatedFixed = allFixed.map((fx) => {
          if (fx.id === editingExpense.fixedId) {
            return {
              ...fx,
              title: form.title.trim(),
              amount: Number(form.amount),
            };
          }
          return fx;
        });
        localStorage.setItem('aurum_fixed_expenses', JSON.stringify(updatedFixed));
        window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
        window.dispatchEvent(new Event('aurum_expenses_updated'));
        window.dispatchEvent(new Event('storage'));
        showToast(`Updated monthly commitment: ${form.title} (₹${Number(form.amount).toLocaleString()})`);
      } else {
        setUpcomingExpenses(
          upcomingExpenses.map((item) => {
            if (item.id === editingExpense.id) {
              return {
                ...item,
                title: form.title.trim(),
                payee: form.payee.trim() || 'Vendor',
                amount: Number(form.amount),
                dueDate: form.dueDate,
                urgency: form.urgency,
                category: form.category,
              };
            }
            return item;
          })
        );
        showToast(`Updated expense: ${form.title} (₹${Number(form.amount).toLocaleString()})`);
      }
    } else {
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
      showToast(`Scheduled expense: ${newItem.title} (₹${newItem.amount.toLocaleString()})`);
    }

    setForm({
      title: '',
      payee: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      urgency: 'Medium',
      category: 'Supplier Dues',
    });
    setEditingExpense(null);
    setIsModalOpen(false);
  };

  const handleDeleteExpense = (id, title) => {
    setUpcomingExpenses(upcomingExpenses.filter((item) => item.id !== id));
    showToast(`Removed expense: ${title || 'Entry'}`);
  };

  const handleToggleFixed = (fixedId, title, dueDate) => {
    toggleFixedExpenseStatus(fixedId, dueDate);
    showToast(`Marked "${title}" as paid in Monthly Fixed Expenses.`);
  };

  const handleMarkPayablePaid = (id, title) => {
    setUpcomingExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Paid' } : item))
    );
    showToast(`Marked "${title}" as paid.`);
  };

  // Combine manual upcoming expenses with auto-synced monthly fixed expenses via unified getDueEvents
  const dueEventsData = useMemo(() => {
    return getDueEvents({
      fixedExpenses: getStoredFixedExpenses(),
      upcomingExpenses,
      horizonDays: 15,
    });
  }, [upcomingExpenses, fixedExpensesDue]);

  const combinedExpenses = dueEventsData.events;
  const totalUpcoming = dueEventsData.duesWithin15Days;

  // Compute cashflow timeline to know the exact retained cash before each due date
  const cashflowTimeline = useMemo(() => {
    try {
      const todayIncome = JSON.parse(localStorage.getItem('aurum_today_income') || '[]');
      const allFixed = getStoredFixedExpenses();
      const khata = JSON.parse(localStorage.getItem('aurum_ekhata_data') || '[]');
      const isFestivalOn = localStorage.getItem('aurum_festival_toggle') !== 'false';
      const bType = localStorage.getItem('aurum_business_type') || 'kirana';
      const cacheKey = `aurum_context_adjustments_${bType.toLowerCase()}_bengaluru_${new Date().toISOString().slice(0, 7)}`;
      const savedAdj = JSON.parse(localStorage.getItem(cacheKey) || '{}');

      const analytics = calculatePredictiveCashRunway({
        todayIncomeList: todayIncome,
        fixedExpensesList: allFixed,
        upcomingExpensesList: upcomingExpenses,
        eKhataCustomersList: khata,
        contextAdjustments: savedAdj?.adjustments || [],
        isFestivalAdjustmentOn: isFestivalOn,
      });
      return {
        timeline: analytics.timeline || [],
        retainedCashPerDay: analytics.retainedCashPerDay || 1500,
      };
    } catch (e) {
      return { timeline: [], retainedCashPerDay: 1500 };
    }
  }, [upcomingExpenses, fixedExpensesDue]);

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

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Upcoming Dues
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 font-['Outfit']">
                ₹{totalUpcoming.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="gold-button-gradient px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer hover:scale-[1.02] min-h-11 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Schedule Upcoming Expense</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setUrgencyFilter(lvl)}
                className={`px-3 py-2 sm:py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] min-h-9.5 sm:min-h-0 shrink-0 ${
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
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3.5 sm:top-3" />
            <input
              type="text"
              placeholder="Search expenses, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl bg-white border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none"
            />
          </div>
        </div>

        {/* Mobile Stacked Card View (< md) */}
        <div className="block md:hidden space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 text-xs bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200 p-4">
              No upcoming expenses found. Tap "+ Schedule Upcoming Expense" above to add one!
            </div>
          ) : (
            filteredExpenses.map((item) => {
              const retainedBeforeDue = getRetainedCashBeforeDueDate(
                item.dueDate,
                cashflowTimeline.timeline,
                cashflowTimeline.retainedCashPerDay
              );
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-black text-sm">{item.title}</span>
                        {item.isFixedMonthly && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Repeat className="w-2.5 h-2.5 text-amber-700" />
                            <span>Fixed</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 font-medium">{item.payee}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
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
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-neutral-200/60">
                    <span className="px-2 py-0.5 rounded bg-white text-neutral-700 font-semibold text-[10px] border border-neutral-200">
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-1.5 font-mono text-neutral-700">
                      <span>{item.dueDate}</span>
                      {item.diffDays !== undefined && (
                        <span
                          className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${
                            item.diffDays <= 2
                              ? 'bg-rose-100 text-rose-700'
                              : item.diffDays <= 7
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {item.diffDays === 0
                            ? 'Due Today'
                            : item.diffDays < 0
                            ? `${Math.abs(item.diffDays)}d overdue`
                            : `in ${item.diffDays}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expected Retained Cash Card */}
                  <div className="text-[11px] font-sans font-medium text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5">
                    <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Expected retained cash before this due:
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-1">
                      <strong className="font-extrabold font-mono text-xs text-black">
                        ₹{retainedBeforeDue.base.toLocaleString()}
                      </strong>
                      <span className="text-neutral-500 font-mono text-[10px]">
                        (range ₹{retainedBeforeDue.low.toLocaleString()} - ₹{retainedBeforeDue.high.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  {/* Amount and Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                    <div
                      onClick={() => handleStartEditExpense(item)}
                      className="cursor-pointer group/amt"
                      title="Click to edit amount"
                    >
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block group-hover/amt:text-rose-600 transition-colors">
                        Amount Due ✏️
                      </span>
                      <span className="font-black text-rose-600 font-['Outfit'] text-base group-hover/amt:text-rose-800 transition-colors">
                        ₹{Number(item.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleStartEditExpense(item)}
                        className="min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 cursor-pointer flex items-center space-x-1"
                        title="Edit amount & details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Edit</span>
                      </button>
                      {item.isFixedMonthly ? (
                        <button
                          onClick={() => handleToggleFixed(item.fixedId, item.title, item.dueDate)}
                          className="min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleMarkPayablePaid(item.id, item.title)}
                            className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                            title="Mark payable as paid"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark Paid</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(item.id, item.title)}
                            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200"
                            title="Remove expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop/Tablet Table View (md and up) */}
        <div className="hidden md:block overflow-x-auto">
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
                      {(() => {
                        const retainedBeforeDue = getRetainedCashBeforeDueDate(
                          item.dueDate,
                          cashflowTimeline.timeline,
                          cashflowTimeline.retainedCashPerDay
                        );
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span>{item.dueDate}</span>
                              {item.diffDays !== undefined && (
                                <span
                                  className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${
                                    item.diffDays <= 2
                                      ? 'bg-rose-100 text-rose-700'
                                      : item.diffDays <= 7
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-neutral-100 text-neutral-500'
                                  }`}
                                >
                                  {item.diffDays === 0
                                    ? 'Due Today'
                                    : item.diffDays < 0
                                    ? `${Math.abs(item.diffDays)}d overdue`
                                    : `in ${item.diffDays} days`}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-sans font-medium text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 shadow-2xs">
                              <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block">
                                Expected retained cash before this due:
                              </span>
                              <div className="mt-0.5">
                                <strong className="font-extrabold font-mono text-xs text-black">
                                  ₹{retainedBeforeDue.base.toLocaleString()}
                                </strong>{' '}
                                <span className="text-neutral-500 font-mono text-[10px]">
                                  (range ₹{retainedBeforeDue.low.toLocaleString()} - ₹{retainedBeforeDue.high.toLocaleString()})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
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
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleStartEditExpense(item)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs hover:scale-105"
                          title="Edit amount & details"
                        >
                          <Edit3 className="w-3 h-3 text-amber-700" />
                          <span>Edit</span>
                        </button>
                        {item.isFixedMonthly ? (
                          <button
                            onClick={() => handleToggleFixed(item.fixedId, item.title, item.dueDate)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs hover:scale-105"
                            title="Mark as paid in Monthly Fixed Expenses"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Mark Paid</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMarkPayablePaid(item.id, item.title)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs hover:scale-105"
                              title="Mark payable as paid"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Mark Paid</span>
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(item.id, item.title)}
                              className="p-1 rounded hover:bg-rose-50 text-neutral-300 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Remove expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Add Upcoming Expense (Responsive Bottom Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 border border-neutral-200 shadow-2xl relative font-['Plus_Jakarta_Sans'] max-h-[90dvh] overflow-y-auto">
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-4" />

            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingExpense(null);
              }}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-neutral-400 hover:text-black transition-colors cursor-pointer min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-neutral-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-neutral-100 pr-10">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/20 text-yellow-800 flex items-center justify-center border border-yellow-400/40 shrink-0">
                {editingExpense ? <Edit3 className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-black font-['Outfit']">
                  {editingExpense ? 'Edit Scheduled Expense / Payable' : 'Schedule Upcoming Expense'}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {editingExpense ? 'Update amount, due date, or payee details' : 'Track vendor liabilities and near-term payables'}
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
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
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
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black font-bold focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
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
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
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
                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none min-h-11 sm:min-h-0"
                  >
                    <option value="Urgent">Urgent (&le; 2 Days)</option>
                    <option value="High">High (&le; 7 Days)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer min-h-11 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto gold-button-gradient px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer hover:scale-[1.02] transition-all min-h-11 flex items-center justify-center"
                >
                  {editingExpense ? 'Save Changes' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
