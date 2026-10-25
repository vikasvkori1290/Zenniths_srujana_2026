/**
 * Stock-Reserve & Auto-Scheduled Restock Engine
 *
 * Domain Logic:
 * In SMB working capital, customer udhar (Khata) collections of K have two parts:
 *   1. Gross Profit = K * margin
 *   2. Stock Replacement Reserve = K * (1 - margin)
 *
 * When K is used to cover a scheduled due D on date T that would otherwise push
 * the balance below the safety buffer, the business is borrowing from its stock reserve.
 * To prevent inventory stockouts, FinSafe auto-schedules a one-time restock payable.
 */

import { toLocalDateString } from './predictiveAnalytics.js';

export const DEFAULT_STOCK_RESERVE_SETTINGS = {
  khataStockCostDeductedAtSale: false, // Default: No (stock cost not yet deducted)
  restockWindowDays: 21,               // Default window: [T + 3, T + 21]
};

/**
 * Retrieve saved stock reserve settings from localStorage or defaults
 */
export function getStoredStockReserveSettings() {
  if (typeof window === 'undefined') return DEFAULT_STOCK_RESERVE_SETTINGS;
  try {
    const saved = localStorage.getItem('aurum_stock_reserve_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        khataStockCostDeductedAtSale: Boolean(parsed.khataStockCostDeductedAtSale ?? false),
        restockWindowDays: Number(parsed.restockWindowDays || 21),
      };
    }
  } catch (e) {
    console.warn('Failed to parse aurum_stock_reserve_settings', e);
  }
  return DEFAULT_STOCK_RESERVE_SETTINGS;
}

/**
 * Save stock reserve settings to localStorage
 */
export function saveStockReserveSettings(settings) {
  if (typeof window === 'undefined') return settings;
  const merged = { ...getStoredStockReserveSettings(), ...settings };
  localStorage.setItem('aurum_stock_reserve_settings', JSON.stringify(merged));
  window.dispatchEvent(new Event('aurum_stock_reserve_updated'));
  window.dispatchEvent(new Event('storage'));
  return merged;
}

/**
 * Retrieve manual owner-customized restock overrides (date and/or amount)
 */
export function getStoredCustomRestock() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('aurum_custom_restock');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

/**
 * Save or clear manual owner-customized restock overrides
 */
export function saveCustomRestock(custom) {
  if (typeof window === 'undefined') return;
  if (!custom) {
    localStorage.removeItem('aurum_custom_restock');
  } else {
    localStorage.setItem('aurum_custom_restock', JSON.stringify(custom));
  }
  window.dispatchEvent(new Event('aurum_stock_reserve_updated'));
  window.dispatchEvent(new Event('aurum_expenses_updated'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Reset restock to auto-scheduled default
 */
export function clearCustomRestock() {
  saveCustomRestock(null);
}


/**
 * Evaluates whether a due on date T borrows from stock reserve money,
 * and if so, calculates amount and auto-schedules the restock in [T + 3, T + restockWindowDays].
 *
 * @param {Object} params
 *   - timeline: Array of base timeline points
 *   - grossMarginPct: number (e.g. 25 for 25%)
 *   - safetyBuffer: number (e.g. 1500)
 *   - khataStockCostDeductedAtSale: boolean (default false)
 *   - restockWindowDays: number (default 21)
 *   - customRestock: { day?: number, date?: string, amount?: number } (optional manual edit)
 *   - loanInterestMonthlyPct: number (default 1.5% per month)
 *   - startDate: Date | string
 */
export function evaluateStockReserveRestock({
  timeline = [],
  grossMarginPct = 25,
  safetyBuffer = 1500,
  khataStockCostDeductedAtSale = false,
  restockWindowDays = 21,
  customRestock = null,
  loanInterestMonthlyPct = 1.5,
  startDate = new Date(),
}) {
  // If setting "khata stock cost already deducted at sale" = Yes, schedule nothing
  if (khataStockCostDeductedAtSale) {
    return {
      triggered: false,
      reason: 'Setting "khata stock cost already deducted at sale" is Yes. No auto-restock needed.',
      triggerDue: null,
      restockAmount: 0,
      restockPlan: null,
      pathA: null,
      pathB: null,
      warning: null,
      homeCard: null,
      status: 'SAFE',
    };
  }

  if (!Array.isArray(timeline) || timeline.length === 0) {
    return {
      triggered: false,
      triggerDue: null,
      restockAmount: 0,
      restockPlan: null,
      pathA: null,
      pathB: null,
      warning: null,
      homeCard: null,
      status: 'SAFE',
    };
  }

  const marginFraction = Number(grossMarginPct || 0) / 100;
  const windowDays = Math.max(7, Number(restockWindowDays || 21));

  // 1. Identify triggering due D on date T
  // A khata collection of K (collected on C <= T) is used to cover a due D on date T
  // that would otherwise push the balance below the buffer.
  let cumKhata = 0;
  let cumDues = 0;
  let triggerInfo = null;

  for (let i = 0; i < timeline.length; i++) {
    const pt = timeline[i];
    const day = pt.day;
    // If stock cost was preserved at collection time (only profit margin was credited),
    // no stock money was borrowed, so do not count it towards auto-restock deduction.
    const dayKhata = pt.isKhataStockPreserved ? 0 : (pt.dayRecv ?? pt.dayRecvBase ?? 0);
    cumKhata += dayKhata;

    const dayDuesTotal = pt.dayDuesTotal ?? 0;
    if (dayDuesTotal > 0) {
      // Balance on day without khata receipts up to day i
      const currentExpected = pt.expectedBalanceAfterDues ?? pt.balanceAfterDues ?? 0;
      const balanceWithoutKhata = currentExpected - cumKhata;

      // Would it push balance below buffer without khata?
      if (balanceWithoutKhata < safetyBuffer && cumKhata > 0) {
        const shortageWithoutKhata = safetyBuffer - balanceWithoutKhata;
        const fundedByKhata = Math.min(cumKhata, Math.min(dayDuesTotal, shortageWithoutKhata));

        if (fundedByKhata > 0) {
          triggerInfo = {
            day,
            date: pt.date,
            dueAmount: dayDuesTotal,
            khataAvailable: cumKhata,
            fundedByKhata,
            primaryDueTitle: pt.dayDues?.[0]?.title || 'Scheduled Due',
          };
          break; // One auto-restock per triggering due
        }
      }
    }
  }

  if (!triggerInfo) {
    return {
      triggered: false,
      triggerDue: null,
      restockAmount: 0,
      restockPlan: null,
      pathA: null,
      pathB: null,
      warning: null,
      homeCard: null,
      status: 'SAFE',
    };
  }

  // 2. AMOUNT: restock = min(K * (1 - margin), part of D funded by K)
  const K = triggerInfo.khataAvailable;
  const partOfDFunded = triggerInfo.fundedByKhata;
  const stockReplacementPart = Math.round(K * (1 - marginFraction));
  const rawRestockAmount = Math.min(stockReplacementPart, partOfDFunded);
  const restockAmount = customRestock?.amount ? Number(customRestock.amount) : rawRestockAmount;

  // Window = [T + 3 days, T + restockWindowDays]
  const windowStartDay = triggerInfo.day + 3;
  const windowEndDay = Math.min(timeline.length, triggerInfo.day + windowDays);
  // Auto one-month scheduling horizon for instalments
  const splitWindowEndDay = Math.min(timeline.length, Math.max(triggerInfo.day + 30, windowEndDay));

  // Helper: check if deducting an amount on specified days keeps balance >= buffer for all later days
  // deductions: [{ day, amount }]
  const testDeductionPlan = (deductions) => {
    let minLater = Infinity;
    let minLaterDay = -1;
    let minLaterDate = '';
    let firstShortageDay = null;

    const minDeductionDay = Math.min(...deductions.map((d) => d.day));

    for (let i = 0; i < timeline.length; i++) {
      const pt = timeline[i];
      if (pt.day < minDeductionDay) continue;

      let totalDeductionsUpToPt = 0;
      for (const d of deductions) {
        if (pt.day >= d.day) {
          totalDeductionsUpToPt += d.amount;
        }
      }

      const baseBal = pt.expectedBalanceAfterDues ?? pt.balanceAfterDues ?? 0;
      const simBal = baseBal - totalDeductionsUpToPt;

      if (simBal < minLater) {
        minLater = simBal;
        minLaterDay = pt.day;
        minLaterDate = pt.date;
      }

      if (simBal < safetyBuffer && !firstShortageDay) {
        firstShortageDay = pt.day;
      }
    }

    const passes = minLater >= safetyBuffer;
    return {
      passes,
      minLater: minLater === Infinity ? 0 : minLater,
      minLaterDay,
      minLaterDate,
      firstShortageDay,
      gap: Math.max(0, safetyBuffer - (minLater === Infinity ? 0 : minLater)),
    };
  };

  // 3. SCHEDULING (auto, one month only)
  let plan = null;

  // If owner manually customized the date/amount, evaluate that specific choice:
  let warningMessage = null;
  if (customRestock && (customRestock.day || customRestock.date)) {
    const foundIdx = customRestock.date ? timeline.findIndex((p) => p.date === customRestock.date) : -1;
    const customDay = customRestock.day || (foundIdx >= 0 ? foundIdx + 1 : triggerInfo.day + 3);
    const targetDate = customRestock.date || timeline[customDay - 1]?.date || '';
    const customTest = testDeductionPlan([{ day: customDay, amount: restockAmount }]);

    if (!customTest.passes) {
      warningMessage = `Warning: Scheduling restock on ${targetDate} pushes balance to ₹${customTest.minLater.toLocaleString()} (breaching the ₹${safetyBuffer.toLocaleString()} buffer by ₹${customTest.gap.toLocaleString()} on ${customTest.minLaterDate}).`;
    }

    plan = {
      type: 'custom',
      isSplit: false,
      splitCount: 1,
      instalments: [{ day: customDay, date: targetDate, amount: restockAmount }],
      earliestDay: customDay,
      earliestDate: targetDate,
      passes: customTest.passes,
      status: customTest.passes ? 'WATCH' : 'RISK',
      gap: customTest.gap,
      minLaterBalance: customTest.minLater,
      minLaterDate: customTest.minLaterDate,
    };
  } else {
    // Step 2: Single Day earliest in [T + 3, T + window]
    for (let d = windowStartDay; d <= windowEndDay; d++) {
      const res = testDeductionPlan([{ day: d, amount: restockAmount }]);
      if (res.passes) {
        const pt = timeline[d - 1];
        plan = {
          type: 'single',
          isSplit: false,
          splitCount: 1,
          instalments: [{ day: d, date: pt?.date || '', amount: restockAmount }],
          earliestDay: d,
          earliestDate: pt?.date || '',
          passes: true,
          status: 'WATCH',
          gap: 0,
          minLaterBalance: res.minLater,
          minLaterDate: res.minLaterDate,
        };
        break;
      }
    }

    // Step 3a: Split restock into 2 equal instalments on separate days across month
    if (!plan) {
      const half1 = Math.round(restockAmount / 2);
      const half2 = restockAmount - half1;

      for (let d1 = windowStartDay; d1 < splitWindowEndDay; d1++) {
        for (let d2 = d1 + 1; d2 <= splitWindowEndDay; d2++) {
          const res = testDeductionPlan([
            { day: d1, amount: half1 },
            { day: d2, amount: half2 },
          ]);
          if (res.passes) {
            const pt1 = timeline[d1 - 1];
            const pt2 = timeline[d2 - 1];
            plan = {
              type: 'split-2',
              isSplit: true,
              splitCount: 2,
              instalments: [
                { day: d1, date: pt1?.date || '', amount: half1 },
                { day: d2, date: pt2?.date || '', amount: half2 },
              ],
              earliestDay: d1,
              earliestDate: pt1?.date || '',
              passes: true,
              status: 'WATCH',
              gap: 0,
              minLaterBalance: res.minLater,
              minLaterDate: res.minLaterDate,
            };
            break;
          }
        }
        if (plan) break;
      }
    }

    // Step 3b: Split restock into 3 equal instalments on separate days across month
    if (!plan) {
      const third1 = Math.floor(restockAmount / 3);
      const third2 = Math.floor(restockAmount / 3);
      const third3 = restockAmount - third1 - third2;

      for (let d1 = windowStartDay; d1 < splitWindowEndDay - 1; d1++) {
        for (let d2 = d1 + 1; d2 < splitWindowEndDay; d2++) {
          for (let d3 = d2 + 1; d3 <= splitWindowEndDay; d3++) {
            const res = testDeductionPlan([
              { day: d1, amount: third1 },
              { day: d2, amount: third2 },
              { day: d3, amount: third3 },
            ]);
            if (res.passes) {
              const pt1 = timeline[d1 - 1];
              const pt2 = timeline[d2 - 1];
              const pt3 = timeline[d3 - 1];
              plan = {
                type: 'split-3',
                isSplit: true,
                splitCount: 3,
                instalments: [
                  { day: d1, date: pt1?.date || '', amount: third1 },
                  { day: d2, date: pt2?.date || '', amount: third2 },
                  { day: d3, date: pt3?.date || '', amount: third3 },
                ],
                earliestDay: d1,
                earliestDate: pt1?.date || '',
                passes: true,
                status: 'WATCH',
                gap: 0,
                minLaterBalance: res.minLater,
                minLaterDate: res.minLaterDate,
              };
              break;
            }
          }
          if (plan) break;
        }
        if (plan) break;
      }
    }

    // Step 4: If still none passes, schedule on day with HIGHEST minimum later balance, mark RISK
    if (!plan) {
      let bestDay = windowStartDay;
      let highestMinBalance = -Infinity;
      let bestRes = null;

      for (let d = windowStartDay; d <= windowEndDay; d++) {
        const res = testDeductionPlan([{ day: d, amount: restockAmount }]);
        if (res.minLater > highestMinBalance) {
          highestMinBalance = res.minLater;
          bestDay = d;
          bestRes = res;
        }
      }

      const bestPt = timeline[bestDay - 1];
      plan = {
        type: 'fallback',
        isSplit: false,
        splitCount: 1,
        instalments: [{ day: bestDay, date: bestPt?.date || '', amount: restockAmount }],
        earliestDay: bestDay,
        earliestDate: bestPt?.date || '',
        passes: false,
        status: 'RISK',
        gap: bestRes?.gap ?? Math.max(0, safetyBuffer - highestMinBalance),
        minLaterBalance: highestMinBalance,
        minLaterDate: bestRes?.minLaterDate || bestPt?.date || '',
      };
    }
  }

  // 4. Comparison Panel: Path A vs Path B Options
  // Path A: Use Khata cash, restock auto-scheduled
  const pathA = {
    title: 'Path A: Use Khata Cash (Auto-Restock)',
    action: 'Cover due from Khata, auto-schedule restock',
    restockAmount,
    restockDate: plan.earliestDate,
    instalments: plan.instalments,
    extraCost: 0,
    lowestBalance: plan.minLaterBalance,
    lowestBalanceDate: plan.minLaterDate,
    firstDateBelowBuffer: plan.passes ? 'None (Protected)' : plan.minLaterDate,
    gap: plan.gap,
    status: plan.status,
    recommendation: plan.passes
      ? 'Recommended: Zero borrowing cost. Khata cash covers the due, and restock is scheduled within cash reserves.'
      : 'Shortage detected: Restock creates cash deficit without mitigation.',
  };

  // Path B: Arrange elsewhere (preserve stock cash immediately)
  // Options:
  // (i) Short-term loan of due amount / gap at owner-editable interest rate
  const loanDays = Math.max(15, windowDays);
  const monthlyRate = Number(loanInterestMonthlyPct || 1.5) / 100;
  const loanInterestCost = Math.round(partOfDFunded * monthlyRate * (loanDays / 30));

  const pathBOptions = [
    {
      id: 'path-b-loan',
      name: 'Short-Term Working Capital Loan',
      description: `Borrow ₹${partOfDFunded.toLocaleString()} for ${loanDays} days at ${(monthlyRate * 100).toFixed(1)}%/mo`,
      extraCost: loanInterestCost,
      clearsShortage: true,
      lowestBalance: safetyBuffer + 500,
      lowestBalanceDate: triggerInfo.date,
      firstDateBelowBuffer: 'None',
      recommendedOrder: 2,
    },
    {
      id: 'path-b-delay-supplier',
      name: 'Delay Supplier Due by 14 Days',
      description: `Negotiate shifting ₹${partOfDFunded.toLocaleString()} due date by 14 days`,
      extraCost: 0,
      clearsShortage: true,
      lowestBalance: safetyBuffer + 1000,
      lowestBalanceDate: triggerInfo.date,
      firstDateBelowBuffer: 'None',
      recommendedOrder: 1,
    },
    {
      id: 'path-b-owner-cash',
      name: 'Owner Injects Working Capital',
      description: `Deposit ₹${partOfDFunded.toLocaleString()} personal cash into store till`,
      extraCost: 0,
      clearsShortage: true,
      lowestBalance: safetyBuffer + partOfDFunded,
      lowestBalanceDate: triggerInfo.date,
      firstDateBelowBuffer: 'None',
      recommendedOrder: 3,
    },
  ];

  const pathB = {
    title: 'Path B: Arrange Outside Funding',
    dueFunded: partOfDFunded,
    options: pathBOptions,
    bestOption: pathBOptions[1], // Delay supplier or lowest cost
  };

  // Determine overall status:
  // SAFE: if no breach
  // WATCH: if Path A was needed and restock fits
  // RISK: if any path still breaches buffer
  const finalStatus = plan.passes ? 'WATCH' : 'RISK';

  // 5. Card on Home data
  const homeCard = {
    title: `Stock money borrowed: ₹${restockAmount.toLocaleString()}`,
    subtitle: plan.isSplit
      ? `Restock auto-scheduled in ${plan.splitCount} instalments starting ${plan.earliestDate}`
      : `Restock scheduled for ${plan.earliestDate}`,
    amount: restockAmount,
    scheduledDate: plan.earliestDate,
    instalments: plan.instalments,
    triggerDue: triggerInfo,
    gap: plan.gap,
    status: finalStatus,
  };

  return {
    triggered: true,
    triggerDue: triggerInfo,
    restockAmount,
    restockPlan: plan,
    pathA,
    pathB,
    warning: warningMessage,
    homeCard,
    status: finalStatus,
  };
}
