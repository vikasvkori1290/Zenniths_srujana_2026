import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Sliders,
  DollarSign,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Percent,
  Split,
  PlusCircle,
  HelpCircle,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deduplicateEKhataCustomers } from '../services/expenseSync';
import { toLocalDateString } from '../services/predictiveAnalytics';
import {
  simulateScenarioTimeline,
  compareMitigationResponses,
} from '../services/scenarioSimulator';

export default function ScenarioSimulatorPage() {
  const { user } = useAuth();

  // 1. Load Stored Financial Data
  const [fixedExpenses, setFixedExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('aurum_fixed_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [upcomingExpenses, setUpcomingExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('aurum_upcoming_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [eKhataCustomers, setEKhataCustomers] = useState(() => {
    try {
      const saved =
        localStorage.getItem('aurum_ekhata_data') ||
        localStorage.getItem('aurum_ekhata_customers');
      return saved ? deduplicateEKhataCustomers(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [cashflowSettings, setCashflowSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('aurum_cashflow_settings');
      return saved
        ? JSON.parse(saved)
        : {
            openingCash: 40000,
            grossMarginPct: 25,
            dailyRunningCost: 500,
            safetyBuffer: 1500,
            ownerTargetDailySales: 10000,
          };
    } catch {
      return {
        openingCash: 40000,
        grossMarginPct: 25,
        dailyRunningCost: 500,
        safetyBuffer: 1500,
        ownerTargetDailySales: 10000,
      };
    }
  });

  const [salesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('aurum_all_income_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate default date for unexpected expense (5 days from today)
  const defaultExpenseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return toLocalDateString(d);
  }, []);

  // 2. Scenario Simulator Controls State
  const [khataDelayDays, setKhataDelayDays] = useState(0);
  const [unexpectedExpenseAmount, setUnexpectedExpenseAmount] = useState(0);
  const [unexpectedExpenseDate, setUnexpectedExpenseDate] = useState(defaultExpenseDate);
  const [unexpectedExpenseTitle, setUnexpectedExpenseTitle] = useState('Equipment Repair');
  const [salesDropPct, setSalesDropPct] = useState(0);

  // Payable shift / split controls
  const [selectedDueId, setSelectedDueId] = useState('');
  const [dueActionType, setDueActionType] = useState('none'); // 'none' | 'shift' | 'split'
  const [shiftDays, setShiftDays] = useState(15);
  const [splitInstalments, setSplitInstalments] = useState(2);

  // Response comparator settings
  const [loanInterestRate, setLoanInterestRate] = useState(12); // % per annum
  const [activePreviewResponseId, setActivePreviewResponseId] = useState(null);

  // Chart hover state
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Available dues that can be shifted or split
  const selectableDues = useMemo(() => {
    const list = [];
    (upcomingExpenses || []).forEach((u) => {
      list.push({
        id: u.id ?? u._id,
        title: u.title || 'Payable',
        amount: Number(u.amount || 0),
        dueDate: u.dueDate || 'Near Term',
        type: 'Payable',
      });
    });
    (fixedExpenses || []).forEach((f) => {
      list.push({
        id: f.id ?? f._id,
        title: f.title || 'Fixed Commitment',
        amount: Number(f.amount || 0),
        dueDate: `Day ${f.dueDay || 1} of month`,
        type: 'Fixed Due',
      });
    });
    return list;
  }, [upcomingExpenses, fixedExpenses]);

  // Base parameters for the simulation engine
  const baseParams = useMemo(() => {
    return {
      openingReceivedCash: Number(cashflowSettings.openingCash || 40000),
      todayReceivedSales: Number(cashflowSettings.ownerTargetDailySales || 10000),
      grossMarginPct: Number(cashflowSettings.grossMarginPct || 25),
      dailyRunningCost: Number(cashflowSettings.dailyRunningCost || 500),
      safetyBuffer: Number(cashflowSettings.safetyBuffer || 1500),
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      eKhataCustomersList: eKhataCustomers,
      horizonDays: 60,
      startDate: new Date(),
      ownerTargetDailySales: Number(cashflowSettings.ownerTargetDailySales || 10000),
      salesHistory,
      isFestivalAdjustmentOn: true,
    };
  }, [cashflowSettings, fixedExpenses, upcomingExpenses, eKhataCustomers, salesHistory]);

  // Current simulation controls object
  const currentControls = useMemo(() => {
    return {
      khataDelayDays: Number(khataDelayDays || 0),
      unexpectedExpense: {
        amount: Number(unexpectedExpenseAmount || 0),
        date: unexpectedExpenseDate,
        title: unexpectedExpenseTitle,
      },
      salesDropPct: Number(salesDropPct || 0),
      dueModification: {
        dueId: selectedDueId,
        action: dueActionType,
        shiftDays: Number(shiftDays || 15),
        splitCount: Number(splitInstalments || 2),
      },
    };
  }, [
    khataDelayDays,
    unexpectedExpenseAmount,
    unexpectedExpenseDate,
    unexpectedExpenseTitle,
    salesDropPct,
    selectedDueId,
    dueActionType,
    shiftDays,
    splitInstalments,
  ]);

  // Run simulation
  const simulation = useMemo(() => {
    return simulateScenarioTimeline(baseParams, currentControls);
  }, [baseParams, currentControls]);

  // Calculate mitigation responses when in RISK or WATCH
  const mitigationResponses = useMemo(() => {
    if (simulation.status !== 'RISK' && simulation.gap <= 0) return [];
    return compareMitigationResponses({
      baseParams,
      controls: currentControls,
      scenarioResult: simulation.scenarioResult,
      gap: simulation.gap,
      interestRatePct: loanInterestRate,
    });
  }, [baseParams, currentControls, simulation, loanInterestRate]);

  // Active previewed response timeline (if user clicked "Preview on Chart")
  const activePreviewResponse = useMemo(() => {
    if (!activePreviewResponseId) return null;
    return mitigationResponses.find((r) => r.id === activePreviewResponseId) || null;
  }, [activePreviewResponseId, mitigationResponses]);

  // Reset all controls to base inputs
  const handleReset = () => {
    setKhataDelayDays(0);
    setUnexpectedExpenseAmount(0);
    setUnexpectedExpenseDate(defaultExpenseDate);
    setSalesDropPct(0);
    setSelectedDueId('');
    setDueActionType('none');
    setActivePreviewResponseId(null);
  };

  // SVG Chart Geometry
  const chartWidth = 900;
  const chartHeight = 280;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const timelinePoints = simulation.scenarioResult.timeline || [];
  const baseTimelinePoints = simulation.baseResult.timeline || [];

  const { minVal, maxVal } = useMemo(() => {
    let min = 0;
    let max = 10000;
    baseTimelinePoints.forEach((p) => {
      const b = p.expectedBalance ?? p.balance;
      if (b < min) min = b;
      if (b > max) max = b;
    });
    timelinePoints.forEach((p) => {
      const b = p.expectedBalance ?? p.balance;
      const bAfter = p.expectedBalanceAfterDues ?? p.balanceAfterDues;
      if (b < min) min = b;
      if (bAfter < min) min = bAfter;
      if (b > max) max = b;
    });
    if (activePreviewResponse?.scenarioResult?.timeline) {
      activePreviewResponse.scenarioResult.timeline.forEach((p) => {
        const b = p.expectedBalance ?? p.balance;
        if (b < min) min = b;
        if (b > max) max = b;
      });
    }
    const padding = (max - min) * 0.12 || 5000;
    return {
      minVal: Math.min(-2000, Math.floor((min - padding) / 5000) * 5000),
      maxVal: Math.max(25000, Math.ceil((max + padding) / 5000) * 5000),
    };
  }, [baseTimelinePoints, timelinePoints, activePreviewResponse]);

  const getX = (index) => {
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const count = Math.max(1, timelinePoints.length - 1);
    return paddingLeft + (index / count) * usableWidth;
  };

  const getY = (val) => {
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    const range = maxVal - minVal || 1;
    const normalized = (val - minVal) / range;
    return chartHeight - paddingBottom - normalized * usableHeight;
  };

  // Build SVG Path Strings
  const basePath = useMemo(() => {
    if (baseTimelinePoints.length === 0) return '';
    return baseTimelinePoints
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(p.expectedBalance ?? p.balance);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [baseTimelinePoints, minVal, maxVal]);

  const scenarioPath = useMemo(() => {
    if (timelinePoints.length === 0) return '';
    return timelinePoints
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(p.expectedBalance ?? p.balance);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [timelinePoints, minVal, maxVal]);

  const previewPath = useMemo(() => {
    if (!activePreviewResponse?.scenarioResult?.timeline) return '';
    return activePreviewResponse.scenarioResult.timeline
      .map((p, idx) => {
        const x = getX(idx);
        const y = getY(p.expectedBalance ?? p.balance);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activePreviewResponse, minVal, maxVal]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = Math.max(5000, Math.round((maxVal - minVal) / 5 / 5000) * 5000);
    for (let v = minVal; v <= maxVal; v += step) {
      ticks.push({ val: v, label: `₹${(v / 1000).toFixed(0)}k` });
    }
    return ticks;
  }, [minVal, maxVal]);

  const safetyLineY = getY(simulation.safetyBuffer);
  const zeroLineY = getY(0);

  const hoveredPoint =
    hoveredPointIndex !== null && timelinePoints[hoveredPointIndex]
      ? timelinePoints[hoveredPointIndex]
      : null;
  const hoveredBasePoint =
    hoveredPointIndex !== null && baseTimelinePoints[hoveredPointIndex]
      ? baseTimelinePoints[hoveredPointIndex]
      : null;

  return (
    <div className="w-full bg-white text-neutral-900 pb-20 font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Top Header & Page Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black shadow-md border border-amber-300">
                <Sliders className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-black font-['Outfit'] tracking-tight">
                  Cash Runway Scenario Simulator
                </h1>
                <p className="text-xs text-neutral-500">
                  Stress-test your business against shocks, delay chains, and sales dips without changing actual records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Base</span>
            </button>
          </div>
        </div>

        {/* 1. SCENARIO OUTPUT SUMMARY CARDS (Requirement 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Badge Card */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              simulation.status === 'RISK'
                ? 'bg-rose-50/80 border-rose-300 shadow-rose-100/50 shadow-md'
                : simulation.status === 'WATCH'
                ? 'bg-amber-50/80 border-amber-300 shadow-amber-100/50 shadow-md'
                : 'bg-emerald-50/80 border-emerald-300 shadow-emerald-100/50 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                Scenario Health
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide border flex items-center space-x-1 ${
                  simulation.status === 'RISK'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : simulation.status === 'WATCH'
                    ? 'bg-amber-500 text-black border-amber-600'
                    : 'bg-emerald-600 text-white border-emerald-700'
                }`}
              >
                <span>
                  {simulation.status === 'RISK'
                    ? '● RISK'
                    : simulation.status === 'WATCH'
                    ? '▲ WATCH'
                    : '✓ SAFE'}
                </span>
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-['Outfit']">
                {simulation.status === 'RISK' ? (
                  <span className="text-rose-700">Cash Deficit Detected</span>
                ) : simulation.status === 'WATCH' ? (
                  <span className="text-amber-800">Buffer Cushion Dip</span>
                ) : (
                  <span className="text-emerald-700">100% Runway Safe</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-600 mt-1">
                {simulation.status === 'RISK'
                  ? 'Balance dips into negative liquidity during the 60-day horizon.'
                  : simulation.status === 'WATCH'
                  ? `Balance touches below your safety reserve of ₹${simulation.safetyBuffer.toLocaleString()}.`
                  : 'Cash reserves remain resiliently above your safety buffer throughout.'}
              </p>
            </div>
          </div>

          {/* First Date Balance < Buffer */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              First Date Balance &lt; Buffer
            </span>
            <div className="mt-3 font-mono font-bold text-lg text-black">
              {simulation.firstShortageDate}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {simulation.firstShortagePoint
                ? `Breach occurs on Day +${simulation.firstShortagePoint.day} with balance at ₹${simulation.firstShortagePoint.balance.toLocaleString()}.`
                : 'No buffer breaches detected over 60 days.'}
            </p>
          </div>

          {/* Minimum Projected Balance & Date */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Lowest Point & Date
            </span>
            <div className="mt-3">
              <span
                className={`text-2xl font-black font-mono ${
                  simulation.minBalance < 0
                    ? 'text-rose-600'
                    : simulation.minBalance < simulation.safetyBuffer
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                ₹{simulation.minBalance.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Occurs on {simulation.minBalanceDate} (Day +{simulation.minBalanceDay}).
            </p>
          </div>

          {/* Liquidity Gap (Buffer - Min Balance) */}
          <div
            className={`p-5 rounded-2xl border ${
              simulation.gap > 0
                ? 'bg-rose-50/50 border-rose-300'
                : 'bg-emerald-50/50 border-emerald-200'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 block">
              Liquidity Shortage Gap
            </span>
            <div className="mt-3">
              <span
                className={`text-2xl font-black font-mono ${
                  simulation.gap > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {simulation.gap > 0 ? `₹${simulation.gap.toLocaleString()}` : '₹0 (Safe)'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {simulation.gap > 0
                ? `Funds needed to maintain your ₹${simulation.safetyBuffer.toLocaleString()} buffer.`
                : 'Zero funding gap; full liquidity cushion maintained.'}
            </p>
          </div>
        </div>

        {/* 2. DUAL-LINE TIMELINE VISUALIZATION (Requirement 2) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-neutral-50/90 border border-neutral-200 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h2 className="text-base font-bold text-black font-['Outfit']">
                  60-Day Cash Trajectory: Baseline vs. Simulated Scenario
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Evaluated strictly through the core timeline function. Dual lines show immediate divergence.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-1 bg-amber-500 rounded-full"></span>
                <span className="font-semibold text-neutral-700">Baseline Forecast</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-1.5 bg-indigo-600 rounded-full"></span>
                <span className="font-bold text-indigo-700">Simulated Scenario</span>
              </div>
              {activePreviewResponse && (
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="font-bold text-emerald-700">Mitigated Curve</span>
                </div>
              )}
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-rose-500"></span>
                <span className="text-rose-700 font-bold">
                  Buffer (₹{simulation.safetyBuffer.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-x-auto bg-white rounded-2xl border border-neutral-200/90 p-3 shadow-inner">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 sm:h-64 select-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="simGapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {yTicks.map((tick, idx) => {
                const y = getY(tick.val);
                if (y < paddingTop || y > chartHeight - paddingBottom) return null;
                return (
                  <g key={`y-${idx}`}>
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

              {/* Safety Buffer Horizontal Line */}
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
                  <text
                    x={chartWidth - paddingRight - 8}
                    y={safetyLineY - 4}
                    textAnchor="end"
                    fontSize="9.5"
                    fontWeight="bold"
                    fill="#e11d48"
                  >
                    Buffer (₹{simulation.safetyBuffer.toLocaleString()})
                  </text>
                </g>
              )}

              {/* Zero Baseline */}
              {minVal < 0 && zeroLineY >= paddingTop && zeroLineY <= chartHeight - paddingBottom && (
                <line
                  x1={paddingLeft}
                  y1={zeroLineY}
                  x2={chartWidth - paddingRight}
                  y2={zeroLineY}
                  stroke="#6b7280"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Baseline Path (Solid Amber Line) */}
              {basePath && (
                <path
                  d={basePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeDasharray="4 3"
                  opacity="0.8"
                />
              )}

              {/* Preview Mitigated Response Path (If toggled) */}
              {previewPath && (
                <path
                  d={previewPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Scenario Path (Solid Indigo/Rose Line) */}
              {scenarioPath && (
                <path
                  d={scenarioPath}
                  fill="none"
                  stroke={simulation.status === 'RISK' ? '#ef4444' : '#4f46e5'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* X-axis ticks */}
              {[0, 15, 30, 45, 59].map((idx) => {
                const p = timelinePoints[idx];
                if (!p) return null;
                const x = getX(idx);
                return (
                  <g key={`x-tick-${idx}`}>
                    <line
                      x1={x}
                      y1={chartHeight - paddingBottom}
                      x2={x}
                      y2={chartHeight - paddingBottom + 5}
                      stroke="#9ca3af"
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={chartHeight - paddingBottom + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#4b5563"
                    >
                      {idx === 0 ? 'Today' : `+${idx}d`}
                    </text>
                    <text
                      x={x}
                      y={chartHeight - paddingBottom + 27}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#9ca3af"
                    >
                      {p.date}
                    </text>
                  </g>
                );
              })}

              {/* Interactive Hover Nodes */}
              {timelinePoints.map((p, idx) => {
                const x = getX(idx);
                const y = getY(p.expectedBalance ?? p.balance);
                const isHovered = hoveredPointIndex === idx;

                return (
                  <g
                    key={`hit-${idx}`}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - 8}
                      y={paddingTop}
                      width="16"
                      height={chartHeight - paddingTop - paddingBottom}
                      fill="transparent"
                    />
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="5.5"
                        fill="#4f46e5"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredPoint && (
              <div className="mt-3 p-3.5 bg-neutral-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-neutral-700 animate-fadeIn">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-400 font-mono">
                      Day +{hoveredPoint.day} ({hoveredPoint.date})
                    </span>
                    {hoveredPoint.hasDues && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Scheduled Dues: ₹{hoveredPoint.dayDuesTotal?.toLocaleString()}
                      </span>
                    )}
                    {hoveredPoint.hasKhata && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Khata Receipt: ₹{hoveredPoint.dayRecv?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-300 flex items-center space-x-4">
                    <span>
                      Baseline: <strong className="font-mono text-white">₹{hoveredBasePoint ? (hoveredBasePoint.expectedBalance ?? hoveredBasePoint.balance).toLocaleString() : '0'}</strong>
                    </span>
                    <span>
                      Scenario: <strong className="font-mono text-indigo-400 font-bold">₹{(hoveredPoint.expectedBalance ?? hoveredPoint.balance).toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Scenario Impact
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      (hoveredPoint.expectedBalance ?? hoveredPoint.balance) -
                        (hoveredBasePoint ? (hoveredBasePoint.expectedBalance ?? hoveredBasePoint.balance) : 0) <
                      0
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {((hoveredPoint.expectedBalance ?? hoveredPoint.balance) -
                      (hoveredBasePoint ? (hoveredBasePoint.expectedBalance ?? hoveredBasePoint.balance) : 0) >=
                    0
                      ? '+'
                      : '')}
                    ₹
                    {(
                      (hoveredPoint.expectedBalance ?? hoveredPoint.balance) -
                      (hoveredBasePoint ? (hoveredBasePoint.expectedBalance ?? hoveredBasePoint.balance) : 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. SCENARIO SIMULATION CONTROLS (Requirement 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Group A: Customer Credit Delay & Sales Drop */}
          <div className="p-5 sm:p-6 rounded-3xl bg-neutral-50/80 border border-neutral-200 space-y-6">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Inflow & Revenue Shock Controls</span>
            </h3>

            {/* (a) Khata Payments Delayed by N Days (0-30) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-neutral-800 flex items-center space-x-1.5">
                  <span>Customer Khata Delay:</span>
                  <span className="font-mono font-black text-amber-600 text-sm">
                    +{khataDelayDays} Days
                  </span>
                </label>
                <span className="text-neutral-500 text-[11px]">Range: 0 - 30 days</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={khataDelayDays}
                onChange={(e) => setKhataDelayDays(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-200 rounded-lg"
              />
              <div className="flex items-center space-x-2 pt-1">
                {[0, 7, 10, 15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setKhataDelayDays(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      khataDelayDays === d
                        ? 'bg-amber-400 text-black border-amber-500'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {d === 0 ? 'Normal (0d)' : `+${d}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* (c) Sales Drop % (0 - 50%) */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-neutral-800 flex items-center space-x-1.5">
                  <span>Daily Sales Drop Shock:</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    -{salesDropPct}%
                  </span>
                </label>
                <span className="text-neutral-500 text-[11px]">Range: 0 - 50%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={salesDropPct}
                onChange={(e) => setSalesDropPct(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-neutral-200 rounded-lg"
              />
              <div className="flex items-center space-x-2 pt-1">
                {[0, 15, 25, 35, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSalesDropPct(pct)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      salesDropPct === pct
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {pct === 0 ? 'Baseline (0%)' : `-${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Control Group B: Unexpected Expense & Due Modification */}
          <div className="p-5 sm:p-6 rounded-3xl bg-neutral-50/80 border border-neutral-200 space-y-6">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Liability & Expense Shocks</span>
            </h3>

            {/* (b) One-off Unexpected Expense (Amount, Date) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-neutral-800">
                  One-Off Unexpected Expense:
                </label>
                {unexpectedExpenseAmount > 0 && (
                  <button
                    onClick={() => setUnexpectedExpenseAmount(0)}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Expense
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={unexpectedExpenseAmount === 0 ? '' : unexpectedExpenseAmount}
                      placeholder="0"
                      onChange={(e) => setUnexpectedExpenseAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-bold font-mono focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={unexpectedExpenseDate}
                    onChange={(e) => setUnexpectedExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-mono focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Expense Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { title: 'Emergency Repair', amt: 10000 },
                  { title: 'Bulk Stock Buy', amt: 30000 },
                  { title: 'Tax Assessment', amt: 25000 },
                ].map((preset) => (
                  <button
                    key={preset.title}
                    onClick={() => {
                      setUnexpectedExpenseAmount(preset.amt);
                      setUnexpectedExpenseTitle(preset.title);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 cursor-pointer shadow-2xs"
                  >
                    + {preset.title} (₹{(preset.amt / 1000).toFixed(0)}k)
                  </button>
                ))}
              </div>
            </div>

            {/* (d) Shift or Split a Payable/Fixed Due */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <label className="font-bold text-neutral-800 text-xs block">
                Shift or Split a Scheduled Due / Commitment:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Select Target Due
                  </label>
                  <select
                    value={selectedDueId}
                    onChange={(e) => setSelectedDueId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="">-- Choose Commitment / Payable --</option>
                    {selectableDues.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} (₹{d.amount.toLocaleString()} • {d.dueDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Modification Action
                  </label>
                  <select
                    value={dueActionType}
                    onChange={(e) => setDueActionType(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="none">No Change</option>
                    <option value="shift">Shift Due Date</option>
                    <option value="split">Split into Instalments</option>
                  </select>
                </div>
              </div>

              {dueActionType === 'shift' && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800">Shift Forward By:</span>
                    <span className="font-mono font-bold text-amber-700">+{shiftDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={shiftDays}
                    onChange={(e) => setShiftDays(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5"
                  />
                </div>
              )}

              {dueActionType === 'split' && (
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs">
                  <span className="font-bold text-neutral-800 block">Number of Instalments:</span>
                  <div className="flex items-center space-x-3">
                    {[2, 3].map((count) => (
                      <button
                        key={count}
                        onClick={() => setSplitInstalments(count)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                          splitInstalments === count
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {count} Equal Instalments (Spaced 15 Days)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. "COMPARE RESPONSES" MITIGATION PANEL (Requirements 4 & 5) */}
        {simulation.status === 'RISK' && (
          <div className="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide bg-rose-500 text-white">
                    Action Required
                  </span>
                  <h3 className="text-lg font-black text-white font-['Outfit']">
                    Compare Responses: Clear Shortage of ₹{simulation.gap.toLocaleString()}
                  </h3>
                </div>
                <p className="text-xs text-neutral-400">
                  We simulated 4 operational maneuvers on this scenario. The lowest-cost solution is ranked #1.
                </p>
              </div>

              {/* Owner Editable Loan Interest Rate */}
              <div className="flex items-center space-x-2 shrink-0 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
                <span className="text-[11px] text-neutral-300 font-medium">Loan APR:</span>
                <input
                  type="number"
                  min="5"
                  max="36"
                  step="1"
                  value={loanInterestRate}
                  onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                  className="w-14 px-2 py-0.5 bg-neutral-900 rounded-md border border-neutral-600 text-xs font-mono font-bold text-amber-400 focus:outline-hidden"
                />
                <span className="text-[11px] text-neutral-400 font-mono">% p.a.</span>
              </div>
            </div>

            {/* Mitigation Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-3">Rank & Strategy</th>
                    <th className="py-3 px-3">Action Description</th>
                    <th className="py-3 px-3">Resulting Min Balance</th>
                    <th className="py-3 px-3">First Shortage</th>
                    <th className="py-3 px-3">Extra Cost</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {mitigationResponses.map((resp) => {
                    const isPreviewed = activePreviewResponseId === resp.id;

                    return (
                      <tr
                        key={resp.id}
                        className={`transition-colors ${
                          resp.isBest
                            ? 'bg-emerald-950/30 border-l-4 border-l-emerald-400'
                            : 'hover:bg-neutral-800/50'
                        }`}
                      >
                        {/* Rank & Strategy */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                                resp.isBest
                                  ? 'bg-emerald-400 text-black shadow-xs'
                                  : 'bg-neutral-700 text-neutral-300'
                              }`}
                            >
                              {resp.order}
                            </span>
                            <div>
                              <span className="font-bold text-white block">
                                {resp.title}
                              </span>
                              {resp.isBest && (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                  ⭐ Best Response (Lowest Cost)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-3 text-neutral-300 max-w-xs text-[11px]">
                          {resp.actionDesc}
                        </td>

                        {/* Resulting Min Balance */}
                        <td className="py-3.5 px-3 font-mono font-bold text-sm">
                          <span
                            className={
                              resp.minBalance >= simulation.safetyBuffer
                                ? 'text-emerald-400'
                                : resp.minBalance >= 0
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            ₹{resp.minBalance.toLocaleString()}
                          </span>
                        </td>

                        {/* First Shortage Date */}
                        <td className="py-3.5 px-3 text-[11px]">
                          {resp.clearsShortage ? (
                            <span className="inline-flex items-center text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              Cleared ✅
                            </span>
                          ) : (
                            <span className="text-amber-300 font-mono">
                              {resp.firstShortageDate}
                            </span>
                          )}
                        </td>

                        {/* Extra Cost */}
                        <td className="py-3.5 px-3 font-mono font-bold text-sm">
                          {resp.extraCost === 0 ? (
                            <span className="text-emerald-400">₹0 (Free)</span>
                          ) : (
                            <span className="text-amber-300">
                              ₹{resp.extraCost.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Preview on Chart Button */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() =>
                              setActivePreviewResponseId(
                                isPreviewed ? null : resp.id
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isPreviewed
                                ? 'bg-emerald-500 text-black font-black shadow-xs'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                            }`}
                          >
                            {isPreviewed ? 'Previewing ✓' : 'Preview Curve'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
