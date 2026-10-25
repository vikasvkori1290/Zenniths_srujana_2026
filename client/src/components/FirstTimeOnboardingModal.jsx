import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Building2,
  DollarSign,
  HelpCircle,
  Percent,
  Calendar,
} from 'lucide-react';
import { getStoredCashflowSettings, saveCashflowSettings } from '../services/predictiveAnalytics';
import { useBodyScrollLock } from '../services/useBodyScrollLock';
import { syncSettingsToDb, syncFixedExpensesToDb, syncDailyIncomeToDb } from '../services/api';

const DEFAULT_FIXED_PRESETS = [];

export default function FirstTimeOnboardingModal({ isOpen: controlledIsOpen, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Cash & Margins, 2: Fixed Expenses, 3: Today's Sales

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // User Profile Info
  const [businessName, setBusinessName] = useState('My Store');
  const [businessType, setBusinessType] = useState('Retail');

  // Step 1: Cash Engine Settings
  const [openingCash, setOpeningCash] = useState(0);
  const [grossMarginPct, setGrossMarginPct] = useState(25);
  const [dailyRunningCost, setDailyRunningCost] = useState(0);

  // Step 2: Fixed Expenses
  const [fixedList, setFixedList] = useState([]);

  // Step 3: Today's Initial Sales (Optional)
  const [cashSalesToday, setCashSalesToday] = useState(0);
  const [upiSalesToday, setUpiSalesToday] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(10000);

  // Listen for first-time setup or explicit trigger
  useEffect(() => {
    const checkSetup = () => {
      const needsSetup = localStorage.getItem('finsafe_first_time_setup') === 'true';
      if (needsSetup) {
        setIsOpen(true);
      }
    };
    checkSetup();

    const handleOpenWizard = () => {
      // Reload current stored values
      const cur = getStoredCashflowSettings();
      setOpeningCash(cur.openingCash || 40000);
      setGrossMarginPct(cur.grossMarginPct || 25);
      setDailyRunningCost(cur.dailyRunningCost || 500);

      const savedFixed = localStorage.getItem('aurum_fixed_expenses');
      if (savedFixed) {
        try {
          const parsed = JSON.parse(savedFixed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFixedList(parsed);
          }
        } catch (e) {}
      }

      setStep(1);
      setIsOpen(true);
    };

    window.addEventListener('finsafe_open_setup_wizard', handleOpenWizard);
    return () => window.removeEventListener('finsafe_open_setup_wizard', handleOpenWizard);
  }, []);

  // Sync controlled state if provided
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Load existing profile name
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('aurum_profile_info') || '{}');
      if (p.businessName) setBusinessName(p.businessName);
      if (p.businessType) setBusinessType(p.businessType);
      if (p.dailyGoal) setDailyTarget(Number(p.dailyGoal));
    } catch (e) {}
  }, [isOpen]);

  const handleClose = () => {
    localStorage.removeItem('finsafe_first_time_setup');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleAddFixedRow = () => {
    setFixedList([
      ...fixedList,
      {
        id: 'fix-' + Date.now(),
        title: 'New Monthly Commitment',
        amount: 2000,
        category: 'Utilities',
        dueDay: 15,
        notes: 'Monthly recurring commitment',
        status: 'Pending',
        receiptName: null,
      },
    ]);
  };

  const handleUpdateFixedRow = (id, field, value) => {
    setFixedList(
      fixedList.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveFixedRow = (id) => {
    setFixedList(fixedList.filter((row) => row.id !== id));
  };

  const totalMonthlyFixed = fixedList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleFinalSave = () => {
    const settingsPayload = {
      openingCash: Number(openingCash) || 0,
      grossMarginPct: Number(grossMarginPct) || 20,
      dailyRunningCost: Number(dailyRunningCost) || 0,
      ownerTargetDailySales: Number(dailyTarget) || 10000,
    };
    saveCashflowSettings(settingsPayload);
    syncSettingsToDb(settingsPayload).catch((err) => {
      console.warn('Failed to sync settings to DB:', err);
    });

    // 2. Save fixed expenses
    const cleanedFixed = fixedList.map((item, idx) => ({
      id: item.id || `fix-${idx + 1}`,
      title: item.title?.trim() || 'Monthly Expense',
      amount: Number(item.amount) || 0,
      category: item.category || 'Utilities',
      dueDay: Math.min(31, Math.max(1, Number(item.dueDay) || 1)),
      status: item.status || 'Pending',
      notes: item.notes || 'Recurring monthly commitment',
      receiptName: item.receiptName || null,
    }));
    localStorage.setItem('aurum_fixed_expenses', JSON.stringify(cleanedFixed));
    syncFixedExpensesToDb(cleanedFixed).catch((err) => {
      console.warn('Failed to sync fixed expenses to DB:', err);
    });

    // 3. Update profile daily goal
    try {
      const p = JSON.parse(localStorage.getItem('aurum_profile_info') || '{}');
      p.dailyGoal = Number(dailyTarget) || 10000;
      localStorage.setItem('aurum_profile_info', JSON.stringify(p));
    } catch (e) {}

    // 4. If today sales entered, save to income
    if (Number(cashSalesToday) > 0 || Number(upiSalesToday) > 0) {
      const todayEntry = {
        id: 'inc-setup-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        cash: Number(cashSalesToday) || 0,
        upi: Number(upiSalesToday) || 0,
        udhar: 0,
        total: (Number(cashSalesToday) || 0) + (Number(upiSalesToday) || 0),
        note: 'Opening sales recorded during store setup',
      };
      localStorage.setItem('aurum_today_income', JSON.stringify([todayEntry]));
      syncDailyIncomeToDb([todayEntry]).catch((err) => {
        console.warn('Failed to sync income to DB:', err);
      });
      window.dispatchEvent(new Event('aurum_income_updated'));
    }

    // 5. Broadcast updates
    window.dispatchEvent(new Event('aurum_cashflow_settings_updated'));
    window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
    window.dispatchEvent(new Event('aurum_expenses_updated'));
    window.dispatchEvent(new Event('storage'));

    localStorage.removeItem('finsafe_first_time_setup');
    localStorage.setItem('finsafe_onboarding_completed', 'true');
    window.dispatchEvent(new Event('finsafe_setup_completed'));
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-2xl border border-neutral-200 shadow-2xl max-h-[92dvh] flex flex-col justify-between overflow-hidden">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3 shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-xs border border-yellow-400">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-black font-['Outfit'] tracking-tight">
                Store Financial Setup Wizard
              </h2>
              <span className="text-xs text-neutral-500 block">
                {businessName} • {businessType}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-black p-2 rounded-xl hover:bg-neutral-100 cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
            title="Skip for now"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between py-3 px-2 border-b border-neutral-100 shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1 ? 'bg-amber-400 text-black' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              1
            </span>
            <span className={`font-bold ${step === 1 ? 'text-black' : 'text-neutral-500'}`}>
              Cash Reserves & Margins
            </span>
          </div>
          <div className="h-0.5 w-8 bg-neutral-200 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2 ? 'bg-amber-400 text-black' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              2
            </span>
            <span className={`font-bold ${step === 2 ? 'text-black' : 'text-neutral-500'}`}>
              Fixed Commitments
            </span>
          </div>
          <div className="h-0.5 w-8 bg-neutral-200 hidden sm:block" />
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3 ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              3
            </span>
            <span className={`font-bold ${step === 3 ? 'text-black' : 'text-neutral-500'}`}>
              Launch Runway
            </span>
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="overflow-y-auto py-4 flex-1 space-y-5 pr-1">
          {/* STEP 1: Opening Reserves & Margin Engine */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 text-xs">
                <p className="font-bold mb-1">💡 How FinSafe calculates your survival runway:</p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  You do not keep gross sales. FinSafe reserves your restocking cost <span className="font-bold">(1 − Margin %)</span> and daily counter costs, displaying only your real <strong>Retained Cash</strong>.
                </p>
              </div>

              {/* Opening Cash Input */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  1. Current Till & Bank Cash Reserves (₹) *
                </label>
                <span className="text-[11px] text-neutral-500 block mb-2">
                  Total liquid cash available right now across your shop till, UPI merchant account, and bank accounts.
                </span>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-neutral-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-base sm:text-sm text-black focus:border-yellow-400 outline-none"
                    placeholder="e.g. 40000"
                  />
                </div>
              </div>

              {/* Gross Margin % */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  2. Average Gross Profit Margin (%) *
                </label>
                <span className="text-[11px] text-neutral-500 block mb-2">
                  Your gross profit after supplier purchase / wholesale restocking costs.
                </span>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="5"
                      max="90"
                      required
                      value={grossMarginPct}
                      onChange={(e) => setGrossMarginPct(e.target.value)}
                      className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-base sm:text-sm text-black focus:border-yellow-400 outline-none"
                    />
                    <Percent className="w-4 h-4 text-neutral-400 absolute right-3 top-3.5" />
                  </div>
                  <div className="flex items-center space-x-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setGrossMarginPct(20)}
                      className={`px-2.5 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                        Number(grossMarginPct) === 20 ? 'bg-black text-yellow-300 border-black' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      Kirana (20%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrossMarginPct(25)}
                      className={`px-2.5 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                        Number(grossMarginPct) === 25 ? 'bg-black text-yellow-300 border-black' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      Retail (25%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrossMarginPct(35)}
                      className={`px-2.5 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                        Number(grossMarginPct) === 35 ? 'bg-black text-yellow-300 border-black' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      Bakery (35%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Running Cost */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  3. Daily Running Cost (₹ / day) *
                </label>
                <span className="text-[11px] text-neutral-500 block mb-2">
                  Counter operational expenses: chai, packing bags, minor repairs, helper daily wage, delivery fuel.
                </span>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-neutral-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dailyRunningCost}
                    onChange={(e) => setDailyRunningCost(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-base sm:text-sm text-black focus:border-yellow-400 outline-none"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="mt-2 text-[10.5px] text-neutral-500 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                  ⚖️ <strong>Accounting Invariant</strong>: A cost belongs to daily running cost OR monthly fixed expenses (Step 2), never both.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Monthly Fixed Commitments */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-xs font-bold text-black">Monthly Fixed Outlays & Commitments</h3>
                  <span className="text-[11px] text-neutral-500">
                    Edit the amounts or due days below to match your real store commitments.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddFixedRow}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1">
                {fixedList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateFixedRow(item.id, 'title', e.target.value)}
                        placeholder="Commitment Title"
                        className="w-full text-xs font-bold text-black bg-transparent border-b border-dashed border-neutral-300 focus:border-yellow-500 outline-none pb-0.5"
                      />
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-neutral-400">Due day:</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={item.dueDay}
                          onChange={(e) => handleUpdateFixedRow(item.id, 'dueDay', e.target.value)}
                          className="w-12 text-center text-[11px] font-mono font-bold bg-white border border-neutral-200 rounded px-1 py-0.5"
                        />
                        <span className="text-[10px] text-neutral-400">th of month</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative w-32 sm:w-36">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-neutral-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleUpdateFixedRow(item.id, 'amount', e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-neutral-300 text-xs font-mono font-black text-rose-700 bg-white focus:border-yellow-400 outline-none"
                          placeholder="Amount"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFixedRow(item.id)}
                        className="p-2 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Remove commitment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-600">Total Monthly Fixed Commitments:</span>
                <span className="text-sm font-black text-black font-['Outfit']">
                  ₹{totalMonthlyFixed.toLocaleString()} / mo
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Today's Sales & Finish */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs">
                <p className="font-bold flex items-center space-x-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Almost Ready! Confirm your parameters:</span>
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-200 font-mono text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Reserves</span>
                    <strong>₹{Number(openingCash).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Margin</span>
                    <strong>{grossMarginPct}%</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Fixed/mo</span>
                    <strong>₹{totalMonthlyFixed.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Target Daily Gross Sales (₹ / day)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-neutral-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="1000"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-sm text-black focus:border-yellow-400 outline-none"
                    placeholder="e.g. 10000"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <span className="text-xs font-bold text-neutral-800 block">
                  Today's Sales So Far (Optional — or leave 0)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-neutral-500 block mb-1">Counter Cash (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={cashSalesToday}
                      onChange={(e) => setCashSalesToday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block mb-1">QR / UPI Received (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={upiSalesToday}
                      onChange={(e) => setUpiSalesToday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs font-bold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl text-neutral-600 hover:text-black border border-neutral-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer min-h-11"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer min-h-11"
            >
              Skip Setup
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="gold-button-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-black border border-yellow-400 shadow-sm flex items-center space-x-1.5 cursor-pointer min-h-11"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="gold-button-gradient px-6 py-2.5 rounded-xl text-xs font-black text-black border border-yellow-400 shadow-md flex items-center space-x-1.5 cursor-pointer min-h-11 hover:scale-102 transition-transform"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Launch My Financial Runway</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
