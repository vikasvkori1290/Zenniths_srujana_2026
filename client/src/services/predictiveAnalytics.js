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
import { getDueEvents } from './expenseSync.js';

export { getDueEvents };

/**
 * Timezone-safe local YYYY-MM-DD formatter (avoids UTC date shift in IST/non-UTC timezones)
 */
export function toLocalDateString(d = new Date()) {
  if (!d) return '';
  const dateObj = typeof d === 'string'
    ? (() => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day); })()
    : new Date(d);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  openingCash: 40000,          // Opening cash in hand
  openingDate: '2026-10-01',   // Opening date for free cash reserves tracking
  grossMarginPct: 20,          // Default 20%
  dailyRunningCost: 500,       // ₹500/day
  safetyBuffer: 1500,          // Defaults to 3 * dailyRunningCost (3 * 500 = ₹1,500)
  ownerTargetDailySales: 8000, // Owner target fallback if < 3 trading days
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
        openingDate: parsed.openingDate || DEFAULT_CASHFLOW_SETTINGS.openingDate,
        grossMarginPct: Number(parsed.grossMarginPct ?? DEFAULT_CASHFLOW_SETTINGS.grossMarginPct),
        dailyRunningCost: Number(parsed.dailyRunningCost ?? DEFAULT_CASHFLOW_SETTINGS.dailyRunningCost),
        safetyBuffer: Number(parsed.safetyBuffer ?? (3 * Number(parsed.dailyRunningCost || 500))),
        ownerTargetDailySales: Number(parsed.ownerTargetDailySales ?? DEFAULT_CASHFLOW_SETTINGS.ownerTargetDailySales),
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
 * Calculate Baseline Daily Sales:
 * Baseline = median of last 7 complete trading days (fallback: owner target if < 3 days).
 * Excludes today if open, caps any day at 2x median.
 * Excludes unconfirmed entries (Requirement 8).
 */
export function calculateBaselineSales({
  salesHistory = [],
  ownerTargetDailySales = 8000,
  todayDateStr = toLocalDateString(),
}) {
  const completeDays = (salesHistory || []).filter((entry) => {
    const entryDate = (entry.date || '').split('T')[0];
    if (entryDate === todayDateStr && entry.isOpen !== false && entry.isComplete !== true) {
      return false; // exclude today if open
    }
    if (entry.unconfirmed || entry.isConfirmed === false) {
      return false; // exclude unconfirmed entries from baseline (Requirement 8)
    }
    const val = Number(entry.sales ?? entry.amount ?? 0);
    return val > 0;
  });

  const recentDays = completeDays.slice(-7).map((e) => Number(e.sales ?? e.amount ?? 0));
  if (recentDays.length < 3) {
    return Number(ownerTargetDailySales || 8000);
  }

  const sorted = [...recentDays].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const initialMedian = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const cap = 2 * initialMedian;
  const cappedDays = recentDays.map((val) => Math.min(val, cap));

  const cappedSorted = [...cappedDays].sort((a, b) => a - b);
  const finalMid = Math.floor(cappedSorted.length / 2);
  const finalMedian = cappedSorted.length % 2 !== 0
    ? cappedSorted[finalMid]
    : Math.round((cappedSorted[finalMid - 1] + cappedSorted[finalMid]) / 2);

  return Math.round(finalMedian);
}

/**
 * Robust parser for eKhata due dates:
 * Supports ISO (YYYY-MM-DD), natural text ("26 October", "26th October", "October 26"), and relative strings.
 */
export function parseKhataDueDate(dueDateStr, today = new Date()) {
  if (!dueDateStr || typeof dueDateStr !== 'string') return null;
  const clean = dueDateStr.trim();
  const lower = clean.toLowerCase();
  if (
    !clean ||
    lower === 'not specified' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'none' ||
    lower.includes('undated') ||
    lower.includes('on-demand')
  ) {
    return null;
  }

  const tObj = typeof today === 'string'
    ? (() => { const [y, m, d] = today.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // ISO Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

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

  // e.g. "26 October", "26th October", "26 October 2026"
  const dayMonthMatch = clean.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(\d{4}))?$/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const mStr = dayMonthMatch[2].toLowerCase();
    const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : tObj.getFullYear();
    if (monthNames[mStr] !== undefined) {
      let candidate = new Date(year, monthNames[mStr], day);
      if (!dayMonthMatch[3] && candidate.getTime() < tObj.getTime() - 1000 * 60 * 60 * 24 * 300) {
        candidate = new Date(year + 1, monthNames[mStr], day);
      }
      return candidate;
    }
  }

  // e.g. "October 26", "October 26, 2026"
  const monthDayMatch = clean.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i);
  if (monthDayMatch) {
    const mStr = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : tObj.getFullYear();
    if (monthNames[mStr] !== undefined) {
      let candidate = new Date(year, monthNames[mStr], day);
      if (!monthDayMatch[3] && candidate.getTime() < tObj.getTime() - 1000 * 60 * 60 * 24 * 300) {
        candidate = new Date(year + 1, monthNames[mStr], day);
      }
      return candidate;
    }
  }

  // General fallback
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
}

/**
 * Calculate Expected Khata Receipt Date:
 * expected_date = max(due_date + avg_delay, today).
 * NEVER before the due date! (Requirement 6)
 */
export function calculateExpectedKhataDate(dueDateStr, avgDelayDays = 0, today = new Date()) {
  const tObj = typeof today === 'string'
    ? (() => { const [y, m, d] = today.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const dueObj = parseKhataDueDate(dueDateStr, tObj);

  if (!dueObj) {
    const delayDays = Math.max(0, Number(avgDelayDays || 3));
    const target = new Date(tObj.getFullYear(), tObj.getMonth(), tObj.getDate() + delayDays);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const delayDays = Math.max(0, Number(avgDelayDays || 0));
  const delayedObj = new Date(dueObj.getFullYear(), dueObj.getMonth(), dueObj.getDate() + delayDays);

  // max(due_date + avg_delay, today, due_date)
  const targetTime = Math.max(delayedObj.getTime(), tObj.getTime(), dueObj.getTime());
  const target = new Date(targetTime);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate Retained Cash Per Day (Requirement 1):
 * retained[d] = cash_upi_received[d] - gross_sales[d] * (1 - margin) - running_cost
 *
 * Udhar sales deduct stock cost on the sale day;
 * khata collections are added in full on the day collected.
 */
export function calculateRetainedCashPerDay({
  cashUpiReceived = null,
  receivedCashSales = null, // backward compatibility synonym
  grossSales = null,
  grossMarginPct = 20,
  dailyRunningCost = 500,
  udharSales = 0,
  khataCollections = 0,
}) {
  const marginFraction = Number(grossMarginPct || 0) / 100;
  const runningCost = Number(dailyRunningCost || 0);

  // Determine gross sales
  let gSales = 0;
  if (grossSales !== null && grossSales !== undefined) {
    gSales = Number(grossSales);
  } else if (receivedCashSales !== null && receivedCashSales !== undefined) {
    gSales = Number(receivedCashSales) + Number(udharSales || 0);
  } else {
    gSales = Number(udharSales || 0);
  }

  // Determine cash received
  let cashReceived = 0;
  if (cashUpiReceived !== null && cashUpiReceived !== undefined) {
    cashReceived = Number(cashUpiReceived);
  } else if (receivedCashSales !== null && receivedCashSales !== undefined) {
    cashReceived = Number(receivedCashSales) + Number(khataCollections || 0);
  } else {
    cashReceived = Number(khataCollections || 0);
  }

  const stockRestockCost = Math.round(gSales * (1 - marginFraction));
  const grossProfit = Math.round(gSales * marginFraction);

  // retained[d] = cash_upi_received[d] - gross_sales[d] * (1 - margin) - running_cost
  const retainedCashPerDay = Math.round(cashReceived - (gSales * (1 - marginFraction)) - runningCost);

  return {
    grossSales: gSales,
    cashUpiReceived: cashReceived,
    grossMarginPct: Number(grossMarginPct),
    dailyRunningCost: runningCost,
    grossProfit,
    stockRestockCost,
    retainedCashPerDay,
  };
}

/**
 * Build 60-day discrete timeline dues using the unified getDueEvents function.
 * Reads ONLY from Fixed Expenses and Payables collections with real due dates.
 * Skips dues marked "Paid for <month>".
 */
export function buildTimelineDues({
  fixedExpensesList = [],
  upcomingExpensesList = [],
  horizonDays = 60,
  startDate = new Date(),
}) {
  const result = getDueEvents({
    fixedExpenses: fixedExpensesList,
    upcomingExpenses: upcomingExpensesList,
    horizonDays,
    startDate,
  });

  return result.eventsByDayIndex || {};
}

/**
 * Build timeline expected receivables from eKhata customer credits.
 * Expected money is kept separate from received cash in hand, weighted by reliability.
 */
/**
 * Build timeline expected receivables from eKhata customer credits.
 * Expected money is kept separate from received cash in hand, weighted by reliability.
 * Expected receipt dates NEVER precede the due date (Requirement 6).
 */
export function buildTimelineReceivables({
  eKhataCustomersList = [],
  horizonDays = 60,
  startDate = new Date(),
}) {
  const recvByDay = {}; // dayIndex -> total expected on that day
  const recvDetailsByDay = {}; // dayIndex -> array of { name, amount, dueDate }
  const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  let totalUdhar = 0;
  const undatedList = [];

  for (const c of eKhataCustomersList || []) {
    const amt = Number(c.totalAmount || 0);
    if (amt <= 0) continue;
    totalUdhar += amt;

    const dueStr = (c.dueDate || '').trim();
    const avgDelay = Number(c.avgDelayDays ?? c.delayDays ?? 0);
    let scheduledDay = null;

    const parsedDue = parseKhataDueDate(dueStr, today);
    if (parsedDue) {
      const expDateStr = calculateExpectedKhataDate(dueStr, avgDelay, today);
      const [y, m, d] = expDateStr.split('-').map(Number);
      const expDateObj = new Date(y, m - 1, d);
      const diffMs = expDateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      // Never before due date! (diffDays >= 0)
      scheduledDay = Math.max(1, diffDays);
    }

    if (scheduledDay !== null && scheduledDay <= horizonDays) {
      recvByDay[scheduledDay] = (recvByDay[scheduledDay] || 0) + amt;
      if (!recvDetailsByDay[scheduledDay]) recvDetailsByDay[scheduledDay] = [];
      recvDetailsByDay[scheduledDay].push({
        name: c.name || 'Customer',
        amount: amt,
        dueDate: dueStr,
      });
    } else if (scheduledDay === null) {
      undatedList.push({ name: c.name || 'Customer', amount: amt });
    }
  }

  // For undated customer udhar, spread expected recovery across a 15-day curve (day 3, 7, 11, 15)
  const undatedTotal = undatedList.reduce((s, a) => s + a.amount, 0);
  if (undatedTotal > 0) {
    const spreadDays = [3, 7, 11, 15];
    const portion = Math.round(undatedTotal / spreadDays.length);
    spreadDays.forEach((d) => {
      recvByDay[d] = (recvByDay[d] || 0) + portion;
      if (!recvDetailsByDay[d]) recvDetailsByDay[d] = [];
      recvDetailsByDay[d].push({
        name: 'Undated Credit (Spread)',
        amount: portion,
        dueDate: 'On-Demand',
      });
    });
  }

  return { recvByDay, recvDetailsByDay, totalUdhar };
}

/**
 * Main Timeline Cash-Flow Engine (Requirements 1, 2, 3, 4, 6, 7)
 * Computes projected balance for every day d = 1..60:
 * balance[d] = balance[d-1] - dues[d] + retained[d] + khata_in[d]
 *
 * Single timeline function for both modes:
 * The toggle only swaps today's retained (actual vs expected).
 * All future days are identical in both modes.
 *
 * free_cash = opening + sum(retained since opening_date)
 * free_cash today = opening + actual_retained_today
 * expected_mode_start = opening + expected_retained_today
 */
export function calculateTimelineCashflow({
  openingReceivedCash = 40000,
  todayReceivedSales = 8000,
  grossMarginPct = 20,
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
  ownerTargetDailySales = 8000,
  openingDate = '2026-10-01',
}) {
  const marginFraction = Number(grossMarginPct || 0) / 100;
  const runningCost = Number(dailyRunningCost || 0);

  // 1. Calculate Baseline Daily Sales (Requirement 4: median of last 7 trading days, fallback ownerTarget, cap 2x median)
  const baselineSales = calculateBaselineSales({
    salesHistory,
    ownerTargetDailySales: Number(ownerTargetDailySales || 8000),
    todayDateStr: new Date(startDate).toISOString().split('T')[0],
  });

  // 2. Retained cash today (Actual vs Expected)
  // retained[d] = cash_upi_received[d] - gross_sales[d] * (1 - margin) - running_cost
  const actualRetainedResult = calculateRetainedCashPerDay({
    receivedCashSales: todayReceivedSales,
    grossMarginPct,
    dailyRunningCost: runningCost,
  });
  const actualRetainedToday = actualRetainedResult.retainedCashPerDay;
  const actualGrossProfitToday = actualRetainedResult.grossProfit;

  // Expected baseline today
  const expectedRetainedResult = calculateRetainedCashPerDay({
    receivedCashSales: baselineSales,
    grossMarginPct,
    dailyRunningCost: runningCost,
  });
  const expectedRetainedToday = expectedRetainedResult.retainedCashPerDay;
  const expectedGrossProfitToday = expectedRetainedResult.grossProfit;

  // 3. Free cash reserves (Requirement 2):
  // free_cash = opening + sum(retained since opening_date)
  const freeCashToday = Number(openingReceivedCash || 0) + actualRetainedToday;
  const expectedModeStart = Number(openingReceivedCash || 0) + expectedRetainedToday;

  // Till / bank total (informational only):
  const tillBankTotal = Number(openingReceivedCash || 0) + Number(todayReceivedSales || 0);

  // 4. Build discrete dues and expected receivables
  const duesByDay = buildTimelineDues({
    fixedExpensesList,
    upcomingExpensesList,
    horizonDays,
    startDate,
  });

  const { recvByDay = {}, recvDetailsByDay = {}, totalUdhar = 0 } = buildTimelineReceivables({
    eKhataCustomersList,
    horizonDays,
    startDate,
  });

  // 5. One timeline function for both modes:
  // balance[d] = balance[d-1] - dues[d] + retained[d] + khata_in[d]
  // All future days are identical in both modes!
  let currentRealityBalance = freeCashToday;
  let currentExpectedBalance = expectedModeStart;
  let currentLowBalance = expectedModeStart;
  let currentHighBalance = expectedModeStart;

  let cumRetainedFuture = 0;
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
  let minBalance = expectedModeStart;
  let minBalanceDay = 0;

  const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  let prevDaySales = todayReceivedSales > 0 ? todayReceivedSales : baselineSales;
  let prevDayGrossProfit = Math.round(prevDaySales * marginFraction);

  for (let d = 1; d <= horizonDays; d++) {
    const dDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
    const dateStr = toLocalDateString(dDate);

    // Day-of-week baseline sales from shop history (fallback to baselineSales, NOT hardcoded 8000)
    const dayBaselineSales = getBaselineSalesForDate(dDate, salesHistory, baselineSales);

    // Multipliers for date (bounded [0.6, 1.6], overlap capped at 1.8)
    const { low: multLow, base: multBase, high: multHigh, activeEvents, isAdjusted } =
      getMultipliersForDate(dateStr, contextAdjustments, isFestivalAdjustmentOn);

    // Future day sales (identical in both modes)
    const adjSalesBase = Math.round(dayBaselineSales * multBase);
    const adjSalesLow = Math.round(dayBaselineSales * multLow);
    const adjSalesHigh = Math.round(dayBaselineSales * multHigh);

    // Daily gross profit on this forecast day
    const dailyGrossProfit = Math.round(adjSalesBase * marginFraction);
    const baselineGrossProfit = Math.round(dayBaselineSales * marginFraction);

    // Percentage change in gross profit compared to the previous day (last day):
    let grossProfitChangePct = 0;
    if (prevDayGrossProfit > 0) {
      grossProfitChangePct = Math.round(((dailyGrossProfit - prevDayGrossProfit) / prevDayGrossProfit) * 1000) / 10;
    }
    const grossProfitDiff = dailyGrossProfit - prevDayGrossProfit;
    const grossProfitVsBaselinePct = baselineGrossProfit > 0
      ? Math.round(((dailyGrossProfit - baselineGrossProfit) / baselineGrossProfit) * 1000) / 10
      : 0;

    // Future retained cash:
    // retained[d] = adj_sales * margin - running_cost
    const retainedBase = Math.round(adjSalesBase * marginFraction) - runningCost;
    const retainedLow = Math.round(adjSalesLow * marginFraction) - runningCost;
    const retainedHigh = Math.round(adjSalesHigh * marginFraction) - runningCost;

    cumRetainedFuture += retainedBase;
    cumRetainedLow += retainedLow;
    cumRetainedHigh += retainedHigh;

    // eKhata expected collections weighted by scenario
    const dayRecv = recvByDay[d] || 0;
    const dayRecvDetails = recvDetailsByDay[d] || [];
    const dayRecvBase = Math.round(dayRecv * 0.8);
    const dayRecvLow = Math.round(dayRecv * 0.4);
    const dayRecvHigh = Math.round(dayRecv * 1.0);
    cumRecvBase += dayRecvBase;
    cumRecvLow += dayRecvLow;
    cumRecvHigh += dayRecvHigh;

    // Merge multiple dues on the same date into one list
    const dayDues = duesByDay[d] || [];
    const dayDuesTotal = dayDues.reduce((s, item) => s + item.amount, 0);
    cumDues += dayDuesTotal;

    // Deduct dues first on that date, then add retained cash and khata collections
    const realityBeforeDues = currentRealityBalance;
    const expectedBeforeDues = currentExpectedBalance;
    const lowBeforeDues = currentLowBalance;
    const highBeforeDues = currentHighBalance;

    const realityAfterDues = realityBeforeDues - dayDuesTotal;
    const expectedAfterDues = expectedBeforeDues - dayDuesTotal;
    const lowAfterDues = lowBeforeDues - dayDuesTotal;
    const highAfterDues = highBeforeDues - dayDuesTotal;

    // Add future retained cash and khata collections (IDENTICAL for reality and expected)
    const realityEnd = realityAfterDues + retainedBase + dayRecvBase;
    const expectedEnd = expectedAfterDues + retainedBase + dayRecvBase;
    const lowEnd = lowAfterDues + retainedLow + dayRecvLow;
    const highEnd = highAfterDues + retainedHigh + dayRecvHigh;

    currentRealityBalance = realityEnd;
    currentExpectedBalance = expectedEnd;
    currentLowBalance = lowEnd;
    currentHighBalance = highEnd;

    // Attach expected retained cash before this due date to each due item
    dayDues.forEach((due) => {
      due.expectedRetainedBeforeDue = {
        base: cumRetainedFuture,
        low: cumRetainedLow,
        high: cumRetainedHigh,
      };
    });

    const dayLowest = Math.min(expectedAfterDues, expectedEnd);
    if (dayLowest < minBalance) {
      minBalance = dayLowest;
      minBalanceDay = d;
    }

    const isBelowBuffer = expectedAfterDues < safetyBuffer || expectedEnd < safetyBuffer;
    const isDeficit = expectedAfterDues < 0 || expectedEnd < 0;
    const shortfall = Math.max(0, safetyBuffer - dayLowest);

    if (isBelowBuffer && !firstRisk) {
      const primaryDue = dayDues.length > 1
        ? `${dayDues[0].title} (+${dayDues.length - 1} more)`
        : (dayDues[0]?.title || 'Scheduled Obligations');

      firstRisk = {
        day: d,
        date: dateStr,
        balance: expectedAfterDues,
        balanceAfterDues: expectedAfterDues,
        balanceBeforeDues: expectedBeforeDues,
        shortfall,
        isDeficit,
        dayDuesTotal,
        primaryDue,
        duesCount: dayDues.length,
      };
    }

    if ((lowAfterDues < safetyBuffer || lowEnd < safetyBuffer) && !firstLowRisk) {
      firstLowRisk = {
        day: d,
        balance: Math.min(lowAfterDues, lowEnd),
      };
    }

    const hasDues = dayDuesTotal > 0;
    const hasKhata = dayRecv > 0;
    const markerColor = hasDues
      ? (expectedAfterDues < safetyBuffer ? 'red' : 'yellow')
      : (hasKhata ? 'green' : null);

    const point = {
      day: d,
      date: dateStr,
      baselineSales: dayBaselineSales,
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
      cumRetainedBase: cumRetainedFuture,
      cumRetainedLow,
      cumRetainedHigh,
      cumRecv: cumRecvBase,
      dayRecv,
      dayRecvBase,
      dayRecvDetails,
      dayDues,
      dayDuesTotal,
      cumDues,
      // Reality balances (starts at freeCashToday)
      realityBalanceBeforeDues: realityBeforeDues,
      realityBalanceAfterDues: realityAfterDues,
      realityBalance: realityEnd,
      // Expected balances (starts at expectedModeStart)
      expectedBalanceBeforeDues: expectedBeforeDues,
      expectedBalanceAfterDues: expectedAfterDues,
      expectedBalance: expectedEnd,
      balanceBeforeDues: realityBeforeDues,
      balanceAfterDues: realityAfterDues,
      balance: realityEnd,
      // Corridors
      balanceLowBeforeDues: lowBeforeDues,
      balanceLowAfterDues: lowAfterDues,
      balanceLow: lowEnd,
      balanceHighBeforeDues: highBeforeDues,
      balanceHighAfterDues: highAfterDues,
      balanceHigh: highEnd,
      expectedSales: adjSalesBase,
      expectedRetainedCash: retainedBase,
      // Invariant: realityEnd - expectedEnd === freeCashToday - expectedModeStart
      variance: realityEnd - expectedEnd,
      isBelowBuffer,
      isDeficit,
      hasDues,
      hasKhata,
      markerColor,
      // Gross Profit on this day and change from last day
      dailyGrossProfit,
      prevDayGrossProfit,
      prevDaySales,
      baselineGrossProfit,
      grossProfitChangePct,
      grossProfitDiff,
      grossProfitVsBaselinePct,
    };

    // Advance previous day values for next day's day-over-day calculation
    prevDaySales = adjSalesBase;
    prevDayGrossProfit = dailyGrossProfit;

    timeline.push(point);
    lowScenarioTimeline.push({
      ...point,
      balanceBeforeDues: lowBeforeDues,
      balanceAfterDues: lowAfterDues,
      balance: lowEnd,
      isBelowBuffer: lowAfterDues < safetyBuffer || lowEnd < safetyBuffer,
      isDeficit: lowAfterDues < 0 || lowEnd < 0,
    });
  }

  // 6. Determine Overall Status Badge
  // RISK if expected balance < buffer on any date, WATCH if only low line is, else SAFE.
  let status = 'SAFE';
  if (firstRisk) {
    status = 'RISK';
  } else if (firstLowRisk) {
    status = 'WATCH';
  } else {
    status = 'SAFE';
  }

  // 7. Next Risk Date & Headline Metrics
  let nextRiskDateFormatted = null;
  let nextRiskDays = null;
  let headlineMetric = '';
  let headlineLabel = '';

  if (firstRisk) {
    nextRiskDays = firstRisk.day;
    const riskDateObj = new Date(today);
    riskDateObj.setDate(today.getDate() + nextRiskDays);
    nextRiskDateFormatted = riskDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    headlineLabel = 'Next Risk Date';
    headlineMetric = `${nextRiskDateFormatted} (in ${nextRiskDays}d)`;
  } else if (firstLowRisk) {
    const lowRiskDateObj = new Date(today);
    lowRiskDateObj.setDate(today.getDate() + firstLowRisk.day);
    const lowDateFormatted = lowRiskDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    headlineLabel = 'Downside Risk Watch';
    headlineMetric = `${lowDateFormatted} (in ${firstLowRisk.day}d)`;
  } else if (actualRetainedToday < 0) {
    const runwayDay = timeline.findIndex((t) => t.expectedBalance <= 0);
    const daysLeft = runwayDay !== -1 ? runwayDay + 1 : horizonDays;
    headlineLabel = 'Estimated Cash Runway';
    headlineMetric = `${daysLeft} Days`;
  } else {
    headlineLabel = 'Shortfall Horizon';
    headlineMetric = 'No Shortfall in 60 Days';
  }

  // Calculate 15-day upcoming total for informational display
  let duesWithin15Days = 0;
  for (let d = 1; d <= 15; d++) {
    const list = duesByDay[d] || [];
    duesWithin15Days += list.reduce((s, i) => s + i.amount, 0);
  }

  return {
    // Free Cash & Baseline
    freeCashToday,
    expectedModeStart,
    tillBankTotal,
    baselineSales,

    // Core Retained Cash Metrics
    grossSales: actualRetainedResult.grossSales,
    grossMarginPct: Number(grossMarginPct),
    dailyRunningCost: runningCost,
    retainedCashPerDay: actualRetainedToday,
    stockRestockCost: actualRetainedResult.stockRestockCost,
    grossProfit: actualGrossProfitToday,

    // Separation of Free Cash vs Expected Receivables
    receivedCashInHand: freeCashToday,
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

    // Expected vs Reality comparison values
    actualTodaySales: Number(todayReceivedSales || 0),
    expectedTodaySales: baselineSales,
    actualGrossProfit: actualGrossProfitToday,
    expectedGrossProfit: expectedGrossProfitToday,
    actualRetainedCash: actualRetainedToday,
    expectedRetainedCash: expectedRetainedToday,
    actualCashInHand: freeCashToday,
    expectedCashInHand: expectedModeStart,
    salesVariance: Number(todayReceivedSales || 0) - baselineSales,
    cashVariance: freeCashToday - expectedModeStart,
  };
}

/**
 * Adapter function to maintain backward-compatibility with components
 * while strictly implementing the unified retained cash & timeline logic.
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
    openingDate: settings.openingDate,
    todayReceivedSales: totalTodayReceivedSales,
    grossMarginPct: settings.grossMarginPct,
    dailyRunningCost: settings.dailyRunningCost,
    safetyBuffer: settings.safetyBuffer,
    ownerTargetDailySales: settings.ownerTargetDailySales,
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
    // Free Cash & Till Informational
    freeCashToday: timelineResult.freeCashToday,
    expectedModeStart: timelineResult.expectedModeStart,
    tillBankTotal: timelineResult.tillBankTotal,
    baselineSales: timelineResult.baselineSales,

    // RETAINED CASH values
    liquidCashAvailable: timelineResult.freeCashToday,
    receivedCashInHand: timelineResult.freeCashToday,
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

    // Expected vs Reality comparisons
    actualTodaySales: timelineResult.actualTodaySales,
    expectedTodaySales: timelineResult.expectedTodaySales,
    actualGrossProfit: timelineResult.actualGrossProfit,
    expectedGrossProfit: timelineResult.expectedGrossProfit,
    actualRetainedCash: timelineResult.actualRetainedCash,
    expectedRetainedCash: timelineResult.expectedRetainedCash,
    actualCashInHand: timelineResult.freeCashToday,
    expectedCashInHand: timelineResult.expectedModeStart,
    salesVariance: timelineResult.salesVariance,
    cashVariance: timelineResult.cashVariance,
  };
}
