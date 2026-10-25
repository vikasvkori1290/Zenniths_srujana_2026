import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  X,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { useBodyScrollLock } from '../services/useBodyScrollLock';
import { syncFixedExpensesToDb } from '../services/api';

export default function FixedExpensesPage() {
  const [fixedExpenses, setFixedExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_fixed_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Lock background scroll when modal is open
  useBodyScrollLock(isModalOpen);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Rent',
    dueDay: 5,
    notes: '',
  });

  // Sync to localStorage, MongoDB, and dispatch update events
  useEffect(() => {
    localStorage.setItem('aurum_fixed_expenses', JSON.stringify(fixedExpenses));
    window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
    window.dispatchEvent(new Event('aurum_expenses_updated'));
    window.dispatchEvent(new Event('storage'));

    syncFixedExpensesToDb(fixedExpenses).catch((err) => {
      console.warn('Failed to sync fixed expenses to DB:', err);
    });
  }, [fixedExpenses]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalMonthlyFixed = fixedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paidCount = fixedExpenses.filter((item) => item.status === 'Paid').length;
  const pendingCount = fixedExpenses.length - paidCount;

  const handleToggleStatus = (id) => {
    setFixedExpenses(
      fixedExpenses.map((exp) => {
        if (exp.id === id) {
          const nextStatus = exp.status === 'Paid' ? 'Pending' : 'Paid';
          showToast(`Updated status to ${nextStatus}!`);
          return { ...exp, status: nextStatus };
        }
        return exp;
      })
    );
  };

  const handleDelete = (id) => {
    setFixedExpenses(fixedExpenses.filter((e) => e.id !== id));
    showToast('Fixed expense removed.');
  };

  const handleStartEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      dueDay: expense.dueDay,
      notes: expense.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({ title: '', amount: '', category: 'Rent', dueDay: 5, notes: '' });
    setIsModalOpen(true);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;

    if (editingId) {
      setFixedExpenses(
        fixedExpenses.map((exp) => {
          if (exp.id === editingId) {
            return {
              ...exp,
              title: form.title.trim(),
              amount: Number(form.amount),
              category: form.category,
              dueDay: Number(form.dueDay) || 1,
              notes: form.notes.trim() || 'Recurring monthly commitment',
            };
          }
          return exp;
        })
      );
      showToast(`Updated ${form.title.trim()} (₹${Number(form.amount).toLocaleString()})!`);
    } else {
      const newItem = {
        id: 'fix-' + Date.now(),
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        dueDay: Number(form.dueDay) || 1,
        status: 'Pending',
        notes: form.notes.trim() || 'Recurring monthly commitment',
        receiptName: null,
      };
      setFixedExpenses([...fixedExpenses, newItem]);
      showToast(`Added ${newItem.title} (₹${newItem.amount.toLocaleString()})!`);
    }

    setForm({ title: '', amount: '', category: 'Rent', dueDay: 5, notes: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

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


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Monthly Fixed Expenses
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              Mandatory monthly recurring outlays, rent agreements, loan EMIs, and utility commitments. Due dates falling within 15 days automatically synchronize to Upcoming Payables.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Monthly Total</span>
              <span className="text-xl sm:text-2xl font-black text-black font-['Outfit']">
                ₹{totalMonthlyFixed.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="gold-button-gradient px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer min-h-11 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Fixed Expense</span>
            </button>
          </div>
        </div>

        {/* Accounting Rule Callout (Requirement 9) */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-amber-900 leading-relaxed">
            <strong className="text-black font-bold">Important Classification Rule:</strong> A cost may belong to <strong>running_cost</strong> (daily operating expenses such as helper wages or tea in Runway settings) OR <strong>fixed expenses</strong> (dated monthly commitments like Rent, EMI, or Salaries), <em>not both</em>. Do not double count!
          </div>
        </div>

        {/* Commitment Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Total Monthly Budget</span>
            <span className="text-xl font-black text-black font-['Outfit'] block mt-1">₹{totalMonthlyFixed.toLocaleString()}</span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">{fixedExpenses.length} regular contracts</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Cleared / Paid This Month</span>
            <span className="text-xl font-black text-emerald-600 font-['Outfit'] block mt-1">{paidCount} Paid</span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Vouchers on file</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Pending Payouts</span>
            <span className="text-xl font-black text-amber-700 font-['Outfit'] block mt-1">{pendingCount} Pending</span>
            <span className="text-[11px] text-amber-600 mt-0.5 block">Due before month end</span>
          </div>
        </div>

        {/* Grid of Fixed Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fixedExpenses.map((expense) => (
            <div
              key={expense.id}
              className="p-5 sm:p-6 rounded-3xl bg-neutral-50/70 border border-neutral-200/80 hover:border-amber-400/80 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-800">
                    {expense.category}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(expense.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer min-h-8 sm:min-h-0 ${
                      expense.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {expense.status === 'Paid' ? '✓ Paid for Oct' : '● Due on ' + expense.dueDay + 'th'}
                  </button>
                </div>

                <h3 className="text-base font-bold text-black mb-1">
                  {expense.title}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                  {expense.notes}
                </p>

                {/* Document / Receipt Upload indicator */}
                {expense.receiptName ? (
                  <div className="mt-4 flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/70">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="truncate">{expense.receiptName}</span>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center space-x-1.5 text-[11px] text-neutral-400">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>No voucher attached</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200/60 flex items-center justify-between">
                <div
                  onClick={() => handleStartEdit(expense)}
                  className="cursor-pointer group/amt"
                  title="Click to edit amount"
                >
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block group-hover/amt:text-amber-600 transition-colors">
                    Monthly Amount ✏️
                  </span>
                  <span className="text-lg font-black text-black font-['Outfit'] group-hover/amt:text-amber-700 transition-colors">
                    ₹{Number(expense.amount).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleStartEdit(expense)}
                    className="min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 cursor-pointer flex items-center space-x-1"
                    title="Edit amount & details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleStatus(expense.id)}
                    className="min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 cursor-pointer flex items-center"
                  >
                    {expense.status === 'Paid' ? 'Mark Due' : 'Mark Paid'}
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-neutral-400 sm:text-neutral-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    title="Delete commitment"
                    aria-label="Delete commitment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Fixed Expense Modal (Responsive Bottom Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md border border-neutral-200 shadow-2xl max-h-[90dvh] overflow-y-auto">
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  {editingId ? <Edit3 className="w-4 h-4" /> : '+'}
                </div>
                <h3 className="text-base font-black text-black font-['Outfit']">
                  {editingId ? 'Edit Monthly Fixed Commitment' : 'Add Fixed Commitment'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-neutral-400 hover:text-black p-2 min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-neutral-600 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse Lease, Machining Loan EMI"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs min-h-11 sm:min-h-0"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Monthly Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs font-mono font-bold min-h-11 sm:min-h-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs min-h-11 sm:min-h-0"
                  >
                    <option value="Rent">Store / Warehouse Rent</option>
                    <option value="EMI">Machinery / Loan EMI</option>
                    <option value="Utilities">Electricity & Water</option>
                    <option value="Salaries">Staff Salaries</option>
                    <option value="Subscriptions">Software & Broadband</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">Due Day of Month (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={form.dueDay}
                    onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs font-mono min-h-11 sm:min-h-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Notes / Payment Details</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Landlord account details, auto-debit bank schedule"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs"
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-neutral-600 hover:text-black border border-neutral-200 min-h-11 flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto gold-button-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer min-h-11 flex items-center justify-center"
                >
                  {editingId ? 'Save Changes' : 'Confirm & Schedule Commitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
