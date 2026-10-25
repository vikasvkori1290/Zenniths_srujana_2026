import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Info,
  Sliders,
  Settings,
  X,
  Check,
  Wallet,
  Clock,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Tag,
  RefreshCw,
  Building2,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import {
  calculatePredictiveCashRunway,
  getStoredCashflowSettings,
  saveCashflowSettings,
  DEFAULT_MARGINS_BY_TYPE,
} from '../services/predictiveAnalytics';
import { getStoredFixedExpenses } from '../services/expenseSync';
import {
  fetchContextAdjustments,
  generateDomainAdjustments,
  sanitizeAdjustments,
} from '../services/contextAdjuster';
import calendarData from '../data/calendar.js';
import { useBodyScrollLock } from '../services/useBodyScrollLock';
import { useAuth } from '../context/AuthContext';

export function normalizeBusinessType(typeStr) {
  if (!typeStr) return 'kirana';
  const s = typeStr.toLowerCase();
  if (s.includes('sweet') || s.includes('bake') || s.includes('mithai') || s.includes('cake')) return 'sweets';
  if (s.includes('hard') || s.includes('paint') || s.includes('electr') || s.includes('tool')) return 'hardware';
  if (s.includes('book') || s.includes('station') || s.includes('print')) return 'stationery';
  if (s.includes('cloth') || s.includes('garment') || s.includes('apparel') || s.includes('fashion') || s.includes('textile')) return 'garments';
  if (s.includes('pharm') || s.includes('medic') || s.includes('chemist') || s.includes('drug')) return 'pharmacy';
  if (s.includes('cafe') || s.includes('restaurant') || s.includes('food') || s.includes('hotel')) return 'cafe';
  return 'kirana';
}

const BUSINESS_TYPE_OPTIONS = [
  { id: 'kirana', label: 'Retail Kirana & Provisions', margin: 20 },
  { id: 'sweets', label: 'Sweets & Bakery', margin: 35 },
  { id: 'hardware', label: 'Hardware, Paints & Electricals', margin: 18 },
  { id: 'stationery', label: 'Books & Stationery', margin: 22 },
  { id: 'garments', label: 'Garments & Apparel', margin: 35 },
  { id: 'pharmacy', label: 'Retail Pharmacy', margin: 20 },
];

export default function PredictiveCashRunwayCard() {
  const { user } = useAuth();
  const [profileSyncKey, setProfileSyncKey] = useState(0);

  const [todayIncome, setTodayIncome] = useState(() => {
    const saved = localStorage.getItem('aurum_today_income');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState(() => getStoredFixedExpenses());

  const [upcomingExpenses, setUpcomingExpenses] = useState(() => {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [eKhataCustomers, setEKhataCustomers] = useState(() => {
    const saved = localStorage.getItem('aurum_ekhata_data');
    return saved ? JSON.parse(saved) : [];
  });

  // Onboarding & Cashflow Settings (Margin, Running Cost, Opening Cash, Buffer)
  const [cashflowSettings, setCashflowSettings] = useState(() => getStoredCashflowSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(cashflowSettings);

  // Expected vs Reality toggle mode ('expected' | 'reality')
  const [timelineMode, setTimelineMode] = useState(() => {
    return localStorage.getItem('aurum_timeline_mode') || 'expected';
  });

  const handleToggleTimelineMode = (mode) => {
    setTimelineMode(mode);
    localStorage.setItem('aurum_timeline_mode', mode);
    window.dispatchEvent(new Event('aurum_timeline_mode_updated'));
  };

  // Derive registered business label from user profile entered during signup
  const registeredBusinessLabel = useMemo(() => {
    if (user?.businessType) return user.businessType;
    try {
      const u = JSON.parse(localStorage.getItem('aurum_auth_user') || 'null');
      if (u?.businessType) return u.businessType;
      const p = JSON.parse(localStorage.getItem('aurum_profile_info') || 'null');
      if (p?.businessType) return p.businessType;
    } catch (e) {}
    const direct = localStorage.getItem('aurum_business_type');
    if (direct && direct !== 'kirana') return direct;
    return 'Retail Store';
  }, [user, profileSyncKey]);

  // Normalized business model for domain rules & multipliers
  const [businessType, setBusinessType] = useState(() => {
    return normalizeBusinessType(registeredBusinessLabel);
  });

  useEffect(() => {
    const normalized = normalizeBusinessType(registeredBusinessLabel);
    setBusinessType(normalized);
  }, [registeredBusinessLabel]);

  const [profileLocation, setProfileLocation] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('aurum_profile_info') || '{}');
      return {
        city: p.city || 'Bengaluru',
        state: p.state || 'Karnataka',
      };
    } catch (e) {
      return { city: 'Bengaluru', state: 'Karnataka' };
    }
  });

  // Festival & Context Sales Adjuster Toggle
  const [isFestivalAdjustmentOn, setIsFestivalAdjustmentOn] = useState(() => {
    const saved = localStorage.getItem('aurum_festival_toggle');
    return saved !== null ? saved === 'true' : true;
  });

  // Context Adjustments state (bounded multipliers + reasons)
  const [contextAdjustments, setContextAdjustments] = useState(() => {
    return generateDomainAdjustments(businessType, calendarData);
  });
  const [isAdjusterLoading, setIsAdjusterLoading] = useState(false);
  const [adjusterUnavailable, setAdjusterUnavailable] = useState(false);
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);
  const [hoveredHistoryDay, setHoveredHistoryDay] = useState(null); // 'yesterday' | 'today' | null

  // Load / fetch adjustments whenever businessType, city, or refresh happens
  useEffect(() => {
    let isCancelled = false;

    async function loadAdjustments() {
      setIsAdjusterLoading(true);
      try {
        const res = await fetchContextAdjustments({
          businessType,
          city: profileLocation.city,
          state: profileLocation.state,
        });
        if (!isCancelled) {
          setContextAdjustments(res.adjustments || []);
          setAdjusterUnavailable(!!res.unavailable);
        }
      } catch (err) {
        if (!isCancelled) {
          const fallback = sanitizeAdjustments(null, calendarData);
          setContextAdjustments(fallback.adjustments);
          setAdjusterUnavailable(true);
        }
      } finally {
        if (!isCancelled) setIsAdjusterLoading(false);
      }
    }

    loadAdjustments();

    return () => {
      isCancelled = true;
    };
  }, [businessType, profileLocation.city, profileLocation.state]);

  // Handle Festival Toggle switch
  const handleToggleFestival = () => {
    const nextVal = !isFestivalAdjustmentOn;
    setIsFestivalAdjustmentOn(nextVal);
    localStorage.setItem('aurum_festival_toggle', String(nextVal));
    window.dispatchEvent(new Event('aurum_festival_toggle_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  // Handle Business Type switch
  const handleChangeBusinessType = (newType) => {
    setBusinessType(newType);
    localStorage.setItem('aurum_business_type', newType);

    // Also suggest recommended gross margin for this business type
    const presetMargin = DEFAULT_MARGINS_BY_TYPE[newType];
    if (presetMargin && presetMargin !== cashflowSettings.grossMarginPct) {
      const updated = saveCashflowSettings({ grossMarginPct: presetMargin });
      setCashflowSettings(updated);
      setSettingsForm(updated);
    }

    window.dispatchEvent(new Event('aurum_business_type_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  // Sync with global events
  useEffect(() => {
    const refreshData = () => {
      try {
        const savedInc = localStorage.getItem('aurum_today_income');
        if (savedInc) setTodayIncome(JSON.parse(savedInc));

        setFixedExpenses(getStoredFixedExpenses());

        const savedUp = localStorage.getItem('aurum_upcoming_expenses');
        if (savedUp) setUpcomingExpenses(JSON.parse(savedUp));

        const savedKhata = localStorage.getItem('aurum_ekhata_data');
        if (savedKhata) setEKhataCustomers(JSON.parse(savedKhata));

        const freshSettings = getStoredCashflowSettings();
        setCashflowSettings(freshSettings);
        setSettingsForm(freshSettings);

        const savedToggle = localStorage.getItem('aurum_festival_toggle');
        if (savedToggle !== null) setIsFestivalAdjustmentOn(savedToggle === 'true');

        const savedType = localStorage.getItem('aurum_business_type');
        if (savedType) setBusinessType(normalizeBusinessType(savedType));
        setProfileSyncKey((k) => k + 1);

        const p = JSON.parse(localStorage.getItem('aurum_profile_info') || '{}');
        setProfileLocation({
          city: p.city || 'Bengaluru',
          state: p.state || 'Karnataka',
        });
        const savedMode = localStorage.getItem('aurum_timeline_mode');
        if (savedMode) setTimelineMode(savedMode);
      } catch (e) {}
    };

    window.addEventListener('aurum_income_updated', refreshData);
    window.addEventListener('aurum_fixed_expenses_updated', refreshData);
    window.addEventListener('aurum_expenses_updated', refreshData);
    window.addEventListener('aurum_ekhata_updated', refreshData);
    window.addEventListener('aurum_cashflow_settings_updated', refreshData);
    window.addEventListener('aurum_festival_toggle_updated', refreshData);
    window.addEventListener('aurum_business_type_updated', refreshData);
    window.addEventListener('aurum_timeline_mode_updated', refreshData);
    window.addEventListener('storage', refreshData);

    return () => {
      window.removeEventListener('aurum_income_updated', refreshData);
      window.removeEventListener('aurum_fixed_expenses_updated', refreshData);
      window.removeEventListener('aurum_expenses_updated', refreshData);
      window.removeEventListener('aurum_ekhata_updated', refreshData);
      window.removeEventListener('aurum_cashflow_settings_updated', refreshData);
      window.removeEventListener('aurum_festival_toggle_updated', refreshData);
      window.removeEventListener('aurum_business_type_updated', refreshData);
      window.removeEventListener('aurum_timeline_mode_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  // Compute live analytics using the new Retained Cash and Timeline Engine with festival multipliers
  const analytics = useMemo(() => {
    return calculatePredictiveCashRunway({
      todayIncomeList: todayIncome,
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      eKhataCustomersList: eKhataCustomers,
      customSettings: cashflowSettings,
      contextAdjustments,
      isFestivalAdjustmentOn,
    });
  }, [
    todayIncome,
    fixedExpenses,
    upcomingExpenses,
    eKhataCustomers,
    cashflowSettings,
    contextAdjustments,
    isFestivalAdjustmentOn,
  ]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = saveCashflowSettings(settingsForm);
    setCashflowSettings(updated);
    setIsSettingsOpen(false);
  };

  const handleApplyPresetMargin = (pct) => {
    setSettingsForm((prev) => ({
      ...prev,
      grossMarginPct: pct,
    }));
  };

  // Lock background scroll when assumptions drawer is open
  useBodyScrollLock(isSettingsOpen);

  // SVG Chart Geometry calculations for 60-day timeline
  const timelinePoints = analytics.timeline || [];
  const chartHeight = 260;
  const chartWidth = 960;
  const paddingLeft = 76;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 42;

  // Stored opening cash and today's reality balance (free_cash = opening + sum(retained))
  const yesterdayBalance = Number(cashflowSettings.openingCash || 40000);
  const todayRealityBalance = analytics.freeCashToday || 43495;

  // Determine if today's gross profit has been entered by the user
  const hasEnteredTodayGrossProfit = useMemo(() => {
    const flag = localStorage.getItem('aurum_today_gross_profit_entered');
    if (flag === 'true' && todayIncome && todayIncome.length > 0) return true;
    if (flag === 'false') return false;
    return Boolean(todayIncome && todayIncome.length > 0 && (analytics.actualTodaySales || 0) > 0);
  }, [todayIncome, analytics.actualTodaySales]);

  const minVal = useMemo(() => {
    if (timelinePoints.length === 0) return 0;
    const lowest = Math.min(
      ...timelinePoints.map((d) =>
        Math.min(
          d.balance,
          d.balanceAfterDues ?? d.balance,
          d.balanceLowAfterDues ?? d.balanceLow ?? d.balance,
          d.expectedBalance ?? d.balance,
          d.expectedBalanceAfterDues ?? d.balance
        )
      ),
      analytics.safetyBuffer || 1500,
      yesterdayBalance,
      todayRealityBalance
    );
    if (lowest < 0) {
      return Math.floor((lowest - 2000) / 5000) * 5000;
    }
    return 0;
  }, [timelinePoints, analytics.safetyBuffer, yesterdayBalance, todayRealityBalance]);

  const maxVal = useMemo(() => {
    if (timelinePoints.length === 0) return 100000;
    const highest = Math.max(
      ...timelinePoints.map((d) =>
        Math.max(
          d.balance,
          d.balanceHigh || d.balance,
          d.expectedBalance || d.balance
        )
      ),
      analytics.receivedCashInHand || 40000,
      analytics.expectedCashInHand || 40000,
      yesterdayBalance,
      todayRealityBalance
    );
    return highest + 10000;
  }, [timelinePoints, analytics.receivedCashInHand, analytics.expectedCashInHand, yesterdayBalance, todayRealityBalance]);

  const getX = (index) =>
    paddingLeft + (index / Math.max(1, timelinePoints.length - 1)) * (chartWidth - paddingLeft - paddingRight);

  const getY = (val) =>
    chartHeight -
    paddingBottom -
    ((val - minVal) / Math.max(1, maxVal - minVal)) * (chartHeight - paddingTop - paddingBottom);

  // Reference Y-axis guideline levels (handling negative and positive ticks)
  const yAxisTicks = useMemo(() => {
    if (timelinePoints.length === 0) return [];
    const count = 4;
    const step = (maxVal - minVal) / count;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const val = Math.round((minVal + step * i) / 1000) * 1000;
      ticks.push({
        val,
        label: `${val < 0 ? '-' : ''}₹${Math.abs(Math.round(val / 1000))}k`,
      });
    }
    return ticks;
  }, [minVal, maxVal, timelinePoints]);

  const zeroLineY = getY(0);

  // Reality Cash Balance line path: STRICTLY ONLY UNTIL TODAY (Yesterday -> Today)
  // Stops cleanly at Today; NEVER extends into the 60-day future (+1d .. +59d)
  const xYesterday = 26;
  const xToday = getX(0);

  const realityPath = useMemo(() => {
    if (!hasEnteredTodayGrossProfit) return '';
    const yYesterday = getY(yesterdayBalance);
    const yToday = getY(todayRealityBalance);
    return `M ${xYesterday} ${yYesterday} L ${xToday} ${yToday}`;
  }, [hasEnteredTodayGrossProfit, yesterdayBalance, todayRealityBalance, minVal, maxVal]);

  // Expected Pure Forecast line path (statistical baseline model)
  const expectedPath = useMemo(() => {
    if (timelinePoints.length === 0) return '';
    const commands = [];
    timelinePoints.forEach((p, i) => {
      const x = getX(i);
      const val = p.expectedBalance ?? p.balance;
      const valBefore = p.expectedBalanceBeforeDues ?? p.balanceBeforeDues ?? val;
      const valAfter = p.expectedBalanceAfterDues ?? p.balanceAfterDues ?? val;
      if (i === 0) {
        commands.push(`M ${x} ${getY(valBefore)}`);
      }
      if (p.hasDues) {
        const yBefore = getY(valBefore);
        const yAfter = getY(valAfter);
        const yEnd = getY(val);
        if (i !== 0) commands.push(`L ${x} ${yBefore}`);
        commands.push(`L ${x} ${yAfter}`);
        if (yEnd !== yAfter) commands.push(`L ${x} ${yEnd}`);
      } else {
        commands.push(`L ${x} ${getY(val)}`);
      }
    });
    return commands.join(' ');
  }, [timelinePoints, minVal, maxVal]);

  // Confidence Corridor (Low to High area) with step drops
  const confidenceAreaPath = useMemo(() => {
    if (timelinePoints.length === 0) return '';
    const topPoints = [];
    const bottomPoints = [];

    timelinePoints.forEach((p, i) => {
      const x = getX(i);
      if (p.hasDues) {
        const yHighBefore = getY(p.balanceHighBeforeDues ?? p.balanceHigh ?? p.balance);
        const yHighAfter = getY(p.balanceHighAfterDues ?? p.balanceHigh ?? p.balance);
        const yHighEnd = getY(p.balanceHigh ?? p.balance);

        const yLowBefore = getY(p.balanceLowBeforeDues ?? p.balanceLow ?? p.balance);
        const yLowAfter = getY(p.balanceLowAfterDues ?? p.balanceLow ?? p.balance);
        const yLowEnd = getY(p.balanceLow ?? p.balance);

        if (i !== 0) {
          topPoints.push(`${x} ${yHighBefore}`);
          bottomPoints.unshift(`${x} ${yLowBefore}`);
        }
        topPoints.push(`${x} ${yHighAfter}`);
        bottomPoints.unshift(`${x} ${yLowAfter}`);
        if (yHighEnd !== yHighAfter) {
          topPoints.push(`${x} ${yHighEnd}`);
        }
        if (yLowEnd !== yLowAfter) {
          bottomPoints.unshift(`${x} ${yLowEnd}`);
        }
      } else {
        const yHigh = getY(p.balanceHigh ?? p.balance);
        const yLow = getY(p.balanceLow ?? p.balance);
        topPoints.push(`${x} ${yHigh}`);
        bottomPoints.unshift(`${x} ${yLow}`);
      }
    });

    return `M ${topPoints[0]} L ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  }, [timelinePoints, minVal, maxVal]);

  const safetyLineY = getY(analytics.safetyBuffer);

  // Active hovered point details
  const hoveredPoint = hoveredDayIndex !== null ? timelinePoints[hoveredDayIndex] : null;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6 font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      {/* Background visual aura */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-linear-to-bl from-amber-100/40 via-yellow-50/20 to-transparent pointer-events-none rounded-bl-full"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center border border-amber-400/30 shrink-0">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
              Predictive Cash Flow & Timeline Radar
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center space-x-1 ${
                analytics.runwayStatus === 'SAFE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : analytics.runwayStatus === 'WATCH'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              <span>● Status: {analytics.runwayStatus}</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Tracks real retained cash (margin after restocking & running costs) with AI Festival & Context Multipliers against dated obligations.
          </p>
        </div>

        {/* Dynamic Horizon / Next Risk Date Card */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto p-3 sm:p-0 rounded-2xl bg-neutral-50 sm:bg-transparent border sm:border-0 border-neutral-200/80">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              {analytics.headlineLabel}
            </span>
            <div className="flex items-baseline justify-start sm:justify-end space-x-1">
              <span
                className={`text-xl sm:text-2xl font-black font-['Outfit'] ${
                  analytics.runwayStatus === 'SAFE'
                    ? 'text-black'
                    : analytics.runwayStatus === 'WATCH'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {analytics.headlineMetric}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 block">
              Buffer: ₹{analytics.safetyBuffer.toLocaleString()} (3d running cost)
            </span>
          </div>

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              analytics.runwayStatus === 'SAFE'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : analytics.runwayStatus === 'WATCH'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            {analytics.runwayStatus === 'SAFE' ? (
              <ShieldCheck className="w-6 h-6 stroke-2" />
            ) : analytics.runwayStatus === 'WATCH' ? (
              <AlertTriangle className="w-6 h-6 stroke-2" />
            ) : (
              <Flame className="w-6 h-6 stroke-2" />
            )}
          </div>
        </div>
      </div>

      {/* EXPECTED VS REALITY MODE TOGGLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-neutral-900 text-white gap-3 border border-neutral-800 relative z-10 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-neutral-800 border border-neutral-700">
            <button
              type="button"
              onClick={() => handleToggleTimelineMode('expected')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timelineMode === 'expected'
                  ? 'bg-amber-400 text-black shadow-md font-black'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              <span>🎯 Expected (Forecast)</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleTimelineMode('reality')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timelineMode === 'reality'
                  ? 'bg-emerald-400 text-black shadow-md font-black'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              <span>⚡ Reality (Until Today)</span>
            </button>
          </div>
          <div className="text-xs text-neutral-300">
            {timelineMode === 'expected' ? (
              <span>Pure statistical forecast target (₹{analytics.expectedTodaySales?.toLocaleString()}/d)</span>
            ) : hasEnteredTodayGrossProfit ? (
              <span className="text-emerald-300 font-semibold">
                Actual entered gross profit (₹{analytics.actualGrossProfit?.toLocaleString()}) calculated until today
              </span>
            ) : (
              <span className="text-amber-300 font-medium">
                Awaiting today's sales/gross profit entry in Income section
              </span>
            )}
          </div>
        </div>

        {/* Real-time Variance Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400 font-medium">Sales Variance:</span>
          <span
            className={`px-2.5 py-1 rounded-lg font-bold font-mono text-[11px] border flex items-center gap-1 ${
              (timelineMode === 'reality' && !hasEnteredTodayGrossProfit)
                ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                : analytics.salesVariance >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {timelineMode === 'reality' && !hasEnteredTodayGrossProfit ? (
              <span>Pending Entry</span>
            ) : (
              <>
                <span>{analytics.salesVariance >= 0 ? '+' : ''}₹{analytics.salesVariance.toLocaleString()}</span>
                <span className="text-[10px] opacity-80">vs Target</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Reality Mode Context Banner: Informs whether today's gross profit has been entered */}
      {timelineMode === 'reality' && (
        <div className="relative z-10">
          {!hasEnteredTodayGrossProfit ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Today's Gross Profit Pending:</strong> Reality calculates actual cash flow only until today once today's sales are logged.
                </span>
              </div>
              <a
                href="/income"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all text-center shrink-0 shadow-xs"
              >
                + Add Today's Sales
              </a>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Reality Active (Until Today):</strong> Today's Realized Gross Profit is <strong>₹{analytics.actualGrossProfit.toLocaleString()}</strong> ({analytics.grossMarginPct}% margin on ₹{analytics.actualTodaySales.toLocaleString()} sales), yielding <strong>+₹{analytics.actualRetainedCash.toLocaleString()} /day</strong> retained cash.
                </span>
              </div>
              <span className="font-mono text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold shrink-0">
                Verified Today's Actuals
              </span>
            </div>
          )}
        </div>
      )}

      {/* 4 Financial Metric Cards: RETAINED CASH, RECEIVED CASH, EXPECTED KHATA, TIMELINE DUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Metric 1: Daily Retained Cash (Adapts to Expected vs Reality) */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1 relative group">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {timelineMode === 'reality' ? 'Daily Retained Cash (Until Today)' : 'Daily Retained Cash (Expected)'}
            </span>
            <ArrowUpRight className={`w-3.5 h-3.5 ${timelineMode === 'reality' && hasEnteredTodayGrossProfit ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className={`text-xl font-black font-['Outfit'] ${timelineMode === 'reality' ? (hasEnteredTodayGrossProfit ? 'text-emerald-600' : 'text-neutral-500') : 'text-amber-600'}`}>
            {timelineMode === 'reality' && !hasEnteredTodayGrossProfit
              ? 'Pending Entry'
              : `${(timelineMode === 'reality' ? analytics.actualRetainedCash : analytics.expectedRetainedCash) >= 0 ? '+' : ''}₹${(timelineMode === 'reality' ? analytics.actualRetainedCash : analytics.expectedRetainedCash).toLocaleString()}`}
            {(timelineMode === 'expected' || hasEnteredTodayGrossProfit) && (
              <span className="text-xs font-normal text-neutral-500"> /day</span>
            )}
          </div>
          <span className="text-[10px] text-neutral-500 block truncate">
            {timelineMode === 'reality'
              ? hasEnteredTodayGrossProfit
                ? `Gross Profit: ₹${analytics.actualGrossProfit.toLocaleString()} (sales ₹${analytics.actualTodaySales.toLocaleString()})`
                : 'Enter today\'s sales to calculate gross profit'
              : `Expected sales: ₹${analytics.expectedTodaySales.toLocaleString()} · Margin: ${analytics.grossMarginPct}%`}
          </span>
          <span className="text-[9px] text-neutral-400 block">
            {timelineMode === 'reality'
              ? hasEnteredTodayGrossProfit
                ? `After ₹${analytics.dailyRunningCost}/d running costs`
                : 'Reality requires today\'s gross profit'
              : 'Target baseline projection'}
          </span>
        </div>

        {/* Metric 2: Free Cash Reserves (Requirement 2: replaces Received cash = opening + sales) */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {timelineMode === 'reality' ? 'Free Cash Reserves (Reality)' : 'Free Cash Reserves (Expected Start)'}
            </span>
            <Wallet className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="text-xl font-black text-black font-['Outfit']">
            ₹{(timelineMode === 'reality' ? (hasEnteredTodayGrossProfit ? (analytics.freeCashToday || 43495) : yesterdayBalance) : (analytics.expectedModeStart || 41100)).toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-500 block">
            {timelineMode === 'reality'
              ? hasEnteredTodayGrossProfit
                ? `Opening (₹${yesterdayBalance.toLocaleString()}) + Σ retained (+₹${(analytics.actualRetainedCash || 0).toLocaleString()})`
                : `Opening cash only (₹${yesterdayBalance.toLocaleString()})`
              : `Opening (₹${yesterdayBalance.toLocaleString()}) + expected retained (+₹${(analytics.expectedRetainedCash || 0).toLocaleString()})`}
          </span>
          <span className="text-[9px] text-neutral-500 block border-t border-neutral-200/60 pt-1 mt-1">
            <strong>Till / Bank:</strong> ₹{(analytics.tillBankTotal ?? (yesterdayBalance + (analytics.actualTodaySales || 0))).toLocaleString()} <span className="text-neutral-400 font-normal">(informational only)</span>
          </span>
        </div>

        {/* Metric 3: Expected Receivables (Khata / Credit - NEVER merged with in-hand) */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Expected Receivables
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 font-['Outfit']">
            ₹{analytics.expectedReceivables.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Customer Udhar in eKhata
          </span>
          <span className="text-[9px] text-amber-800 block font-semibold">
            Timeline weighted · Not cash in hand
          </span>
        </div>

        {/* Metric 4: Scheduled Obligations (Timeline-Based, Not Amortized) */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              15-Day Scheduled Dues
            </span>
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-['Outfit']">
            ₹{analytics.duesWithin15Days.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Rent, EMI & vendor payables
          </span>
          <span className="text-[9px] text-neutral-400 block">
            Deducted on exact dates (no double count)
          </span>
        </div>
      </div>

      {/* FESTIVAL ADJUSTER CONTROL BAR & JUDGE DEMO SELECTOR */}
      <div className="p-4 rounded-2xl bg-neutral-900 text-white border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Festival Toggle Switch */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleToggleFestival}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isFestivalAdjustmentOn ? 'bg-amber-400' : 'bg-neutral-700'
            }`}
            title="Toggle Festival & Context Sales Adjuster ON/OFF"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                isFestivalAdjustmentOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-wide uppercase font-['Outfit'] text-white">
                Festival adjustment {isFestivalAdjustmentOn ? 'ON' : 'OFF'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isFestivalAdjustmentOn
                    ? 'bg-amber-400/20 text-yellow-300 border border-yellow-400/30'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {isFestivalAdjustmentOn ? 'AI Bounded Multipliers Active' : 'Baseline 1.0 Only'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {isFestivalAdjustmentOn
                ? 'Applies calendar windows with code-bounded multipliers [0.6 - 1.6] and 1.8 overlap cap.'
                : 'Showing unadjusted baseline sales forecast exactly matching historical day-of-week.'}
            </p>
          </div>
        </div>

        {/* Right: Registered Shop Model (Auto-fetched from user signup profile) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 text-white border border-neutral-700 text-xs shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-neutral-400 text-[11px] font-medium">Shop Model:</span>
            <span className="font-bold text-amber-300 font-['Outfit'] tracking-wide">
              {registeredBusinessLabel}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-medium shadow-xs">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{profileLocation.city}</span>
          </div>
        </div>
      </div>

      {/* 60-DAY INTERACTIVE TIMELINE CHART WITH SHADED FESTIVAL BANDS & LOW-HIGH CORRIDOR */}
      <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${timelineMode === 'reality' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <h3 className="text-sm font-bold text-black font-['Outfit']">
                60-Day Cash Balance Timeline & Event Windows
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {timelineMode === 'reality'
                ? hasEnteredTodayGrossProfit
                  ? 'Reality (solid emerald) is calculated only until today from entered sales & gross profit; dashed amber line shows expected 60-day forecast.'
                  : 'Awaiting today\'s gross profit entry. Log today\'s sales in Income section to calculate reality.'
                : 'Showing pure statistical forecast baseline trajectory against dated obligations.'}
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {timelineMode === 'reality' ? (
              <>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="font-bold text-emerald-800">Reality (Until Today)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500"></span>
                  <span className="font-bold text-amber-700">Expected Forecast (+60d)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-1 bg-amber-500 rounded-full"></span>
                  <span className="font-bold text-neutral-700">Expected Forecast</span>
                </div>
                {isFestivalAdjustmentOn && (
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-2 bg-amber-200/60 border border-amber-400/50 rounded-xs"></span>
                    <span className="text-neutral-600">Low-High Range</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500"></span>
              <span className="text-neutral-700 font-semibold">Due (&ge; Buffer)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600"></span>
              <span className="text-rose-700 font-bold">Due (&lt; Buffer)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${timelineMode === 'reality' ? 'bg-sky-500 border border-sky-600' : 'bg-emerald-500 border border-emerald-600'}`}></span>
              <span className={`${timelineMode === 'reality' ? 'text-sky-700' : 'text-emerald-700'} font-semibold`}>
                {timelineMode === 'reality' ? 'Expected Khata' : 'Khata'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-rose-500"></span>
              <span className="text-rose-700 font-bold">Buffer (₹{analytics.safetyBuffer.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="relative w-full overflow-x-auto bg-white rounded-xl border border-neutral-200/80 p-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 sm:h-52 md:h-60 select-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="corridorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.08" />
              </linearGradient>
              <pattern id="bandHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.2" />
              </pattern>
            </defs>

            {/* Y-axis background horizontal grid lines & currency labels */}
            {yAxisTicks.map((tick, idx) => {
              const y = getY(tick.val);
              if (y < paddingTop || y > chartHeight - paddingBottom) return null;
              return (
                <g key={`y-grid-${idx}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#9ca3af"
                    fontFamily="monospace"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* Shaded Event Window Bands (Only for active adjusted event windows, never for 1.0) */}
            {timelinePoints.map((p, i) => {
              if (!p.activeEvents || p.activeEvents.length === 0 || !p.isAdjusted || !isFestivalAdjustmentOn) return null;
              const xStart = Math.max(paddingLeft, getX(i) - 6);
              const xEnd = Math.min(chartWidth - paddingRight, getX(i) + 6);
              return (
                <g key={`event-band-${i}`}>
                  <rect
                    x={xStart}
                    y={paddingTop}
                    width={xEnd - xStart}
                    height={chartHeight - paddingTop - paddingBottom}
                    fill="url(#bandHatch)"
                    opacity="0.85"
                  />
                  <rect
                    x={xStart}
                    y={paddingTop}
                    width={xEnd - xStart}
                    height={chartHeight - paddingTop - paddingBottom}
                    fill="#fef3c7"
                    opacity="0.35"
                  />
                </g>
              );
            })}

            {/* Safety Reserve Threshold Dashed Line & Badge (Positioned on the left to prevent curve overlap) */}
            {safetyLineY >= paddingTop && safetyLineY <= chartHeight - paddingBottom && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={safetyLineY}
                  x2={chartWidth - paddingRight}
                  y2={safetyLineY}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <rect
                  x={paddingLeft + 12}
                  y={safetyLineY - 14}
                  width="118"
                  height="14"
                  fill="#ffffff"
                  rx="3"
                  stroke="#fecdd3"
                  strokeWidth="0.5"
                />
                <text
                  x={paddingLeft + 18}
                  y={safetyLineY - 3}
                  textAnchor="start"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#e11d48"
                  fontFamily="sans-serif"
                >
                  Buffer (₹{analytics.safetyBuffer.toLocaleString()})
                </text>
              </g>
            )}

            {/* Labelled ₹0 Baseline Axis (Explicitly rendered and labelled when Y extends negative) */}
            {minVal < 0 && zeroLineY >= paddingTop && zeroLineY <= chartHeight - paddingBottom && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={zeroLineY}
                  x2={chartWidth - paddingRight}
                  y2={zeroLineY}
                  stroke="#6b7280"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <rect
                  x={chartWidth - paddingRight - 72}
                  y={zeroLineY - 14}
                  width="72"
                  height="14"
                  fill="#ffffff"
                  rx="3"
                  stroke="#9ca3af"
                  strokeWidth="0.8"
                />
                <text
                  x={chartWidth - paddingRight - 8}
                  y={zeroLineY - 3}
                  textAnchor="end"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#374151"
                  fontFamily="monospace"
                >
                  ₹0 Baseline
                </text>
              </g>
            )}

            {/* Low-High Confidence Area Light Band (Shown in Expected mode with festivals) */}
            {isFestivalAdjustmentOn && timelineMode === 'expected' && confidenceAreaPath && (
              <path d={confidenceAreaPath} fill="url(#corridorGradient)" />
            )}

            {/* In Reality mode: Render Expected Forecast (+60 Days Forward) as a Dashed Golden Line */}
            {timelineMode === 'reality' && expectedPath && (
              <path
                d={expectedPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                strokeLinecap="round"
                opacity="0.85"
              />
            )}

            {/* In Reality mode: Shaded Reality Zone background (Until Today) */}
            {timelineMode === 'reality' && hasEnteredTodayGrossProfit && (
              <g>
                <rect
                  x={xYesterday - 6}
                  y={paddingTop}
                  width={xToday - xYesterday + 12}
                  height={chartHeight - paddingTop - paddingBottom}
                  fill="#10b981"
                  opacity="0.06"
                  rx="4"
                />
                {/* Vertical Boundary Separator at Today */}
                <line
                  x1={xToday}
                  y1={paddingTop}
                  x2={xToday}
                  y2={chartHeight - paddingBottom}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
                <text
                  x={xToday}
                  y={paddingTop - 4}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="800"
                  fill="#059669"
                  fontFamily="sans-serif"
                >
                  TODAY (REALITY BOUNDARY)
                </text>
              </g>
            )}

            {/* Reality Line: ONLY UNTIL TODAY (Yesterday -> Today). NEVER penetrates into the future! */}
            {timelineMode === 'reality' && realityPath && (
              <g>
                <path
                  d={realityPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Yesterday Node */}
                <g
                  onMouseEnter={() => setHoveredHistoryDay('yesterday')}
                  onMouseLeave={() => setHoveredHistoryDay(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={xYesterday}
                    cy={getY(yesterdayBalance)}
                    r="5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
                {/* Today Reality Node (with glowing pulse ring) */}
                <g
                  onMouseEnter={() => setHoveredHistoryDay('today')}
                  onMouseLeave={() => setHoveredHistoryDay(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={xToday}
                    cy={getY(todayRealityBalance)}
                    r="12"
                    fill="#10b981"
                    opacity="0.25"
                    className="animate-pulse"
                  />
                  <circle
                    cx={xToday}
                    cy={getY(todayRealityBalance)}
                    r="6.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              </g>
            )}

            {/* In Expected mode: Solid Amber Forecast Line across all 60 days */}
            {timelineMode === 'expected' && expectedPath && (
              <path
                d={expectedPath}
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* X-axis baseline */}
            <line
              x1={paddingLeft}
              y1={chartHeight - paddingBottom}
              x2={chartWidth - paddingRight}
              y2={chartHeight - paddingBottom}
              stroke="#e5e7eb"
              strokeWidth="1.5"
            />

            {/* Yesterday tick mark when in Reality mode */}
            {timelineMode === 'reality' && (
              <g key="x-tick-yesterday">
                <line
                  x1={xYesterday}
                  y1={chartHeight - paddingBottom}
                  x2={xYesterday}
                  y2={chartHeight - paddingBottom + 5}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <text
                  x={xYesterday}
                  y={chartHeight - paddingBottom + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#059669"
                  fontFamily="sans-serif"
                >
                  Yesterday
                </text>
                <text
                  x={xYesterday}
                  y={chartHeight - paddingBottom + 27}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="500"
                  fill="#10b981"
                  fontFamily="sans-serif"
                >
                  Actual
                </text>
              </g>
            )}

            {/* X-axis Day & Date Tick Marks & Labels */}
            {[0, 15, 30, 45, 59].map((dayIdx) => {
              if (dayIdx >= timelinePoints.length) return null;
              const p = timelinePoints[dayIdx];
              const x = getX(dayIdx);
              const isToday = dayIdx === 0;
              return (
                <g key={`x-tick-${dayIdx}`}>
                  <line
                    x1={x}
                    y1={chartHeight - paddingBottom}
                    x2={x}
                    y2={chartHeight - paddingBottom + 5}
                    stroke={isToday && timelineMode === 'reality' ? '#10b981' : '#9ca3af'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={chartHeight - paddingBottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={isToday && timelineMode === 'reality' ? '#059669' : '#374151'}
                    fontFamily="sans-serif"
                  >
                    {isToday ? (timelineMode === 'reality' ? 'Today (Reality)' : 'Today') : `+${dayIdx}d`}
                  </text>
                  <text
                    x={x}
                    y={chartHeight - paddingBottom + 28}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="500"
                    fill="#9ca3af"
                    fontFamily="sans-serif"
                  >
                    {p.date}
                  </text>
                </g>
              );
            })}

            {/* Vertical Step Drop Lines on Due Dates (from Before to After Balance) */}
            {timelinePoints.map((p, i) => {
              if (!p.hasDues) return null;
              const x = getX(i);
              // In Reality mode, upcoming dates are on the Expected baseline path
              const curBefore = timelineMode === 'reality'
                ? (p.expectedBalanceBeforeDues ?? p.balanceBeforeDues)
                : (isFestivalAdjustmentOn ? p.balanceBeforeDues : (p.expectedBalanceBeforeDues ?? p.balanceBeforeDues));
              const curAfter = timelineMode === 'reality'
                ? (p.expectedBalanceAfterDues ?? p.balanceAfterDues)
                : (isFestivalAdjustmentOn ? p.balanceAfterDues : (p.expectedBalanceAfterDues ?? p.balanceAfterDues));
              const yBefore = getY(curBefore);
              const yAfter = getY(curAfter);
              const isBreach = curAfter < analytics.safetyBuffer;
              const strokeColor = isBreach ? '#ef4444' : '#eab308';
              return (
                <g key={`step-vert-${i}`}>
                  {/* Vertical drop line */}
                  <line
                    x1={x}
                    y1={yBefore}
                    x2={x}
                    y2={yAfter}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Downward triangle notch indicating deduction step */}
                  <path
                    d={`M ${x - 3.5} ${yAfter - 5} L ${x} ${yAfter} L ${x + 3.5} ${yAfter - 5}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* Interactive Data Point Handles and Colored Markers */}
            {timelinePoints.map((p, i) => {
              const cx = getX(i);
              // In Reality mode, upcoming dates follow the Expected forecast baseline
              const curBalance = timelineMode === 'reality'
                ? (p.expectedBalance ?? p.balance)
                : (isFestivalAdjustmentOn ? p.balance : (p.expectedBalance ?? p.balance));
              const curBalanceAfterDues = timelineMode === 'reality'
                ? (p.expectedBalanceAfterDues ?? p.balanceAfterDues)
                : (isFestivalAdjustmentOn ? p.balanceAfterDues : (p.expectedBalanceAfterDues ?? p.balanceAfterDues));
              // On due date, place marker at the balance AFTER deduction; else at curBalance
              const cy = p.hasDues ? getY(curBalanceAfterDues) : getY(curBalance);
              const isHovered = hoveredDayIndex === i;

              let isMarker = false;
              let markerFill = null;

              if (p.hasDues) {
                isMarker = true;
                markerFill = curBalanceAfterDues < analytics.safetyBuffer ? '#ef4444' : '#eab308';
              } else if (p.hasKhata) {
                isMarker = true;
                // In Reality mode, upcoming Khata is a future expectation (sky blue), NEVER green
                markerFill = timelineMode === 'reality' ? '#0ea5e9' : '#10b981';
              } else if (isHovered) {
                isMarker = true;
                markerFill = '#f59e0b';
              }

              return (
                <g
                  key={`point-${i}`}
                  onMouseEnter={() => setHoveredDayIndex(i)}
                  onMouseLeave={() => setHoveredDayIndex(null)}
                  onClick={() => setHoveredDayIndex(hoveredDayIndex === i ? null : i)}
                  onTouchStart={() => setHoveredDayIndex(i)}
                  className="cursor-pointer"
                >
                  {/* Invisible hit target for smooth hover and tap */}
                  <rect
                    x={cx - 10}
                    y={paddingTop}
                    width="20"
                    height={chartHeight - paddingTop - paddingBottom}
                    fill="transparent"
                  />

                  {/* Marker Circle with glow aura */}
                  {isMarker && (
                    <g>
                      {/* Aura halo for critical points */}
                      {p.hasDues && curBalanceAfterDues < analytics.safetyBuffer && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 10 : 8}
                          fill="#ef4444"
                          opacity="0.25"
                          className="animate-pulse"
                        />
                      )}
                      {p.hasDues && curBalanceAfterDues >= analytics.safetyBuffer && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 9 : 7}
                          fill="#eab308"
                          opacity="0.2"
                        />
                      )}
                      {p.hasKhata && !p.hasDues && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 8 : 6.5}
                          fill={timelineMode === 'reality' ? '#0ea5e9' : '#10b981'}
                          opacity="0.25"
                        />
                      )}

                      {/* Main marker circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : p.hasDues ? 5 : p.hasKhata ? 4.5 : 3.5}
                        fill={markerFill}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2 : 1.5}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card on Hover for History Points (Yesterday / Today) */}
          {hoveredHistoryDay && (
            <div className="mt-3 p-4 bg-neutral-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs border border-emerald-500/40 shadow-xl animate-in fade-in">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {hoveredHistoryDay === 'today' ? '⚡ Today (Reality Verified)' : '⚡ Yesterday (Historical Actual)'}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Actual Reality Zone
                  </span>
                </div>
                {hoveredHistoryDay === 'today' ? (
                  <div className="text-[11px] text-neutral-300 space-y-0.5">
                    <div>Realized Gross Profit: <strong className="text-emerald-400 font-mono">₹{analytics.actualGrossProfit.toLocaleString()}</strong> ({analytics.grossMarginPct}% margin on ₹{analytics.actualTodaySales.toLocaleString()} sales)</div>
                    <div>Today's Retained Cash: <strong className="text-emerald-400 font-mono">+{analytics.actualRetainedCash.toLocaleString()} /day</strong> (after ₹{analytics.dailyRunningCost}/d running cost)</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-300">
                    Opening liquid cash before today's trading: <strong className="text-white font-mono">₹{yesterdayBalance.toLocaleString()}</strong>
                  </div>
                )}
              </div>
              <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Verified Cash Balance
                </span>
                <span className="font-extrabold font-mono text-xl text-emerald-400">
                  ₹{(hoveredHistoryDay === 'today' ? todayRealityBalance : yesterdayBalance).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Interactive Tooltip Card on Hover */}
          {hoveredPoint && (
            <div className="mt-3 p-4 bg-neutral-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs border border-neutral-700 shadow-xl animate-in fade-in">
              <div className="space-y-2 flex-1">
                {/* Header Tag Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    Day +{hoveredPoint.day} ({hoveredPoint.date})
                  </span>

                  {hoveredPoint.hasDues && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        (timelineMode === 'reality' ? hoveredPoint.balanceAfterDues : hoveredPoint.expectedBalanceAfterDues) < analytics.safetyBuffer
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      }`}
                    >
                      <span>●</span>
                      <span>
                        {(timelineMode === 'reality' ? hoveredPoint.balanceAfterDues : hoveredPoint.expectedBalanceAfterDues) < analytics.safetyBuffer
                          ? 'Buffer Breach'
                          : 'Buffer Safe'}
                      </span>
                    </span>
                  )}

                  {hoveredPoint.hasKhata && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      📥 Expected Khata Receipt
                    </span>
                  )}

                  {hoveredPoint.activeEvents?.length > 0 && isFestivalAdjustmentOn && (
                    <span className="bg-amber-400/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full text-[10px] border border-yellow-400/30">
                      {hoveredPoint.activeEvents[0]}
                    </span>
                  )}
                </div>

                {/* Dues Breakdown: Merged list, total, and balance step */}
                {hoveredPoint.hasDues && (
                  <div className="p-3 rounded-xl bg-neutral-800/90 border border-neutral-700/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                      <span>
                        {hoveredPoint.dayDues.length > 1
                          ? `Scheduled Dues (${hoveredPoint.dayDues.length} items merged):`
                          : 'Scheduled Due:'}
                      </span>
                      <span className="font-mono text-rose-400 font-extrabold text-xs">
                        Total: ₹{hoveredPoint.dayDuesTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-0.5 pl-1 text-[11px] text-neutral-300">
                      {hoveredPoint.dayDues.map((due, idx) => (
                        <div key={`due-tip-${idx}`} className="flex items-center justify-between font-mono">
                          <span className="truncate mr-2">• {due.title}</span>
                          <span className="text-neutral-400 shrink-0">₹{due.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 mt-1 border-t border-neutral-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-neutral-400">
                        {timelineMode === 'reality' ? 'Forecast Step: ' : 'Expected Step: '}
                        <strong className="font-mono text-white">
                          ₹{(hoveredPoint.expectedBalanceBeforeDues ?? hoveredPoint.balanceBeforeDues).toLocaleString()}
                        </strong> &rarr; <strong className={`font-mono ${(hoveredPoint.expectedBalanceAfterDues ?? hoveredPoint.balanceAfterDues) < analytics.safetyBuffer ? 'text-rose-400' : 'text-yellow-300'}`}>
                          ₹{(hoveredPoint.expectedBalanceAfterDues ?? hoveredPoint.balanceAfterDues).toLocaleString()}
                        </strong>
                      </span>

                      {(hoveredPoint.expectedBalanceAfterDues ?? hoveredPoint.balanceAfterDues) < analytics.safetyBuffer ? (
                        <span className="bg-rose-500/30 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded font-black font-mono">
                          Arrange ₹{(analytics.safetyBuffer - (hoveredPoint.expectedBalanceAfterDues ?? hoveredPoint.balanceAfterDues)).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-yellow-400/90 font-medium">
                          Cushion: +₹{((hoveredPoint.expectedBalanceAfterDues ?? hoveredPoint.balanceAfterDues) - analytics.safetyBuffer).toLocaleString()} above buffer
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Khata expected collection if present */}
                {hoveredPoint.hasKhata && (
                  <div className={`text-[11px] ${timelineMode === 'reality' ? 'text-sky-400' : 'text-emerald-400'} flex items-center gap-1 font-mono`}>
                    <span>Expected Khata Collection:</span>
                    <strong>+₹{hoveredPoint.dayRecv.toLocaleString()}</strong>
                  </div>
                )}

                {/* Retained cash note */}
                <div className="text-[11px] text-neutral-400 font-sans">
                  Day Retained Cash: <strong className="text-amber-300 font-mono">{(timelineMode === 'reality' ? hoveredPoint.expectedRetainedCash : hoveredPoint.retainedBase) >= 0 ? '+' : ''}₹{(timelineMode === 'reality' ? hoveredPoint.expectedRetainedCash : hoveredPoint.retainedBase).toLocaleString()}</strong> (forecast sales ₹{(timelineMode === 'reality' ? hoveredPoint.expectedSales : hoveredPoint.adjSalesBase).toLocaleString()})
                </div>
              </div>

              {/* Right Column: Comparison of Reality vs Expected */}
              <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800 space-y-1.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    {timelineMode === 'reality' ? '🎯 Forecast Balance' : '🎯 Expected Balance'}
                  </span>
                  <span className="font-extrabold font-mono text-xl text-amber-400">
                    ₹{(hoveredPoint.expectedBalance ?? hoveredPoint.balance).toLocaleString()}
                  </span>
                </div>
                {timelineMode === 'reality' && (
                  <p className="text-[10px] text-neutral-400 italic font-sans max-w-44">
                    Upcoming date outside reality zone (projected statistical baseline).
                  </p>
                )}
                <div className="pt-1.5 border-t border-neutral-800 text-[11px] text-neutral-300 font-mono space-y-1">
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <span className="text-neutral-400">{timelineMode === 'reality' ? 'Expected Ref:' : 'Reality Ref:'}</span>
                    <strong className="text-neutral-200">₹{(timelineMode === 'reality' ? hoveredPoint.expectedBalance : hoveredPoint.balance).toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <span className="text-neutral-400">Variance:</span>
                    <strong className={hoveredPoint.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {hoveredPoint.variance >= 0 ? '+' : ''}₹{hoveredPoint.variance.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* "WHY THIS FORECAST?" CARD LISTING UPCOMING EVENTS, MULTIPLIERS, BADGES, AND REASONS */}
      <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-200/60 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-800 flex items-center justify-center border border-amber-400/40">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black font-['Outfit']">
                Why this forecast?
              </h3>
              <p className="text-[11px] text-neutral-500">
                AI Sales Context Analyst bounded adjustments for{' '}
                <strong className="text-black font-bold">
                  {registeredBusinessLabel}
                </strong>{' '}
                in {profileLocation.city}. Code enforces all rupee math.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {adjusterUnavailable && (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200">
                Context adjustment unavailable (Fallback 1.0)
              </span>
            )}
            <span className="text-[11px] text-neutral-500 font-medium">
              Next 90 Days Events: {contextAdjustments.length}
            </span>
          </div>
        </div>

        {/* Event Adjustments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contextAdjustments.slice(0, 8).map((adj, idx) => {
            const mult = adj.multiplier || { low: 1.0, base: 1.0, high: 1.0 };
            const isBoost = mult.base > 1.05;
            const isSlump = mult.base < 0.95;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5 hover:border-amber-400 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-black block leading-tight">
                      {adj.event}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                      {adj.window_start} &rarr; {adj.window_end}
                    </span>
                  </div>

                  {/* Multiplier pill */}
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black font-mono border ${
                        isBoost
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isSlump
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      &times;{Number(mult.base).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-neutral-400 block font-mono">
                      [{Number(mult.low).toFixed(2)} - {Number(mult.high).toFixed(2)}]
                    </span>
                  </div>
                </div>

                {/* Plain sentence reason */}
                <p className="text-[11px] text-neutral-600 leading-relaxed italic">
                  "{adj.reason}"
                </p>

                {/* Confidence Badge */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[10px]">
                  <span className="text-neutral-400">AI Confidence:</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                      adj.confidence === 'high'
                        ? 'bg-emerald-100 text-emerald-800'
                        : adj.confidence === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {adj.confidence || 'medium'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisory & Onboarding Parameters Bar */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50/70 via-yellow-50/40 to-neutral-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 block">{analytics.advisoryTitle}</span>
            <p className="text-[11px] text-amber-900/80 leading-relaxed mt-0.5">
              {analytics.advisoryText}
            </p>
          </div>
        </div>

        {/* Onboarding / Parameters Trigger Button */}
        <div className="shrink-0 flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200/60">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white text-neutral-700 hover:text-black border border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Cash Flow Assumptions</span>
          </button>
        </div>
      </div>

      {/* Onboarding Parameters Drawer / Modal (Responsive Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4 animate-in fade-in duration-200">
          <div className="w-full md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl border border-neutral-300 p-5 sm:p-7 space-y-5 shadow-2xl max-h-[90dvh] overflow-y-auto">
            {/* Mobile drag handle */}
            <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto md:hidden"></div>

            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black font-['Outfit']">
                  Cash Flow Assumptions & Operating Parameters
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Calibrate profit margins and non-rent daily operating costs for accurate retained cash math.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="min-h-11 min-w-11 rounded-xl text-neutral-400 hover:text-black flex items-center justify-center cursor-pointer p-1"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Accounting Rule Callout (Requirement 9) */}
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-bold text-black block mb-0.5">SMB Working Capital Accounting Rule:</strong>
                A cost may belong to <strong>running_cost</strong> (e.g. daily helper wages, electricity, packaging) OR <strong>fixed expenses</strong> (e.g. monthly store rent, loan EMI), <em>not both</em>. Do not double count!
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Input 1: Gross Margin % */}
                <div className="space-y-1.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80">
                  <label className="font-bold text-neutral-800 text-xs sm:text-sm block">
                    Gross Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={settingsForm.grossMarginPct}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, grossMarginPct: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-black font-bold text-base sm:text-xs focus:ring-2 focus:ring-yellow-400 min-h-11"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetMargin(20)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white border border-neutral-200 hover:border-black min-h-9 flex items-center"
                    >
                      Kirana (20%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetMargin(35)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white border border-neutral-200 hover:border-black min-h-9 flex items-center"
                    >
                      Sweets (35%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetMargin(25)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white border border-neutral-200 hover:border-black min-h-9 flex items-center"
                    >
                      Standard (25%)
                    </button>
                  </div>
                </div>

                {/* Input 2: Daily Running Cost */}
                <div className="space-y-1.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80">
                  <label className="font-bold text-neutral-800 text-xs sm:text-sm block">
                    Daily Running Costs (₹/day)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.dailyRunningCost}
                    onChange={(e) => {
                      const cost = Number(e.target.value);
                      setSettingsForm({
                        ...settingsForm,
                        dailyRunningCost: cost,
                        safetyBuffer: cost * 3,
                      });
                    }}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-black font-bold text-base sm:text-xs focus:ring-2 focus:ring-yellow-400 min-h-11"
                  />
                  <span className="text-[11px] text-neutral-500 block">
                    Daily helper, tea, electricity (non-rent operating costs)
                  </span>
                </div>

                {/* Input 3: Opening Cash */}
                <div className="space-y-1.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80">
                  <label className="font-bold text-neutral-800 text-xs sm:text-sm block">
                    Opening Cash in Hand (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.openingCash}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, openingCash: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-black font-bold text-base sm:text-xs focus:ring-2 focus:ring-yellow-400 min-h-11"
                  />
                  <span className="text-[11px] text-neutral-500 block">
                    Cash in till + primary bank current balance
                  </span>
                </div>

                {/* Input 4: Opening Date (Requirement 2: Store opening_date) */}
                <div className="space-y-1.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80">
                  <label className="font-bold text-neutral-800 text-xs sm:text-sm block">
                    Opening Date
                  </label>
                  <input
                    type="date"
                    value={settingsForm.openingDate || '2026-10-01'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, openingDate: e.target.value })
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-black font-bold text-base sm:text-xs focus:ring-2 focus:ring-yellow-400 min-h-11"
                  />
                  <span className="text-[11px] text-neutral-500 block">
                    Date from which free cash reserves are accumulated
                  </span>
                </div>

                {/* Input 5: Owner Target Daily Sales (Requirement 4 fallback) */}
                <div className="space-y-1.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80">
                  <label className="font-bold text-neutral-800 text-xs sm:text-sm block">
                    Owner Target Daily Sales (₹/day)
                  </label>
                  <input
                    type="number"
                    min="500"
                    value={settingsForm.ownerTargetDailySales || 8000}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, ownerTargetDailySales: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-black font-bold text-base sm:text-xs focus:ring-2 focus:ring-yellow-400 min-h-11"
                  />
                  <span className="text-[11px] text-neutral-500 block">
                    Fallback statistical baseline when &lt; 3 complete days recorded
                  </span>
                </div>

                {/* Input 6: Safety Buffer */}
                <div className="space-y-1.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80">
                  <label className="font-bold text-neutral-800 text-xs sm:text-sm block">
                    Safety Buffer (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.safetyBuffer}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, safetyBuffer: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2.5 text-black font-bold text-base sm:text-xs focus:ring-2 focus:ring-yellow-400 min-h-11"
                  />
                  <span className="text-[11px] text-neutral-500 block">
                    Defaults to 3 days of running costs (₹{(Number(settingsForm.dailyRunningCost || 500) * 3).toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Save & Cancel Buttons (Full width on phones, inline on desktop) */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-black border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-11 px-5 py-2 rounded-xl text-xs font-black bg-black text-yellow-300 hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center cursor-pointer"
                >
                  Save & Recompute Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
