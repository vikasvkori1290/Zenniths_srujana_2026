/**
 * Business Logic Engine: Retained Cash & Timeline Cash-Flow Engine
 *
 * Implements exact SMB working capital logic:
 * - Gross sales vs Received cash in hand
 * - Retained cash per day = (received_cash_sales * gross_margin_pct) - daily_running_cost
 * - Timeline-based cash flow projection (no amortized rent/EMI double counting)
 * - Timeline check: balance[d] = opening_received_cash + sum(retained_cash) + sum(expected_rec * weight) - sum(dues)
 * - Safety buffer = 3 days of daily_running_cost
 * - Status: SAFE, WATCH, RISK
 */

import {
  getMultipliersForDate,
  getBaselineSalesForDate,
  clampOverlap,
} from './contextAdjuster.js';

export const DEFAULT_MARGINS_BY_TYPE = {
  kirana: 20,           // Kirana / Provisions: 15–20% (default 20%, 25% for worked example)
  grocery: 20,
  sweets: 35,          // Sweets / Bakery: 30–40%
  bakery: 35,
  stationery: 22,      // Stationery: 20–25%
  garments: 35,        // Garments / Apparel: 30–40%
  textile: 35,
  pharmacy: 20,
  hardware: 18,
  electronics: 15,
  cafe: 35,
  restaurant: 35,
  general: 25,
};

export const DEFAULT_CASHFLOW_SETTINGS = {
  openingCash: 40000,          // Opening received cash (in-hand + current account)
  grossMarginPct: 25,          // 25% (Worked example default)
  dailyRunningCost: 500,       // ₹500/day (helper wages, electricity, transport, petty expenses)
  safetyBuffer: 1500,          // Defaults to 3 * dailyRunningCost (3 * 500 = ₹1,500)
};

/**
 * Retrieve saved cash flow settings from localStorage or defaults
 */
export function getStoredCashflowSettings() {
  if (typeof window === 'undefined') return DEFAULT_CASHFLOW_SETTINGS;
  const saved = localStorage.getItem('aurum_cashflow_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        openingCash: Number(parsed.openingCash ?? DEFAULT_CASHFLOW_SETTINGS.openingCash),
        grossMarginPct: Number(parsed.grossMarginPct ?? DEFAULT_CASHFLOW_SETTINGS.grossMarginPct),
        dailyRunningCost: Number(parsed.dailyRunningCost ?? DEFAULT_CASHFLOW_SETTINGS.dailyRunningCost),
        safetyBuffer: Number(parsed.safetyBuffer ?? (3 * Number(parsed.dailyRunningCost || 500))),
      };
    } catch (e) {
      console.warn('Failed to parse aurum_cashflow_settings', e);
    }
  }
  return DEFAULT_CASHFLOW_SETTINGS;
}

/**
 * Save cash flow settings to localStorage and dispatch event
 */
export function saveCashflowSettings(settings) {
  if (typeof window === 'undefined') return settings;
  const merged = { ...getStoredCashflowSettings(), ...settings };
  localStorage.setItem('aurum_cashflow_settings', JSON.stringify(merged));
  window.dispatchEvent(new Event('aurum_cashflow_settings_updated'));
  window.dispatchEvent(new Event('storage'));
  return merged;
}

/**
 * Calculate Retained Cash Per Day:
 * retained_cash_per_day = (received_cash_sales * gross_margin_pct) - daily_running_cost
 */
export function calculateRetainedCashPerDay({
  receivedCashSales = 8000,
  grossMarginPct = 25,
  dailyRunningCost = 500,
}) {
  const sales = Number(receivedCashSales || 0);
  const marginPct = Number(grossMarginPct || 0);
  const marginFraction = marginPct / 100;
  const runningCost = Number(dailyRunningCost || 0);

  const grossProfit = Math.round(sales * marginFraction);
  const retainedCashPerDay = grossProfit - runningCost;
  const stockRestockCost = Math.round(sales * (1 - marginFraction));

  return {
    grossSales: sales,
    grossMarginPct: marginPct,
    dailyRunningCost: runningCost,
    grossProfit,
    stockRestockCost,
    retainedCashPerDay,
  };
}

/**
 * Build 60-day discrete timeline dues from fixed monthly commitments and upcoming payables.
 * Ensures rent/EMI and vendor dues are NOT amortized, but hit on their exact calendar dates.
 */
export function buildTimelineDues({
  fixedExpensesList = [],
  upcomingExpensesList = [],
  horizonDays = 60,
  startDate = new Date(),
}) {
  const duesByDay = {}; // dayIndex -> array of { title, amount, category, isFixed }
  const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  // 1. Process Monthly Fixed Expenses (e.g. Rent on 5th, EMI on 10th)
  for (const exp of fixedExpensesList || []) {
    const amount = Number(exp.amount || 0);
    const dueDay = Number(exp.dueDay) || 1;
    if (amount <= 0) continue;

    // Project each month in the horizon
    for (let mOffset = 0; mOffset <= 2; mOffset++) {
      const targetYear = today.getFullYear();
      const targetMonth = today.getMonth() + mOffset;
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const validDay = Math.min(dueDay, daysInTargetMonth);
      const targetDate = new Date(targetYear, targetMonth, validDay);

      // Check if this date has already been paid in current month
      if (mOffset === 0 && targetDate <= today && exp.status === 'Paid') {
        continue; // Already paid this month
      }

      const diffMs = targetDate.getTime() - today.getTime();
      const dayIndex = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (dayIndex >= 0 && dayIndex <= horizonDays) {
        if (!duesByDay[dayIndex]) duesByDay[dayIndex] = [];
        duesByDay[dayIndex].push({
          id: `fixed-${exp.id}-${mOffset}`,
          title: exp.title || `${exp.category} Fixed Commitment`,
          amount,
          category: exp.category || 'Fixed Commitment',
          date: targetDate.toISOString().split('T')[0],
          isFixed: true,
          dueDay,
        });
      }
    }
  }

  // 2. Process Upcoming One-off Payables (e.g. Supplier Invoices, GST)
  for (const up of upcomingExpensesList || []) {
    const amount = Number(up.amount || 0);
    if (amount <= 0 || !up.dueDate) continue;

    // Deduplicate if it was an auto-synced fixed expense already handled above
    if (up.fixedId || up.isFixedMonthly) continue;

    const parts = up.dueDate.split('-').map(Number);
    if (parts.length === 3) {
      const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const diffMs = targetDate.getTime() - today.getTime();
      const dayIndex = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      if (dayIndex <= horizonDays) {
        if (!duesByDay[dayIndex]) duesByDay[dayIndex] = [];
        duesByDay[dayIndex].push({
          id: up.id || `up-${dayIndex}`,
          title: up.title || 'Supplier Payable',
          amount,
          category: up.category || 'Supplier Dues',
          date: up.dueDate,
          isFixed: false,
          urgency: up.urgency || 'Normal',
        });
      }
    }
  }

  return duesByDay;
}

/**
 * Build timeline expected receivables from eKhata customer credits.
 * Expected money is kept separate from received cash in hand, weighted by reliability.
 */
export function buildTimelineReceivables({
  eKhataCustomersList = [],
  horizonDays = 60,
  startDate = new Date(),
}) {
  const recvByDay = {}; // dayIndex -> total expected on that day
  const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  let totalUdhar = 0;
  const undatedList = [];

  for (const c of eKhataCustomersList || []) {
    const amt = Number(c.totalAmount || 0);
    if (amt <= 0) continue;
    totalUdhar += amt;

    const dueStr = (c.dueDate || '').trim().toLowerCase();
    let scheduledDay = null;

    if (dueStr && dueStr !== 'not specified' && dueStr !== 'null' && dueStr !== 'none') {
      // Check ISO format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dueStr)) {
        const [y, m, d] = dueStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const diffMs = dateObj.getTime() - today.getTime();
        scheduledDay = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    if (scheduledDay !== null && scheduledDay <= horizonDays) {
      recvByDay[scheduledDay] = (recvByDay[scheduledDay] || 0) + amt;
    } else {
      undatedList.push(amt);
    }
  }

  // For undated customer udhar, spread expected recovery across a 15-day curve (day 3, 7, 12, 15)
  const undatedTotal = undatedList.reduce((s, a) => s + a, 0);
  if (undatedTotal > 0) {
    const spreadDays = [3, 7, 11, 15];
    const portion = Math.round(undatedTotal / spreadDays.length);
    spreadDays.forEach((d) => {
      recvByDay[d] = (recvByDay[d] || 0) + portion;
    });
  }

  return { recvByDay, totalUdhar };
}

/**
 * Main Timeline Cash-Flow Engine
 * Computes projected balance for every day d = 1..60:
 * balance[d] = opening_received_cash + sum(retained_cash[d'<=d]) + sum(expected_rec[d'<=d] * weight) - sum(dues[d'<=d])
 * Supports Festival & Context Sales Adjuster (low, base, high corridors).
 */
export function calculateTimelineCashflow({
  openingReceivedCash = 40000,
  todayReceivedSales = 8000,
  grossMarginPct = 25,
  dailyRunningCost = 500,
  safetyBuffer = 1500,
  fixedExpensesList = [],
  upcomingExpensesList = [],
  eKhataCustomersList = [],
  horizonDays = 60,
  startDate = new Date(),
  contextAdjustments = [],
  isFestivalAdjustmentOn = true,
  salesHistory = [],
}) {
  // 1. Total liquid received cash in hand today (Opening + Today's Realized Receipts)
  const totalReceivedCashInHand = Number(openingReceivedCash || 0) + Number(todayReceivedSales || 0);

  // 2. Retained cash per day (Baseline today)
  const retainedResult = calculateRetainedCashPerDay({
    receivedCashSales: todayReceivedSales,
    grossMarginPct,
    dailyRunningCost,
  });
  const retainedPerDay = retainedResult.retainedCashPerDay;

  // 3. Build discrete dues and expected receivables
  const duesByDay = buildTimelineDues({
    fixedExpensesList,
    upcomingExpensesList,
    horizonDays,
    startDate,
  });

  const { recvByDay, totalUdhar } = buildTimelineReceivables({
    eKhataCustomersList,
    horizonDays,
    startDate,
  });

  // 4. Simulate Base, Low, and High timeline corridors
  let cumRetainedBase = 0;
  let cumRetainedLow = 0;
  let cumRetainedHigh = 0;
  let cumRecvBase = 0;
  let cumRecvLow = 0;
  let cumRecvHigh = 0;
  let cumDues = 0;

  const timeline = [];
  const lowScenarioTimeline = [];
  let firstRisk = null;
  let firstLowRisk = null;
  let minBalance = totalReceivedCashInHand;
  let minBalanceDay = 0;

  const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  for (let d = 1; d <= horizonDays; d++) {
    const dDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
    const dateStr = dDate.toISOString().split('T')[0];

    // Day-of-week baseline sales from shop's history (fallback to todayReceivedSales)
    const baselineSales = getBaselineSalesForDate(dDate, salesHistory, todayReceivedSales);

    // Multipliers for date (bounded [0.6, 1.6], overlap capped at 1.8)
    const { low: multLow, base: multBase, high: multHigh, activeEvents, isAdjusted } =
      getMultipliersForDate(dateStr, contextAdjustments, isFestivalAdjustmentOn);

    // 1. adj_sales = baseline_sales * multiplier
    const adjSalesBase = Math.round(baselineSales * multBase);
    const adjSalesLow = Math.round(baselineSales * multLow);
    const adjSalesHigh = Math.round(baselineSales * multHigh);

    // 2. retained_cash = (adj_sales * gross_margin_pct) - daily_running_cost
    // (Never treat adj_sales as spendable cash)
    const retainedBase = Math.round(adjSalesBase * (grossMarginPct / 100)) - dailyRunningCost;
    const retainedLow = Math.round(adjSalesLow * (grossMarginPct / 100)) - dailyRunningCost;
    const retainedHigh = Math.round(adjSalesHigh * (grossMarginPct / 100)) - dailyRunningCost;

    cumRetainedBase += retainedBase;
    cumRetainedLow += retainedLow;
    cumRetainedHigh += retainedHigh;

    // eKhata expected collections weighted by scenario
    const dayRecv = recvByDay[d] || 0;
    cumRecvBase += Math.round(dayRecv * 0.8);
    cumRecvLow += Math.round(dayRecv * 0.4);
    cumRecvHigh += Math.round(dayRecv * 1.0);

    const dayDues = duesByDay[d] || [];
    const dayDuesTotal = dayDues.reduce((s, item) => s + item.amount, 0);
    cumDues += dayDuesTotal;

    // Attach expected retained cash before this due date to each due item
    dayDues.forEach((due) => {
      due.expectedRetainedBeforeDue = {
        base: cumRetainedBase,
        low: cumRetainedLow,
        high: cumRetainedHigh,
      };
    });

    const balanceBase = totalReceivedCashInHand + cumRetainedBase + cumRecvBase - cumDues;
    const balanceLow = totalReceivedCashInHand + cumRetainedLow + cumRecvLow - cumDues;
    const balanceHigh = totalReceivedCashInHand + cumRetainedHigh + cumRecvHigh - cumDues;

    if (balanceBase < minBalance) {
      minBalance = balanceBase;
      minBalanceDay = d;
    }

    const isBelowBuffer = balanceBase < safetyBuffer;
    const isDeficit = balanceBase < 0;

    if (isBelowBuffer && !firstRisk) {
      firstRisk = {
        day: d,
        date: dateStr,
        balance: balanceBase,
        shortfall: safetyBuffer - balanceBase,
        isDeficit,
        dayDuesTotal,
        primaryDue: dayDues[0]?.title || 'Scheduled Obligations',
      };
    }

    if (balanceLow < safetyBuffer && !firstLowRisk) {
      firstLowRisk = {
        day: d,
        balance: balanceLow,
      };
    }

    const point = {
      day: d,
      date: dateStr,
      baselineSales,
      multBase,
      multLow,
      multHigh,
      activeEvents,
      isAdjusted,
      adjSalesBase,
      adjSalesLow,
      adjSalesHigh,
      retainedBase,
      retainedLow,
      retainedHigh,
      cumRetainedBase,
      cumRetainedLow,
      cumRetainedHigh,
      cumRecv: cumRecvBase,
      dayDuesTotal,
      cumDues,
      balance: balanceBase,
      balanceLow,
      balanceHigh,
      isBelowBuffer,
      isDeficit,
    };

    timeline.push(point);
    lowScenarioTimeline.push({
      ...point,
      balance: balanceLow,
      isBelowBuffer: balanceLow < safetyBuffer,
      isDeficit: balanceLow < 0,
    });
  }

  // 5. Determine Overall Status Badge
  let status = 'SAFE';
  if (firstRisk) {
    status = 'RISK';
  } else if (firstLowRisk) {
    status = 'WATCH';
  } else {
    status = 'SAFE';
  }
  // 6. Next Risk Date & Headline Metrics
  let nextRiskDateFormatted = null;
  let nextRiskDays = null;
  let headlineMetric = '';
  let headlineLabel = '';

  if (retainedPerDay < 0) {
    const runwayDay = timeline.findIndex((t) => t.balance <= 0);
    const daysLeft = runwayDay !== -1 ? runwayDay + 1 : horizonDays;
    headlineLabel = 'Estimated Cash Runway';
    headlineMetric = `${daysLeft} Days`;
  } else {
    if (firstRisk) {
      nextRiskDays = firstRisk.day;
      const riskDateObj = new Date(today);
      riskDateObj.setDate(today.getDate() + nextRiskDays);
      nextRiskDateFormatted = riskDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      headlineLabel = 'Next Risk Date';
      headlineMetric = `${nextRiskDateFormatted} (in ${nextRiskDays}d)`;
    } else {
      headlineLabel = 'Shortfall Horizon';
      headlineMetric = 'No Shortfall in 60 Days';
    }
  }

  // Calculate 15-day upcoming total for informational display
  let duesWithin15Days = 0;
  for (let d = 1; d <= 15; d++) {
    const list = duesByDay[d] || [];
    duesWithin15Days += list.reduce((s, i) => s + i.amount, 0);
  }

  return {
    // Core Retained Cash Metrics
    grossSales: retainedResult.grossSales,
    grossMarginPct,
    dailyRunningCost,
    retainedCashPerDay: retainedPerDay,
    stockRestockCost: retainedResult.stockRestockCost,
    grossProfit: retainedResult.grossProfit,

    // Separation of Received vs Expected
    receivedCashInHand: totalReceivedCashInHand,
    expectedReceivables: totalUdhar,

    // Safety buffer & Timeline status
    safetyBuffer,
    status, // 'SAFE' | 'WATCH' | 'RISK'
    headlineLabel,
    headlineMetric,
    nextRiskDays,
    nextRiskDateFormatted,
    firstRisk,
    minProjectedBalance: minBalance,

    // Context / Festival flags
    isFestivalAdjustmentOn,
    contextAdjustments,

    // Timeline details with Base, Low, High corridors
    duesWithin15Days,
    duesByDay,
    timeline,
    lowScenarioTimeline,
  };
}

/**
 * Adapter function to maintain backward-compatibility with components
 * while strictly implementing the new retained cash & timeline logic.
 */
export function calculatePredictiveCashRunway({
  startingBalance = 40000,
  todayIncomeList = [],
  fixedExpensesList = [],
  upcomingExpensesList = [],
  eKhataCustomersList = [],
  customSettings = null,
  contextAdjustments = [],
  isFestivalAdjustmentOn = true,
  salesHistory = [],
  startDate = new Date(),
}) {
  const settings = customSettings || getStoredCashflowSettings();

  const totalTodayReceivedSales = (todayIncomeList || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const timelineResult = calculateTimelineCashflow({
    openingReceivedCash: settings.openingCash ?? startingBalance,
    todayReceivedSales: totalTodayReceivedSales,
    grossMarginPct: settings.grossMarginPct,
    dailyRunningCost: settings.dailyRunningCost,
    safetyBuffer: settings.safetyBuffer,
    fixedExpensesList,
    upcomingExpensesList,
    eKhataCustomersList,
    contextAdjustments,
    isFestivalAdjustmentOn,
    salesHistory,
    startDate,
  });

  // Informational advisory message
  let advisoryTitle = '';
  let advisoryText = '';

  if (timelineResult.status === 'SAFE') {
    advisoryTitle = 'Healthy Operational Cash Position';
    advisoryText = `Daily retained cash is +₹${timelineResult.retainedCashPerDay.toLocaleString()}/day (after restocking & running costs). All scheduled dues are covered across 60 days with buffer intact.`;
  } else if (timelineResult.status === 'WATCH') {
    advisoryTitle = 'Liquidity Watch Window';
    advisoryText = `Safe under standard collections (+₹${timelineResult.retainedCashPerDay.toLocaleString()}/day), but stress test shows balance could drop near ₹${timelineResult.safetyBuffer.toLocaleString()} safety buffer if customer udhar recovery is delayed.`;
  } else {
    advisoryTitle = 'Lumpy Payment Shortfall Alert';
    advisoryText = `Payment cliff on ${timelineResult.nextRiskDateFormatted || 'upcoming due date'}: projected balance drops to ₹${timelineResult.firstRisk?.balance?.toLocaleString()} (below ₹${timelineResult.safetyBuffer.toLocaleString()} buffer) due to ${timelineResult.firstRisk?.primaryDue}. Prioritize cash preservation.`;
  }

  return {
    // New RETAINED CASH values
    liquidCashAvailable: timelineResult.receivedCashInHand,
    receivedCashInHand: timelineResult.receivedCashInHand,
    expectedReceivables: timelineResult.expectedReceivables,
    retainedCashPerDay: timelineResult.retainedCashPerDay,
    grossSales: timelineResult.grossSales,
    grossMarginPct: timelineResult.grossMarginPct,
    dailyRunningCost: timelineResult.dailyRunningCost,
    safetyBuffer: timelineResult.safetyBuffer,

    // Status and Timeline Headline
    runwayStatus: timelineResult.status,
    runwayDays: timelineResult.retainedCashPerDay < 0 ? (timelineResult.nextRiskDays || 1) : 60,
    headlineLabel: timelineResult.headlineLabel,
    headlineMetric: timelineResult.headlineMetric,
    nextRiskDateFormatted: timelineResult.nextRiskDateFormatted,
    nextRiskDays: timelineResult.nextRiskDays,
    firstRisk: timelineResult.firstRisk,
    minProjectedBalance: timelineResult.minProjectedBalance,

    // Timeline liabilities (informational, not amortized)
    duesWithin15Days: timelineResult.duesWithin15Days,
    totalMonthlyFixed: (fixedExpensesList || []).reduce((s, i) => s + Number(i.amount || 0), 0),
    totalUpcomingLiabilities: (upcomingExpensesList || []).reduce((s, i) => s + Number(i.amount || 0), 0),
    totalDailyInflow: timelineResult.retainedCashPerDay,
    dailyBurnRate: timelineResult.dailyRunningCost,
    netDailyCashFlow: timelineResult.retainedCashPerDay,

    advisoryTitle,
    advisoryText,
    timeline: timelineResult.timeline,
  };
}
