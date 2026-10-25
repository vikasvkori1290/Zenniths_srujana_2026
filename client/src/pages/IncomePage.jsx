import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Percent,
  Receipt,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBodyScrollLock } from '../services/useBodyScrollLock';
import { getStoredCashflowSettings, calculateBaselineSales } from '../services/predictiveAnalytics';
import { syncDailyIncomeToDb, fetchDailyIncomeFromDb } from '../services/api';

// Date utility helpers
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOffsetDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

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

  // Stored cashflow settings (grossMarginPct, dailyRunningCost)
  const [cashflowSettings] = useState(() => getStoredCashflowSettings());
  const grossMarginPct = cashflowSettings.grossMarginPct || 25;
  const dailyRunningCost = cashflowSettings.dailyRunningCost || 500;

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => getLocalDateString(getOffsetDate(-1)), []);
  const tomorrowStr = useMemo(() => getLocalDateString(getOffsetDate(1)), []);

  // Multi-day income records ledger
  const [allIncomeRecords, setAllIncomeRecords] = useState(() => {
    const saved = localStorage.getItem('aurum_all_income_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Today's entries derived and kept in sync with aurum_today_income
  const todayIncome = useMemo(() => {
    return allIncomeRecords.filter((item) => (item.date || todayStr) === todayStr);
  }, [allIncomeRecords, todayStr]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [historyRange, setHistoryRange] = useState('7D'); // '3D' | '7D' | 'ALL'
  const [expandedDay, setExpandedDay] = useState(null);
  const [pendingHighValueEntry, setPendingHighValueEntry] = useState(null);

  // Lock background scroll when Add Income modal is open
  useBodyScrollLock(isModalOpen);

  const [form, setForm] = useState({
    date: todayStr,
    source: '',
    amount: '',
    mode: 'UPI',
    category: 'In-Store Retail',
  });

  // On mount: ALWAYS load income history directly from MongoDB Atlas
  useEffect(() => {
    let isCancelled = false;
    async function loadDb() {
      setIsLoadingDb(true);
      const records = await fetchDailyIncomeFromDb();
      if (!isCancelled && records && Array.isArray(records)) {
        setAllIncomeRecords(records);
      }
      if (!isCancelled) setIsLoadingDb(false);
    }
    loadDb();

    // Listen to updates from other tabs or components
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('aurum_all_income_records');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAllIncomeRecords((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
              return parsed;
            });
          }
        }
      } catch (e) {}
    };
    window.addEventListener('aurum_income_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isCancelled = true;
      window.removeEventListener('aurum_income_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Calculate Baseline Daily Sales (Requirement 4: 7-day complete trading median, 2x median cap, exclude unconfirmed)
  const baselineDailySales = useMemo(() => {
    return calculateBaselineSales({
      salesHistory: allIncomeRecords.map((r) => ({
        date: r.date,
        sales: r.amount,
        unconfirmed: r.unconfirmed,
        isConfirmed: r.isConfirmed,
      })),
      ownerTargetDailySales: cashflowSettings.ownerTargetDailySales || profile.dailyGoal || 8000,
      todayDateStr: todayStr,
    });
  }, [allIncomeRecords, cashflowSettings.ownerTargetDailySales, profile.dailyGoal, todayStr]);

  // Sync both aurum_all_income_records and aurum_today_income & MongoDB Atlas
  useEffect(() => {
    if (isLoadingDb) return; // Prevent overwriting MongoDB before initial load completes
    const serialized = JSON.stringify(allIncomeRecords);
    if (localStorage.getItem('aurum_all_income_records') === serialized) return;

    localStorage.setItem('aurum_all_income_records', serialized);
    const currentToday = allIncomeRecords.filter((item) => (item.date || todayStr) === todayStr);
    localStorage.setItem('aurum_today_income', JSON.stringify(currentToday));
    window.dispatchEvent(new Event('aurum_income_updated'));
    window.dispatchEvent(new Event('storage'));
    syncDailyIncomeToDb(allIncomeRecords).catch(() => {});
  }, [allIncomeRecords, todayStr, isLoadingDb]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const totalTodayIncome = todayIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayGrossProfit = Math.round(totalTodayIncome * (grossMarginPct / 100));
  const todayRetainedCash = Math.max(0, todayGrossProfit - dailyRunningCost);

  const dailyTarget = profile.dailyGoal || 10000;
  const goalPercentage = Math.min(Math.round((totalTodayIncome / dailyTarget) * 100), 100);
  const remainingTarget = Math.max(0, dailyTarget - totalTodayIncome);

  const openAddModalWithDate = (dateVal) => {
    setForm({
      date: dateVal || todayStr,
      source: '',
      amount: '',
      mode: 'UPI',
      category: 'In-Store Retail',
    });
    setPendingHighValueEntry(null);
    setIsModalOpen(true);
  };

  // Commit new income item with confirmed/unconfirmed flag (Requirement 8)
  const commitNewIncome = (entryData) => {
    const profitEst = Math.round(entryData.amount * (grossMarginPct / 100));

    const newItem = {
      id: 'inc-' + Date.now(),
      date: entryData.date || todayStr,
      source: entryData.source,
      amount: entryData.amount,
      mode: entryData.mode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: entryData.category,
      isConfirmed: entryData.isConfirmed !== false,
      unconfirmed: entryData.unconfirmed === true,
    };

    localStorage.setItem('aurum_today_gross_profit_entered', 'true');
    setAllIncomeRecords((prev) => [newItem, ...prev]);
    setForm({ date: todayStr, source: '', amount: '', mode: 'UPI', category: 'In-Store Retail' });
    setPendingHighValueEntry(null);
    setIsModalOpen(false);

    showToast(
      entryData.unconfirmed
        ? `Added ₹${entryData.amount.toLocaleString()} (Flagged Unconfirmed - Excluded from baseline)`
        : `Added ₹${entryData.amount.toLocaleString()} to Today's Sales! Gross Profit: +₹${profitEst.toLocaleString()}`
    );
  };

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!form.source.trim() || !form.amount) return;

    const amountNum = Number(form.amount);
    const threshold = Math.round(baselineDailySales * 2.5);

    // Requirement 8: Flag single sale > 2.5x baseline average daily sales for confirmation
    if (amountNum > threshold && !pendingHighValueEntry) {
      setPendingHighValueEntry({
        source: form.source.trim(),
        amount: amountNum,
        mode: form.mode,
        category: form.category,
        date: todayStr,
        threshold,
      });
      return;
    }

    commitNewIncome({
      source: form.source.trim(),
      amount: amountNum,
      mode: form.mode,
      category: form.category,
      date: todayStr,
      isConfirmed: true,
      unconfirmed: false,
    });
  };

  const handleDelete = (id) => {
    setAllIncomeRecords((prev) => {
      const remaining = prev.filter((i) => i.id !== id);
      const remainingToday = remaining.filter((i) => (i.date || todayStr) === todayStr);
      if (remainingToday.length === 0) {
        localStorage.setItem('aurum_today_gross_profit_entered', 'false');
      }
      return remaining;
    });
    showToast('Income entry removed.');
  };


  // Calculate payment mode breakdown for today
  const cashTotal = todayIncome.filter((i) => i.mode === 'Cash').reduce((s, i) => s + Number(i.amount), 0);
  const upiTotal = todayIncome.filter((i) => i.mode === 'UPI').reduce((s, i) => s + Number(i.amount), 0);
  const bankTotal = todayIncome.filter((i) => i.mode === 'Bank Transfer').reduce((s, i) => s + Number(i.amount), 0);

  // Group all records by date for the history table (Requirement 5: future rows show forecast retained, never ₹0)
  const dailyHistoryList = useMemo(() => {
    const map = new Map();

    // Ensure Tomorrow, Today, and Yesterday are always explicitly in the list
    [tomorrowStr, todayStr, yesterdayStr].forEach((dateKey) => {
      map.set(dateKey, []);
    });

    // Populate with existing entries
    allIncomeRecords.forEach((item) => {
      const d = item.date || todayStr;
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d).push(item);
    });

    // Convert map to sorted array (latest date first: Tomorrow -> Today -> Yesterday -> older)
    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    const result = sortedDates.map((dateKey) => {
      const entries = map.get(dateKey) || [];
      const isFuture = dateKey > todayStr;
      const isTomorrow = dateKey === tomorrowStr;
      const isToday = dateKey === todayStr;
      const isYesterday = dateKey === yesterdayStr;

      const sales = entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const grossProfit = Math.round(sales * (grossMarginPct / 100));

      // Requirement 5: Future rows in history table show forecast retained, labelled "Forecast" (-running cost if marked closed), never ₹0
      const isForecast = isFuture && entries.length === 0;
      const isClosed = false; // can be toggled if shop marked closed
      const forecastSales = baselineDailySales;
      const forecastGrossProfit = Math.round(forecastSales * (grossMarginPct / 100));
      const forecastRetained = isClosed ? -dailyRunningCost : (forecastGrossProfit - dailyRunningCost);

      const effectiveSales = isForecast ? forecastSales : sales;
      const effectiveGrossProfit = isForecast ? forecastGrossProfit : grossProfit;
      const effectiveRetained = isForecast ? forecastRetained : (grossProfit - dailyRunningCost);

      const cashAmt = entries.filter((i) => i.mode === 'Cash').reduce((s, i) => s + Number(i.amount || 0), 0);
      const upiAmt = entries.filter((i) => i.mode === 'UPI').reduce((s, i) => s + Number(i.amount || 0), 0);
      const bankAmt = entries.filter((i) => i.mode === 'Bank Transfer').reduce((s, i) => s + Number(i.amount || 0), 0);

      let label = null;
      if (isToday) label = 'Today';
      else if (isYesterday) label = 'Yesterday';
      else if (isTomorrow) label = 'Tomorrow';
      else if (isFuture) label = 'Forecast';

      return {
        date: dateKey,
        label,
        isFuture,
        isForecast,
        isClosed,
        entries,
        sales: effectiveSales,
        grossMarginPct,
        grossProfit: effectiveGrossProfit,
        dailyRunningCost,
        retainedCash: effectiveRetained,
        cashAmt,
        upiAmt,
        bankAmt,
        txCount: entries.length,
      };
    });

    if (historyRange === '3D') {
      return result.filter((d) => d.date === tomorrowStr || d.date === todayStr || d.date === yesterdayStr);
    }
    if (historyRange === '7D') {
      return result.slice(0, 8); // Tomorrow + Today + 6 past days
    }
    return result;
  }, [allIncomeRecords, todayStr, yesterdayStr, tomorrowStr, grossMarginPct, dailyRunningCost, historyRange, baselineDailySales]);

  // Aggregate stats across the visible history table (Requirement 4: Avg gross profit/day & Avg retained/day)
  const totalHistorySales = useMemo(() => {
    return dailyHistoryList.reduce((sum, day) => sum + (day.isForecast ? 0 : day.sales), 0);
  }, [dailyHistoryList]);

  const totalHistoryProfit = useMemo(() => {
    return dailyHistoryList.reduce((sum, day) => sum + (day.isForecast ? 0 : day.grossProfit), 0);
  }, [dailyHistoryList]);

  const activeDaysWithSales = dailyHistoryList.filter((d) => !d.isForecast && d.sales > 0);
  const avgGrossProfitPerDay = activeDaysWithSales.length > 0
    ? Math.round(totalHistoryProfit / activeDaysWithSales.length)
    : Math.round(baselineDailySales * (grossMarginPct / 100));
  const avgRetainedPerDay = Math.round(avgGrossProfitPerDay - dailyRunningCost);

  return (
    <div className="w-full bg-white text-neutral-900 pb-20 font-['Plus_Jakarta_Sans']">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="px-5 py-3 rounded-2xl bg-black text-yellow-300 border border-yellow-400 shadow-2xl text-xs font-bold flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                Today's Income & Daily Collections
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
              Real-time record of all daily sales, profit margins, and multi-day ledger history.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Today</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-['Outfit']">
                ₹{totalTodayIncome.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => openAddModalWithDate(todayStr)}
              className="gold-button-gradient px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-black border border-yellow-400 flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer min-h-11 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Today's Sales</span>
            </button>
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

        {/* ========================================================= */}
        {/* SECTION 2: DAILY SALES & GROSS PROFIT HISTORY TABLE       */}
        {/* ========================================================= */}
        <section className="space-y-4 pt-6 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight">
                  Daily Sales & Gross Profit History
                </h2>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Complete daily ledger of sales, margin ({grossMarginPct}%), gross profit, and retained earnings for Yesterday, Today, Tomorrow, and past cycles.
              </p>
            </div>

            {/* Quick Range Selector & Add Entry */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-neutral-100 p-1 rounded-xl text-xs font-bold border border-neutral-200">
                <button
                  onClick={() => setHistoryRange('3D')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    historyRange === '3D' ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  Yesterday • Today • Tomorrow
                </button>
                <button
                  onClick={() => setHistoryRange('7D')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    historyRange === '7D' ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setHistoryRange('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    historyRange === 'ALL' ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  All History
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Overview Strip (Requirement 4: Avg gross profit/day & Avg retained/day) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Sales Recorded</span>
              <span className="text-lg font-black text-black font-['Outfit'] block mt-0.5">
                ₹{totalHistorySales.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-500">Across {dailyHistoryList.length} calendar dates</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Gross Profit</span>
              <span className="text-lg font-black text-emerald-600 font-['Outfit'] block mt-0.5">
                ₹{totalHistoryProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">At {grossMarginPct}% profit margin</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Avg gross profit/day</span>
              <span className="text-lg font-black text-amber-700 font-['Outfit'] block mt-0.5">
                ₹{avgGrossProfitPerDay.toLocaleString()}/day
              </span>
              <span className="text-[10px] text-neutral-500">On active trading days</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Avg retained/day</span>
              <span className={`text-lg font-black font-['Outfit'] block mt-0.5 ${avgRetainedPerDay >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {avgRetainedPerDay >= 0 ? '+' : ''}₹{avgRetainedPerDay.toLocaleString()}/day
              </span>
              <span className="text-[10px] text-neutral-500">After ₹{dailyRunningCost}/d running cost</span>
            </div>
          </div>

          {/* The History Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-5">Date & Timeline</th>
                    <th className="py-3 px-4 sm:px-5">Daily Sales (Gross)</th>
                    <th className="py-3 px-4 sm:px-5">Gross Margin</th>
                    <th className="py-3 px-4 sm:px-5">Gross Profit (₹)</th>
                    <th className="py-3 px-4 sm:px-5">Retained Cash</th>
                    <th className="py-3 px-4 sm:px-5">Mode Breakdown</th>
                    <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {dailyHistoryList.map((day) => {
                    const isToday = day.date === todayStr;
                    const isYesterday = day.date === yesterdayStr;
                    const isTomorrow = day.date === tomorrowStr;
                    const isExpanded = expandedDay === day.date;
                    const isForecastRow = day.isForecast;

                    return (
                      <React.Fragment key={day.date}>
                        <tr
                          className={`transition-colors hover:bg-neutral-50/70 ${
                            isToday ? 'bg-emerald-50/30' : isForecastRow || isTomorrow ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* 1. Date & Badge (Requirement 5: Future rows labelled "Forecast") */}
                          <td className="py-3.5 px-4 sm:px-5 font-semibold">
                            <div className="flex items-center space-x-2">
                              {isForecastRow ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs bg-amber-400 text-black border-amber-500">
                                  Forecast
                                </span>
                              ) : day.label ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                                    isToday
                                      ? 'bg-emerald-500 text-white border-emerald-600'
                                      : isYesterday
                                      ? 'bg-neutral-800 text-yellow-300 border-neutral-900'
                                      : 'bg-amber-400 text-black border-amber-500'
                                  }`}
                                >
                                  {day.label}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                                  Past
                                </span>
                              )}
                              <span className="font-bold text-neutral-900 whitespace-nowrap">
                                {formatDisplayDate(day.date)}
                              </span>
                            </div>
                          </td>

                          {/* 2. Daily Sales */}
                          <td className="py-3.5 px-4 sm:px-5">
                            <div className="font-mono font-black text-sm text-neutral-900">
                              ₹{day.sales.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-neutral-400">
                              {isForecastRow ? 'Forecast target' : `${day.txCount} ${day.txCount === 1 ? 'entry' : 'entries'}`}
                            </span>
                          </td>

                          {/* 3. Gross Margin */}
                          <td className="py-3.5 px-4 sm:px-5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 font-bold text-neutral-700 text-[11px]">
                              <span>{day.grossMarginPct}%</span>
                            </span>
                          </td>

                          {/* 4. Gross Profit */}
                          <td className="py-3.5 px-4 sm:px-5 font-mono">
                            <span className="inline-flex items-center space-x-1 font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                              <span>+₹{day.grossProfit.toLocaleString()}</span>
                            </span>
                          </td>

                          {/* 5. Retained Cash (Requirement 5: Future rows show forecast retained, never ₹0) */}
                          <td className="py-3.5 px-4 sm:px-5 font-mono font-bold text-neutral-800">
                            <span className={day.retainedCash < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                              {day.retainedCash >= 0 ? '+' : ''}₹{day.retainedCash.toLocaleString()}
                            </span>
                            <span className="block text-[9px] text-neutral-400 font-sans">
                              {isForecastRow ? 'Forecast retained' : `after ₹${day.dailyRunningCost} running`}
                            </span>
                          </td>

                          {/* 6. Mode Breakdown */}
                          <td className="py-3.5 px-4 sm:px-5 text-[11px]">
                            {isForecastRow ? (
                              <span className="text-amber-800 text-[10px] font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                Projected Cash + UPI
                              </span>
                            ) : day.sales > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 text-neutral-600">
                                {day.cashAmt > 0 && (
                                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    Cash: ₹{day.cashAmt.toLocaleString()}
                                  </span>
                                )}
                                {day.upiAmt > 0 && (
                                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-700">
                                    UPI: ₹{day.upiAmt.toLocaleString()}
                                  </span>
                                )}
                                {day.bankAmt > 0 && (
                                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-blue-700">
                                    Bank: ₹{day.bankAmt.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic text-[11px]">No sales logged</span>
                            )}
                          </td>

                          {/* 7. Actions */}
                          <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-2">
                              {day.txCount > 0 ? (
                                <button
                                  onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center space-x-1 cursor-pointer"
                                  title="View itemized entries"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Entries'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => openAddModalWithDate(day.date)}
                                  className="text-amber-600 hover:text-amber-700 font-bold text-xs hover:underline cursor-pointer"
                                >
                                  + Add Entry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable itemized transactions for this day */}
                        {isExpanded && day.entries.length > 0 && (
                          <tr className="bg-neutral-50/90 border-y border-neutral-200">
                            <td colSpan={7} className="p-4 sm:p-5">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                                  <span className="text-xs font-bold text-neutral-700 flex items-center space-x-1.5">
                                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Itemized Transactions for {formatDisplayDate(day.date)}</span>
                                  </span>
                                  <span className="text-xs font-bold text-emerald-700 font-mono">
                                    Day's Profit: +₹{day.grossProfit.toLocaleString()}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                                  {day.entries.map((tx) => (
                                    <div
                                      key={tx.id}
                                      className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <p className="text-xs font-bold text-black truncate">{tx.source}</p>
                                        <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500 mt-0.5">
                                          <span>{tx.time}</span>
                                          <span>•</span>
                                          <span className="font-semibold text-neutral-700">{tx.mode}</span>
                                          <span>•</span>
                                          <span className="truncate">{tx.category}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2 shrink-0">
                                        <div className="text-right">
                                          <span className="text-xs font-black text-emerald-600 font-mono block">
                                            +₹{Number(tx.amount).toLocaleString()}
                                          </span>
                                          <span className="text-[9px] font-bold text-amber-700 block">
                                            Profit: ₹{Math.round(Number(tx.amount) * (grossMarginPct / 100)).toLocaleString()}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleDelete(tx.id)}
                                          className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                          title="Delete entry"
                                          aria-label="Delete entry"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Add Income Modal (Multi-day date picker + live profit preview) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md border border-neutral-200 shadow-2xl max-h-[90dvh] overflow-y-auto">
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  +
                </div>
                <h3 className="text-base font-black text-black font-['Outfit']">Record Today's Sales</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-black p-2 min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pendingHighValueEntry ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-sm">High-Value Sale Confirmation (&gt; 2.5× Baseline)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This sale entry of <strong>₹{pendingHighValueEntry.amount.toLocaleString()}</strong> is greater than <strong>2.5×</strong> your shop's average baseline sales (₹{baselineDailySales.toLocaleString()}).
                  </p>
                  <p className="text-[11px] text-neutral-600">
                    To maintain forecast integrity (Requirement 8), unconfirmed large spikes can be recorded for cash-in-hand while being excluded from the 7-day statistical baseline.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => commitNewIncome({ ...pendingHighValueEntry, isConfirmed: true, unconfirmed: false })}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm as Regular Sale (Include in Baseline)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => commitNewIncome({ ...pendingHighValueEntry, isConfirmed: false, unconfirmed: true })}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Record as One-Off / Unconfirmed (Exclude from Baseline)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingHighValueEntry(null)}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-neutral-500 hover:text-black cursor-pointer text-center"
                  >
                    ← Edit Amount or Cancel
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddIncome} className="mt-4 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-neutral-600 mb-1">Source / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Counter Cash Sales, Client Order #40"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs min-h-11 sm:min-h-0"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">Gross Sales Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs font-mono font-bold min-h-11 sm:min-h-0"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Entries &gt; ₹{Math.round(baselineDailySales * 2.5).toLocaleString()} (2.5× baseline) require confirmation
                  </span>
                </div>

                {/* Real-time Gross Profit Preview */}
                {form.amount && Number(form.amount) > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-bold flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gross Profit (@ {grossMarginPct}%):</span>
                      </span>
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        +₹{Math.round(Number(form.amount) * (grossMarginPct / 100)).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      Stock cost is automatically absorbed. Retained cash: ~₹
                      {Math.max(
                        0,
                        Math.round(Number(form.amount) * (grossMarginPct / 100)) - dailyRunningCost
                      ).toLocaleString()}{' '}
                      (after ₹{dailyRunningCost}/day running expenses).
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 mb-1">Payment Mode</label>
                    <select
                      value={form.mode}
                      onChange={(e) => setForm({ ...form, mode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs min-h-11 sm:min-h-0"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-hidden focus:border-amber-400 text-base sm:text-xs min-h-11 sm:min-h-0"
                    >
                      <option value="In-Store Retail">In-Store Retail</option>
                      <option value="Digital Collections">Digital Collections</option>
                      <option value="eKhata Received">eKhata Repayment</option>
                      <option value="B2B Client Invoice">B2B Invoice</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-neutral-600 hover:text-black border border-neutral-200 min-h-11 flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto gold-button-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm cursor-pointer min-h-11 flex items-center justify-center"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
