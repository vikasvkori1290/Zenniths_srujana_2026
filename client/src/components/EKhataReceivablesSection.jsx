import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  Phone,
  User,
  AlertCircle,
  X,
  IndianRupee,
} from 'lucide-react';
import { useBodyScrollLock } from '../services/useBodyScrollLock';

const DEFAULT_KHATA_SEED = [
  {
    id: 'cust-1',
    idNumber: 1,
    name: 'Nitish',
    totalAmount: 240,
    dueDate: '29 October',
    phone: '+91 98765 43210',
    status: 'Pending',
    lastUpdated: 'Today at 04:36 PM',
    history: [
      { amount: 150, date: 'Today at 04:15 PM', note: 'Initial Khata balance' },
      { amount: 20, date: 'Today at 04:26 PM', note: 'Added ₹20 via voice' },
      { amount: 70, date: 'Today at 04:36 PM', note: 'Added ₹70 via voice' },
    ],
  },
  {
    id: 'cust-2',
    idNumber: 2,
    name: 'Rahul Sharma',
    totalAmount: 420,
    dueDate: 'Undated / On-Demand',
    phone: '+91 91234 56789',
    status: 'Pending',
    lastUpdated: 'Yesterday at 06:30 PM',
    history: [
      { amount: 420, date: 'Yesterday at 06:30 PM', note: 'Supplies credit' },
    ],
  },
  {
    id: 'cust-3',
    idNumber: 3,
    name: 'Priya Stores',
    totalAmount: 850,
    dueDate: '5 November',
    phone: '+91 98111 22334',
    status: 'Pending',
    lastUpdated: '2 days ago',
    history: [
      { amount: 850, date: '2 days ago', note: 'Provisions ledger credit' },
    ],
  },
];

/**
 * Parses eKhata customer dueDate string to determine if it is:
 * - Undated: null, undefined, '', 'Not Specified', 'none'
 * - Due within 15 days: diffDays >= -7 && diffDays <= 15
 * - Beyond 15 days: diffDays > 15
 */
export function evaluateCustomerDueWindow(dueDateStr) {
  if (!dueDateStr || typeof dueDateStr !== 'string') {
    return { isUndated: true, diffDays: null, displayDate: 'Undated / On-Demand' };
  }

  const clean = dueDateStr.trim();
  const lower = clean.toLowerCase();

  if (!clean || lower === 'not specified' || lower === 'null' || lower === 'undefined' || lower === 'none' || lower.includes('undated')) {
    return { isUndated: true, diffDays: null, displayDate: 'Undated / On-Demand' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // ISO Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const diffMs = dateObj.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return {
      isUndated: false,
      diffDays,
      displayDate: clean,
      dateObj,
      isDueWithin15: diffDays >= -7 && diffDays <= 15,
    };
  }

  // Month names mapping
  const monthNames = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // e.g. "28 October", "5 November", "30 November"
  const dayMonthMatch = clean.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(\d{4}))?$/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const mStr = dayMonthMatch[2].toLowerCase();
    const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : today.getFullYear();
    if (monthNames[mStr] !== undefined) {
      const dateObj = new Date(year, monthNames[mStr], day);
      const diffMs = dateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        isUndated: false,
        diffDays,
        displayDate: clean,
        dateObj,
        isDueWithin15: diffDays >= -7 && diffDays <= 15,
      };
    }
  }

  // e.g. "November 30"
  const monthDayMatch = clean.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i);
  if (monthDayMatch) {
    const mStr = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : today.getFullYear();
    if (monthNames[mStr] !== undefined) {
      const dateObj = new Date(year, monthNames[mStr], day);
      const diffMs = dateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        isUndated: false,
        diffDays,
        displayDate: clean,
        dateObj,
        isDueWithin15: diffDays >= -7 && diffDays <= 15,
      };
    }
  }

  // Fallback Date.parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const dateObj = new Date(parsed);
    const diffMs = dateObj.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return {
      isUndated: false,
      diffDays,
      displayDate: clean,
      dateObj,
      isDueWithin15: diffDays >= -7 && diffDays <= 15,
    };
  }

  // Any unparseable custom string treated as undated
  return { isUndated: true, diffDays: null, displayDate: clean || 'Undated / On-Demand' };
}

export default function EKhataReceivablesSection({ setActivePage }) {
  const [khataList, setKhataList] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            ...item,
            idNumber: item.idNumber !== undefined && item.idNumber !== null ? item.idNumber : idx + 1,
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_KHATA_SEED;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'DUE_SOON', 'UNDATED'
  const [toastMessage, setToastMessage] = useState(null);

  // Settlement modal state
  const [settleModal, setSettleModal] = useState({
    isOpen: false,
    customer: null,
    amountToReceive: '',
  });

  // Lock body scroll when settle modal is open
  useBodyScrollLock(settleModal.isOpen);

  // Sync with eKhata changes in localStorage
  useEffect(() => {
    const syncKhata = () => {
      const saved = localStorage.getItem('aurum_ekhata_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setKhataList(
              parsed.map((item, idx) => ({
                ...item,
                idNumber: item.idNumber !== undefined && item.idNumber !== null ? item.idNumber : idx + 1,
              }))
            );
          }
        } catch (e) {}
      }
    };

    window.addEventListener('aurum_ekhata_updated', syncKhata);
    window.addEventListener('storage', syncKhata);
    return () => {
      window.removeEventListener('aurum_ekhata_updated', syncKhata);
      window.removeEventListener('storage', syncKhata);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // All customers with outstanding balance > 0
  const allActiveCustomers = useMemo(() => {
    return khataList
      .filter((c) => Number(c.totalAmount || 0) > 0)
      .map((c) => {
        const evalResult = evaluateCustomerDueWindow(c.dueDate);
        return {
          ...c,
          evalResult,
        };
      });
  }, [khataList]);

  // Counts for filter pills
  const dueWithin15Count = useMemo(
    () => allActiveCustomers.filter((c) => !c.evalResult.isUndated && c.evalResult.isDueWithin15).length,
    [allActiveCustomers]
  );
  const undatedCount = useMemo(
    () => allActiveCustomers.filter((c) => c.evalResult.isUndated).length,
    [allActiveCustomers]
  );

  // Filtered by Search & Tab
  const filteredCustomers = useMemo(() => {
    return allActiveCustomers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.idNumber).includes(searchQuery) ||
        (c.phone && c.phone.includes(searchQuery));

      if (!matchesSearch) return false;

      if (filterType === 'DUE_SOON') {
        return !c.evalResult.isUndated && c.evalResult.isDueWithin15;
      }
      if (filterType === 'UNDATED') {
        return c.evalResult.isUndated;
      }
      return true; // 'ALL'
    });
  }, [allActiveCustomers, searchQuery, filterType]);

  // Total due amount of this section
  const totalSectionDue = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
  }, [filteredCustomers]);

  // Handle Mark Received / Settle
  const handleOpenSettle = (customer) => {
    setSettleModal({
      isOpen: true,
      customer,
      amountToReceive: customer.totalAmount || '',
    });
  };

  const handleConfirmSettle = (e) => {
    e.preventDefault();
    const { customer, amountToReceive } = settleModal;
    if (!customer || !amountToReceive) return;

    const amt = Number(amountToReceive);
    if (amt <= 0) return;

    const newBalance = Math.max(0, Number(customer.totalAmount) - amt);

    const nowFormatted = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedList = khataList.map((item) => {
      if (item.id === customer.id) {
        const updatedHistory = [
          ...(item.history || []),
          {
            amount: amt,
            date: `Today at ${nowFormatted}`,
            note: `Payment received of ₹${amt.toLocaleString()} (Settled from Home Overview)`,
            type: 'REDUCE',
          },
        ];
        return {
          ...item,
          totalAmount: newBalance,
          lastUpdated: `Today at ${nowFormatted}`,
          history: updatedHistory,
        };
      }
      return item;
    });

    // Save updated eKhata to localStorage
    localStorage.setItem('aurum_ekhata_data', JSON.stringify(updatedList));
    setKhataList(updatedList);
    window.dispatchEvent(new Event('aurum_ekhata_updated'));

    // Also credit to Today's Income
    try {
      const savedIncome = localStorage.getItem('aurum_today_income');
      const incomeList = savedIncome ? JSON.parse(savedIncome) : [];
      const newIncomeItem = {
        id: 'inc-' + Date.now(),
        source: `eKhata Credit Repayment (${customer.name})`,
        amount: amt,
        time: nowFormatted,
        mode: 'Cash / Transfer',
      };
      const updatedIncome = [newIncomeItem, ...(Array.isArray(incomeList) ? incomeList : [])];
      localStorage.setItem('aurum_today_income', JSON.stringify(updatedIncome));
      window.dispatchEvent(new Event('aurum_income_updated'));
    } catch (err) {}

    setSettleModal({ isOpen: false, customer: null, amountToReceive: '' });
    showToast(`Received ₹${amt.toLocaleString()} from ${customer.name}! Balance updated and added to Today's Income.`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-black cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-8 border border-neutral-200 shadow-sm space-y-6 font-['Plus_Jakarta_Sans']">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                eKhata Customer Receivables
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Near-term Cash Inflows
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Due in &le;15 Days & Undated</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Amounts to be received from customers due within 15 days or with on-demand (undated) credit agreements.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Total Due Receivable
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-['Outfit']">
                ₹{totalSectionDue.toLocaleString()}
              </span>
            </div>
            {setActivePage && (
              <button
                onClick={() => setActivePage('ekhata')}
                className="gold-button-gradient px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer hover:scale-[1.02] min-h-[44px] w-full sm:w-auto"
              >
                <span>Open eKhata Page</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-2 sm:py-1 rounded-xl font-bold transition-all cursor-pointer text-xs min-h-[40px] sm:min-h-0 ${
                filterType === 'ALL'
                  ? 'bg-black text-yellow-300 border border-black shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              All Receivables ({allActiveCustomers.length})
            </button>
            <button
              onClick={() => setFilterType('DUE_SOON')}
              className={`px-3 py-2 sm:py-1 rounded-xl font-bold transition-all cursor-pointer text-xs min-h-[40px] sm:min-h-0 ${
                filterType === 'DUE_SOON'
                  ? 'bg-black text-yellow-300 border border-black shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              Due &le;15 Days ({dueWithin15Count})
            </button>
            <button
              onClick={() => setFilterType('UNDATED')}
              className={`px-3 py-2 sm:py-1 rounded-xl font-bold transition-all cursor-pointer text-xs min-h-[40px] sm:min-h-0 ${
                filterType === 'UNDATED'
                  ? 'bg-black text-yellow-300 border border-black shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              Undated Credit ({undatedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3.5 sm:top-3" />
            <input
              type="text"
              placeholder="Search customer name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl bg-white border border-neutral-200 text-base sm:text-xs text-black focus:border-yellow-400 outline-none"
            />
          </div>
        </div>

        {/* Mobile Stacked Card View (< md) */}
        <div className="block md:hidden space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 text-xs bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200 p-4">
              No customer receivables matching this criteria. Open eKhata to record customer balances!
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const { evalResult } = cust;
              return (
                <div
                  key={cust.id}
                  className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-full bg-black text-yellow-300 font-black text-sm flex items-center justify-center shrink-0">
                        {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-black text-sm">{cust.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-yellow-300 text-black border border-yellow-400">
                            #{cust.idNumber}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-neutral-600 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{cust.phone || 'No phone recorded'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                      Pending Udhar
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Due Timeline</span>
                      {evalResult.isUndated ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-neutral-500" />
                          <span>Undated / On-Demand</span>
                        </span>
                      ) : (
                        <div className="flex items-baseline space-x-1.5">
                          <span className="font-bold text-neutral-900 font-mono text-xs">
                            {evalResult.displayDate}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              evalResult.diffDays <= 2
                                ? 'text-rose-600'
                                : evalResult.diffDays <= 7
                                ? 'text-amber-700'
                                : 'text-neutral-500'
                            }`}
                          >
                            ({evalResult.diffDays === 0
                              ? 'Today'
                              : evalResult.diffDays < 0
                              ? `${Math.abs(evalResult.diffDays)}d Overdue`
                              : `in ${evalResult.diffDays}d`})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Receivable</span>
                      <span className="font-black text-emerald-600 font-['Outfit'] text-base">
                        ₹{Number(cust.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/60">
                    <button
                      onClick={() => handleOpenSettle(cust)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Mark Payment Received</span>
                    </button>
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
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Due Date / Timeline</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Amount to Receive</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-400">
                    No customer receivables matching this criteria. Open eKhata to record customer balances!
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const { evalResult } = cust;
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-neutral-50/70 transition-colors group"
                    >
                      {/* ID Badge */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-yellow-300 text-black border border-yellow-400 shadow-2xs">
                          #{cust.idNumber}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-black text-yellow-300 font-black text-xs flex items-center justify-center shrink-0">
                            {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-black block">{cust.name}</span>
                            <span className="text-[10px] text-neutral-400 block font-normal">
                              ID: #{cust.idNumber} • {cust.history ? cust.history.length : 0} logs
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-neutral-600">
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{cust.phone || 'No phone recorded'}</span>
                        </div>
                      </td>

                      {/* Due Date / Timeline */}
                      <td className="py-3.5 px-4">
                        {evalResult.isUndated ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
                            <Clock className="w-2.5 h-2.5 text-neutral-500" />
                            <span>Undated / On-Demand</span>
                          </span>
                        ) : (
                          <div>
                            <span className="font-bold text-neutral-900 font-mono text-xs block">
                              {evalResult.displayDate}
                            </span>
                            <span
                              className={`text-[10px] block font-sans font-semibold ${
                                evalResult.diffDays <= 2
                                    ? 'text-rose-600'
                                    : evalResult.diffDays <= 7
                                    ? 'text-amber-700'
                                    : 'text-neutral-500'
                              }`}
                            >
                              {evalResult.diffDays === 0
                                ? 'Due Today'
                                : evalResult.diffDays < 0
                                ? `${Math.abs(evalResult.diffDays)}d Overdue`
                                : `in ${evalResult.diffDays} days`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Pending Udhar
                        </span>
                      </td>

                      {/* Amount to Receive */}
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 font-['Outfit'] text-sm">
                        ₹{Number(cust.totalAmount).toLocaleString()}
                      </td>

                      {/* Quick Action: Mark Received / Settle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenSettle(cust)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs hover:scale-105"
                          title="Mark payment received from this customer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Mark Received</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Quick Settle / Receive Payment (Responsive Bottom Sheet on Mobile) */}
      {settleModal.isOpen && settleModal.customer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 border border-neutral-200 shadow-2xl relative font-['Plus_Jakarta_Sans'] max-h-[90dvh] overflow-y-auto">
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-4" />

            <button
              onClick={() => setSettleModal({ isOpen: false, customer: null, amountToReceive: '' })}
              className="absolute top-4 sm:top-5 right-4 sm:top-5 text-neutral-400 hover:text-black transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-neutral-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-neutral-100 pr-10">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black font-['Outfit']">
                  Mark Payment Received
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {settleModal.customer.name} (ID #{settleModal.customer.idNumber})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1">
                <div className="flex justify-between text-neutral-500">
                  <span>Current Outstanding Udhar:</span>
                  <span className="font-bold text-black">
                    ₹{Number(settleModal.customer.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Due Date:</span>
                  <span className="font-medium text-neutral-800">
                    {settleModal.customer.dueDate || 'Undated'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Amount Received (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 sm:top-2.5 text-neutral-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={settleModal.customer.totalAmount}
                    placeholder={`Up to ${settleModal.customer.totalAmount}`}
                    value={settleModal.amountToReceive}
                    onChange={(e) =>
                      setSettleModal({ ...settleModal, amountToReceive: e.target.value })
                    }
                    className="w-full pl-7 pr-3 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-base sm:text-xs text-black font-bold focus:border-yellow-400 outline-none min-h-[44px] sm:min-h-0"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Credits directly to Today's Income & updates customer ledger history.
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettleModal({ isOpen: false, customer: null, amountToReceive: '' })
                  }
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto gold-button-gradient px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center space-x-1 min-h-[44px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
