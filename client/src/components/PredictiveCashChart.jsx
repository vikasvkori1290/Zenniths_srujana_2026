import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  Sliders,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function PredictiveCashChart({
  activeHorizon,
  activeScenario,
  onScenarioChange,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [arDelayDays, setArDelayDays] = useState(0);
  const [revenueChangePercent, setRevenueChangePercent] = useState(0);
  const [emergencyExpense, setEmergencyExpense] = useState(0);

  // Generate responsive high-fidelity data points for the selected horizon
  const daysCount = activeHorizon === '90D' ? 45 : activeHorizon === '60D' ? 30 : 20;

  const dataPoints = useMemo(() => {
    const points = [];
    const baseStartingBalance = 168450;
    const safetyBuffer = 40000;

    // Past 6 days
    const pastDays = [
      { day: 'Oct 18', balance: 154200, isPast: true },
      { day: 'Oct 20', balance: 159800, isPast: true },
      { day: 'Oct 22', balance: 161400, isPast: true },
      { day: 'Oct 24', balance: 168450, isPast: true, isToday: true },
    ];

    pastDays.forEach((p, idx) => {
      points.push({
        label: p.day,
        balance: p.balance,
        upper: p.balance,
        lower: p.balance,
        isPast: true,
        isToday: !!p.isToday,
      });
    });

    // Future forecast days
    let runningBalance = baseStartingBalance;

    const milestones = {
      3: { label: 'Nov 01: Monthly Payroll & Benefits', amount: -22500, type: 'outflow' },
      6: { label: 'Nov 05: Enterprise Retainer Expected', amount: 38000, type: 'inflow' },
      9: { label: 'Nov 10: Vendor Batch & Software Subs', amount: -14200, type: 'outflow' },
      13: { label: 'Nov 16: Projected Cash Trough ($142k)', amount: -8500, type: 'dip' },
      16: { label: 'Nov 20: Retail Invoices Batch Arriving', amount: 44000, type: 'inflow' },
      20: { label: 'Nov 26: Performance Marketing Outflow', amount: -11000, type: 'outflow' },
      24: { label: 'Dec 02: Q4 Contract Payment', amount: 52000, type: 'inflow' },
    };

    const futureDates = [
      'Oct 26', 'Oct 28', 'Oct 31', 'Nov 02', 'Nov 05', 'Nov 08', 'Nov 11', 'Nov 14',
      'Nov 17', 'Nov 20', 'Nov 23', 'Nov 26', 'Nov 29', 'Dec 02', 'Dec 05', 'Dec 08',
      'Dec 12', 'Dec 16', 'Dec 20', 'Dec 24', 'Dec 28', 'Jan 02', 'Jan 08', 'Jan 15',
    ];

    for (let i = 0; i < daysCount; i++) {
      const dateLabel = futureDates[i] || `Day +${i + 4}`;
      const milestone = milestones[i];

      // Base daily organic fluctuation
      let dailyDelta = 1200 - 950; // slight positive organic growth

      if (milestone) {
        let amount = milestone.amount;
        // Apply scenario adjustments
        if (amount > 0 && revenueChangePercent !== 0) {
          amount += amount * (revenueChangePercent / 100);
        }
        if (amount > 0 && arDelayDays > 0 && i < 10) {
          // push inflow further back
          amount *= 0.35;
        }
        dailyDelta += amount;
      }

      // If emergency expense applied at step 4
      if (i === 4 && emergencyExpense > 0) {
        dailyDelta -= emergencyExpense;
      }

      runningBalance += dailyDelta;

      // Confidence intervals widen over time
      const uncertainty = (i + 1) * 2200;
      const upper = runningBalance + uncertainty * (1 + revenueChangePercent / 100);
      const lower = Math.max(30000, runningBalance - uncertainty * (1 + arDelayDays / 20));

      points.push({
        label: dateLabel,
        balance: Math.round(runningBalance),
        upper: Math.round(upper),
        lower: Math.round(lower),
        isPast: false,
        isToday: false,
        milestone: milestone ? milestone.label : null,
        milestoneType: milestone ? milestone.type : null,
      });
    }

    return points;
  }, [activeHorizon, arDelayDays, revenueChangePercent, emergencyExpense, daysCount]);

  // Compute SVG dimensions and scaling
  const chartHeight = 280;
  const chartWidth = 960;
  const paddingX = 40;
  const paddingY = 40;

  const minVal = Math.min(...dataPoints.map((d) => d.lower), 35000);
  const maxVal = Math.max(...dataPoints.map((d) => d.upper), 240000);

  const getX = (index) => paddingX + (index / (dataPoints.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val) => chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);

  // Path coordinates
  const pastPoints = dataPoints.filter((d) => d.isPast);
  const futurePoints = dataPoints.filter((d) => !d.isPast || d.isToday);

  // SVG paths
  const pastPath = pastPoints.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.balance);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const todayIndex = dataPoints.findIndex((d) => d.isToday);
  const forecastPath = futurePoints.reduce((acc, p, i) => {
    const actualIdx = todayIndex + i;
    const x = getX(actualIdx);
    const y = getY(p.balance);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Confidence area path (upper to lower)
  const confidenceArea = useMemo(() => {
    const topPoints = [];
    const bottomPoints = [];

    futurePoints.forEach((p, i) => {
      const idx = todayIndex + i;
      topPoints.push(`${getX(idx)} ${getY(p.upper)}`);
      bottomPoints.unshift(`${getX(idx)} ${getY(p.lower)}`);
    });

    if (topPoints.length === 0) return '';
    return `M ${topPoints[0]} L ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  }, [futurePoints, todayIndex]);

  const safetyLineY = getY(40000);

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-2xl">
      {/* Background ambient gold gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Chart Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <h3 className="text-lg font-bold text-white font-['Outfit'] tracking-tight">
              Predictive Cash Curve & Confidence Horizon
            </h3>
            <span className="text-[11px] font-semibold text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
              Monte Carlo Model
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Solid line shows reconciled actuals; golden radiant path shows AI projection with 90% confidence interval.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-3 h-1 bg-white/70 rounded-full"></span>
            <span>Historical Actuals</span>
          </div>
          <div className="flex items-center space-x-1.5 text-yellow-300">
            <span className="w-3 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]"></span>
            <span className="font-semibold">AI Baseline Forecast</span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-400">
            <span className="w-3 h-2 bg-amber-400/20 border border-amber-400/50 rounded-sm"></span>
            <span>Confidence Interval</span>
          </div>
          <div className="flex items-center space-x-1.5 text-rose-400">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-400"></span>
            <span>Safety Reserve ($40k)</span>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Sandbox Slider Drawer */}
      <div className="py-3 px-4 my-4 rounded-xl bg-black/60 border border-yellow-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-yellow-300 uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-yellow-400" />
          <span>Interactive Scenario Modifiers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          {/* Late AR Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium">Customer AR Delay:</span>
            <input
              type="range"
              min="0"
              max="20"
              step="5"
              value={arDelayDays}
              onChange={(e) => setArDelayDays(Number(e.target.value))}
              className="accent-yellow-400 w-24 cursor-pointer"
            />
            <span className="font-mono text-yellow-400 font-bold w-12">
              +{arDelayDays}d
            </span>
          </div>

          {/* Revenue Surge Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium">Sales Variance:</span>
            <input
              type="range"
              min="-20"
              max="30"
              step="5"
              value={revenueChangePercent}
              onChange={(e) => setRevenueChangePercent(Number(e.target.value))}
              className="accent-yellow-400 w-24 cursor-pointer"
            />
            <span className={`font-mono font-bold w-12 ${revenueChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {revenueChangePercent >= 0 ? `+${revenueChangePercent}%` : `${revenueChangePercent}%`}
            </span>
          </div>

          {/* Shock Outflow Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium">Emergency Outflow:</span>
            <button
              onClick={() => setEmergencyExpense(emergencyExpense === 0 ? 15000 : 0)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                emergencyExpense > 0
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {emergencyExpense > 0 ? '⚠️ Shock -$15,000 Active' : '+ Simulate $15k Shock'}
            </button>
          </div>

          {(arDelayDays > 0 || revenueChangePercent !== 0 || emergencyExpense > 0) && (
            <button
              onClick={() => {
                setArDelayDays(0);
                setRevenueChangePercent(0);
                setEmergencyExpense(0);
              }}
              className="text-[11px] text-yellow-400 hover:underline cursor-pointer"
            >
              Reset to AI Base
            </button>
          )}
        </div>
      </div>

      {/* SVG Chart Visualization */}
      <div className="relative w-full overflow-x-auto select-none pt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto max-h-85 overflow-visible"
        >
          <defs>
            {/* Gold Area Gradient */}
            <linearGradient id="goldConfidenceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.03" />
            </linearGradient>

            {/* Glowing Golden Line Filter */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#facc15" floodOpacity="0.75" />
            </filter>

            {/* Grid Pattern */}
            <pattern id="gridLines" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect x={paddingX} y={paddingY} width={chartWidth - paddingX * 2} height={chartHeight - paddingY * 2} fill="url(#gridLines)" />

          {/* Safety Reserve Threshold Line ($40k) */}
          <line
            x1={paddingX}
            y1={safetyLineY}
            x2={chartWidth - paddingX}
            y2={safetyLineY}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="5,5"
            opacity="0.65"
          />
          <text
            x={chartWidth - paddingX - 10}
            y={safetyLineY - 6}
            fill="#f43f5e"
            fontSize="10"
            textAnchor="end"
            fontFamily="JetBrains Mono"
            fontWeight="bold"
          >
            CRITICAL RESERVE THRESHOLD ($40k)
          </text>

          {/* Confidence Band Polygon */}
          {confidenceArea && (
            <path d={confidenceArea} fill="url(#goldConfidenceGrad)" />
          )}

          {/* Historical Actuals Line */}
          <path
            d={pastPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Forecast Golden Line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#facc15"
            strokeWidth="3"
            filter="url(#goldGlow)"
            strokeLinecap="round"
          />

          {/* Milestone points & markers */}
          {dataPoints.map((point, index) => {
            const cx = getX(index);
            const cy = getY(point.balance);

            if (point.isToday) {
              return (
                <g key={`today-${index}`}>
                  <line
                    x1={cx}
                    y1={paddingY}
                    x2={cx}
                    y2={chartHeight - paddingY}
                    stroke="#facc15"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    opacity="0.8"
                  />
                  <circle cx={cx} cy={cy} r="7" fill="#facc15" className="animate-pulse" />
                  <circle cx={cx} cy={cy} r="3.5" fill="#000000" />
                  <text
                    x={cx}
                    y={paddingY - 10}
                    fill="#facc15"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="Outfit"
                  >
                    TODAY
                  </text>
                </g>
              );
            }

            if (point.milestone) {
              const isPositive = point.milestoneType === 'inflow';
              const markerColor = isPositive ? '#34d399' : point.milestoneType === 'dip' ? '#facc15' : '#fb7185';

              return (
                <g
                  key={`ms-${index}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hoveredIndex === index ? '7' : '5'}
                    fill={markerColor}
                    stroke="#000"
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {hoveredIndex === index && (
                    <circle cx={cx} cy={cy} r="12" fill={markerColor} opacity="0.25" />
                  )}
                </g>
              );
            }

            return null;
          })}

          {/* Horizontal X-Axis Labels */}
          {dataPoints.map((point, index) => {
            if (index % Math.ceil(dataPoints.length / 8) === 0 || point.isToday) {
              const cx = getX(index);
              return (
                <text
                  key={`lbl-${index}`}
                  x={cx}
                  y={chartHeight - 12}
                  fill={point.isToday ? '#facc15' : '#64748b'}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                  fontWeight={point.isToday ? 'bold' : 'normal'}
                >
                  {point.label}
                </text>
              );
            }
            return null;
          })}

          {/* Vertical Y-Axis Balance Labels */}
          {[40000, 100000, 160000, 220000].map((val) => {
            const y = getY(val);
            return (
              <text
                key={`y-${val}`}
                x={paddingX - 10}
                y={y + 3}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                fontFamily="JetBrains Mono"
              >
                ${val / 1000}k
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip display */}
        {hoveredIndex !== null && dataPoints[hoveredIndex] && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 border border-yellow-400/50 p-3 rounded-xl backdrop-blur-md shadow-2xl pointer-events-none z-20 min-w-65"
          >
            <div className="flex items-center justify-between text-xs pb-1 mb-1 border-b border-white/10">
              <span className="font-bold text-white">{dataPoints[hoveredIndex].label}</span>
              <span className="text-yellow-400 font-mono text-[11px]">
                {dataPoints[hoveredIndex].isPast ? 'Reconciled' : 'AI Projection'}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Predicted Balance:</span>
                <span className="font-bold text-white font-mono text-sm">
                  ${dataPoints[hoveredIndex].balance.toLocaleString()}
                </span>
              </div>
              {!dataPoints[hoveredIndex].isPast && (
                <div className="flex justify-between text-[11px] text-yellow-300/80">
                  <span>90% Range:</span>
                  <span className="font-mono">
                    ${dataPoints[hoveredIndex].lower.toLocaleString()} - ${dataPoints[hoveredIndex].upper.toLocaleString()}
                  </span>
                </div>
              )}
              {dataPoints[hoveredIndex].milestone && (
                <div className="mt-2 pt-1.5 border-t border-white/10 text-xs text-yellow-300 font-medium">
                  📌 {dataPoints[hoveredIndex].milestone}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Highlights */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
          <div>
            <span className="font-semibold text-slate-200">Surplus Inflection:</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Receivables arriving on Nov 20 and Dec 2 will lift liquidity to peak 90-day high of ~$224,000.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
          <div>
            <span className="font-semibold text-slate-200">Optimal Liquidity Window:</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Safe to schedule major inventory orders or capital equipment buys between Nov 22 and Nov 28.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
          <div>
            <span className="font-semibold text-slate-200">Simulation Resilience:</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Even with 15-day customer delay, balance stays &gt;$100,000 above the critical $40k reserve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
