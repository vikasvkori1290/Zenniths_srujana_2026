import {
  calculateTimelineCashflow,
  toLocalDateString,
  calculateExpectedKhataDate,
  parseKhataDueDate,
} from './predictiveAnalytics.js';

/**
 * Universal Scenario Simulator Engine
 * Modifies baseline inputs ONLY and re-runs the existing calculateTimelineCashflow engine.
 * No separate formulas or duplicate math.
 */

/**
 * Runs the scenario simulation against the base inputs.
 *
 * @param {Object} baseParams - Standard inputs passed to calculateTimelineCashflow
 * @param {Object} controls - Scenario modification parameters:
 *   - khataDelayDays: number (0 - 30)
 *   - unexpectedExpense: { amount: number, date: string, title?: string }
 *   - salesDropPct: number (0 - 50)
 *   - dueModification: {
 *       dueId: string | number,
 *       action: 'none' | 'shift' | 'split',
 *       shiftDays?: number,
 *       newDate?: string,
 *       splitCount?: number
 *     }
 * @returns {Object} Simulation results including base & scenario timelines, gap, and status
 */
export function simulateScenarioTimeline(baseParams = {}, controls = {}) {
  const {
    khataDelayDays = 0,
    unexpectedExpense = { amount: 0, date: '' },
    salesDropPct = 0,
    dueModification = { action: 'none' },
  } = controls;

  const horizonDays = Number(baseParams.horizonDays || 60);
  const startDate = baseParams.startDate ? new Date(baseParams.startDate) : new Date();
  const safetyBuffer = Number(baseParams.safetyBuffer || 1500);

  // 1. Run Baseline Timeline (Unmodified inputs)
  const baseResult = calculateTimelineCashflow({
    ...baseParams,
    horizonDays,
    startDate,
    safetyBuffer,
  });

  // If all controls are at zero / inactive, return identical baseline with SAFE status
  const isAllZero =
    Number(khataDelayDays || 0) === 0 &&
    Number(unexpectedExpense?.amount || 0) <= 0 &&
    Number(salesDropPct || 0) === 0 &&
    (!dueModification || dueModification.action === 'none');

  if (isAllZero) {
    let minBal = baseResult.minProjectedBalance;
    let minDay = 1;
    let minDate = '';
    let firstShortagePoint = null;

    if (baseResult.timeline?.length > 0) {
      minBal = baseResult.timeline[0].expectedBalanceAfterDues ?? baseResult.timeline[0].balanceAfterDues;
      minDay = baseResult.timeline[0].day;
      minDate = baseResult.timeline[0].date;

      for (const p of baseResult.timeline) {
        const afterDues = p.expectedBalanceAfterDues ?? p.balanceAfterDues;
        if (afterDues < safetyBuffer && !firstShortagePoint) {
          firstShortagePoint = {
            day: p.day,
            date: p.date,
            balance: afterDues,
            shortfall: safetyBuffer - afterDues,
            isDeficit: afterDues < 0,
          };
        }
        if (afterDues < minBal) {
          minBal = afterDues;
          minDay = p.day;
          minDate = p.date;
        }
      }
    }

    const gap = Math.max(0, safetyBuffer - minBal);
    const status = minBal < 0 || (firstShortagePoint && firstShortagePoint.isDeficit)
      ? 'RISK'
      : (gap > 0 ? 'WATCH' : 'SAFE');

    return {
      baseResult,
      scenarioResult: baseResult,
      status,
      gap,
      minBalance: minBal,
      minBalanceDate: minDate || 'N/A',
      minBalanceDay: minDay || 0,
      firstShortageDate: firstShortagePoint ? `${firstShortagePoint.date} (Day +${firstShortagePoint.day})` : 'None (Above Buffer)',
      firstShortagePoint,
      safetyBuffer,
      controls,
    };
  }

  // 2. Prepare Modified Inputs for Scenario

  // (a) Khata payments delayed by N days (0-30)
  const modifiedKhataList = (baseParams.eKhataCustomersList || []).map((c) => {
    const origDelay = Number(c.avgDelayDays ?? c.delayDays ?? 0);
    return {
      ...c,
      avgDelayDays: origDelay + Number(khataDelayDays || 0),
    };
  });

  // (b) One-off unexpected expense (amount, date)
  let modifiedUpcomingList = [...(baseParams.upcomingExpensesList || [])];
  let modifiedFixedList = [...(baseParams.fixedExpensesList || [])];

  if (Number(unexpectedExpense?.amount || 0) > 0 && unexpectedExpense?.date) {
    modifiedUpcomingList.push({
      id: 'unexpected_oneoff_' + unexpectedExpense.date,
      title: unexpectedExpense.title || 'Unexpected Expense',
      amount: Number(unexpectedExpense.amount),
      dueDate: unexpectedExpense.date,
      isOneOff: true,
      category: 'Unexpected Expense',
    });
  }

  // (d) Shift a selected payable/fixed due to a new date or split into 2-3 instalments
  if (dueModification && dueModification.action && dueModification.action !== 'none' && dueModification.dueId) {
    const targetIdStr = String(dueModification.dueId);

    // Check if target is in upcomingExpenses
    const upIdx = modifiedUpcomingList.findIndex((u) => String(u.id ?? u._id) === targetIdStr);
    if (upIdx >= 0) {
      const targetItem = modifiedUpcomingList[upIdx];
      if (dueModification.action === 'shift') {
        let shiftedDate = dueModification.newDate;
        if (!shiftedDate && dueModification.shiftDays) {
          const origDateObj = new Date(targetItem.dueDate || startDate);
          origDateObj.setDate(origDateObj.getDate() + Number(dueModification.shiftDays));
          shiftedDate = toLocalDateString(origDateObj);
        }
        modifiedUpcomingList[upIdx] = {
          ...targetItem,
          dueDate: shiftedDate || targetItem.dueDate,
        };
      } else if (dueModification.action === 'split') {
        const count = Math.min(3, Math.max(2, Number(dueModification.splitCount || 2)));
        const total = Number(targetItem.amount || 0);
        const splitAmount = Math.round(total / count);
        const origDateObj = new Date(targetItem.dueDate || startDate);

        const newParts = [];
        let remaining = total;
        for (let i = 0; i < count; i++) {
          const instalmentAmt = i === count - 1 ? remaining : splitAmount;
          remaining -= instalmentAmt;
          const partDate = new Date(origDateObj.getFullYear(), origDateObj.getMonth(), origDateObj.getDate() + i * 15);
          newParts.push({
            ...targetItem,
            id: `${targetItem.id}_part_${i + 1}`,
            title: `${targetItem.title || 'Payable'} (Instalment ${i + 1}/${count})`,
            amount: instalmentAmt,
            dueDate: toLocalDateString(partDate),
          });
        }
        modifiedUpcomingList.splice(upIdx, 1, ...newParts);
      }
    } else {
      // Check if target is in fixedExpenses
      const fxIdx = modifiedFixedList.findIndex((f) => String(f.id ?? f._id) === targetIdStr);
      if (fxIdx >= 0) {
        const targetFixed = modifiedFixedList[fxIdx];
        if (dueModification.action === 'shift') {
          // If shifting a fixed expense, override its dueDay or transform into upcoming
          const shiftDays = Number(dueModification.shiftDays || 15);
          const origDay = Number(targetFixed.dueDay || 1);
          modifiedFixedList[fxIdx] = {
            ...targetFixed,
            dueDay: ((origDay - 1 + shiftDays) % 28) + 1,
          };
        } else if (dueModification.action === 'split') {
          // Split fixed monthly expense into 2 instalments (e.g. day 5 and day 20)
          const origAmt = Number(targetFixed.amount || 0);
          const half = Math.round(origAmt / 2);
          const origDay = Number(targetFixed.dueDay || 5);
          modifiedFixedList[fxIdx] = {
            ...targetFixed,
            amount: half,
            title: `${targetFixed.title || 'Fixed'} (Part 1/2)`,
          };
          modifiedFixedList.push({
            ...targetFixed,
            id: `${targetFixed.id}_split_part_2`,
            title: `${targetFixed.title || 'Fixed'} (Part 2/2)`,
            amount: origAmt - half,
            dueDay: ((origDay - 1 + 15) % 28) + 1,
          });
        }
      }
    }
  }

  // (c) Sales drop % (0-50%)
  const dropFraction = Math.min(0.5, Math.max(0, Number(salesDropPct || 0) / 100));
  const modifiedOwnerTarget = Math.round(Number(baseParams.ownerTargetDailySales || 8000) * (1 - dropFraction));
  const modifiedSalesHistory = (baseParams.salesHistory || []).map((s) => ({
    ...s,
    amount: Math.round(Number(s.amount || s.sales || 0) * (1 - dropFraction)),
  }));
  const modifiedTodaySales = Math.round(Number(baseParams.todayReceivedSales || 8000) * (1 - dropFraction));

  // 3. Run Scenario Timeline using EXACT same engine function
  const scenarioResult = calculateTimelineCashflow({
    ...baseParams,
    eKhataCustomersList: modifiedKhataList,
    upcomingExpensesList: modifiedUpcomingList,
    fixedExpensesList: modifiedFixedList,
    ownerTargetDailySales: modifiedOwnerTarget,
    salesHistory: modifiedSalesHistory,
    todayReceivedSales: modifiedTodaySales,
    horizonDays,
    startDate,
    safetyBuffer,
  });

  // 4. Compute Metrics per Scenario
  let minBal = scenarioResult.minProjectedBalance;
  let minDay = 1;
  let minDate = '';
  let firstShortagePoint = null;

  if (scenarioResult.timeline?.length > 0) {
    minBal = scenarioResult.timeline[0].expectedBalanceAfterDues ?? scenarioResult.timeline[0].balanceAfterDues;
    minDay = scenarioResult.timeline[0].day;
    minDate = scenarioResult.timeline[0].date;

    for (const p of scenarioResult.timeline) {
      const afterDues = p.expectedBalanceAfterDues ?? p.balanceAfterDues;
      if (afterDues < safetyBuffer && !firstShortagePoint) {
        firstShortagePoint = {
          day: p.day,
          date: p.date,
          balance: afterDues,
          shortfall: safetyBuffer - afterDues,
          isDeficit: afterDues < 0,
        };
      }
      if (afterDues < minBal) {
        minBal = afterDues;
        minDay = p.day;
        minDate = p.date;
      }
    }
  }

  const gap = Math.max(0, safetyBuffer - minBal);

  let status = 'SAFE';
  if (minBal < 0 || (firstShortagePoint && firstShortagePoint.isDeficit)) {
    status = 'RISK';
  } else if (gap > 0 || minBal < safetyBuffer) {
    status = 'WATCH';
  }

  return {
    baseResult,
    scenarioResult,
    status,
    gap,
    minBalance: minBal,
    minBalanceDate: minDate || 'N/A',
    minBalanceDay: minDay || 0,
    firstShortageDate: firstShortagePoint
      ? `${firstShortagePoint.date} (Day +${firstShortagePoint.day})`
      : 'None (Above Buffer)',
    firstShortagePoint,
    safetyBuffer,
    controls: {
      khataDelayDays,
      unexpectedExpense,
      salesDropPct,
      dueModification,
    },
    modifiedLists: {
      eKhataCustomersList: modifiedKhataList,
      upcomingExpensesList: modifiedUpcomingList,
      fixedExpensesList: modifiedFixedList,
    },
  };
}

/**
 * Compare Mitigation Responses when a scenario is in RISK
 *
 * Runs the 4 actions on the SAME scenario:
 *  (i)   Collect Khata early (accelerate customer receivables)
 *  (ii)  Delay a supplier payable by N days
 *  (iii) Short-term loan of the gap amount at owner-editable interest rate
 *  (iv)  Reschedule a fixed due
 *
 * @param {Object} options
 * @returns {Array<Object>} Table of responses ranked by effectiveness and cost
 */
export function compareMitigationResponses({
  baseParams = {},
  controls = {},
  scenarioResult = null,
  gap = 0,
  interestRatePct = 12,
  loanDurationDays = 30,
}) {
  const safetyBuffer = Number(baseParams.safetyBuffer || 1500);
  const responses = [];

  // 1. Response (i): Collect Khata Early
  // Accelerate all customers' receivables by bringing due dates 7 days earlier or zeroing delay
  const khataAcceleratedCustomers = (baseParams.eKhataCustomersList || []).map((c) => ({
    ...c,
    avgDelayDays: Math.max(0, Number(c.avgDelayDays ?? c.delayDays ?? 0) - 7),
  }));

  const resKhata = simulateScenarioTimeline(
    { ...baseParams, eKhataCustomersList: khataAcceleratedCustomers },
    { ...controls, khataDelayDays: 0 }
  );

  const khataCost = 0; // Trade credit collection carries 0 interest cost
  responses.push({
    id: 'collect_khata_early',
    title: 'Collect Khata Early',
    actionDesc: 'Send instant WhatsApp reminders and collect pending customer Udhar 7 days earlier with 0 debt.',
    minBalance: resKhata.minBalance,
    firstShortageDate: resKhata.gap === 0 ? 'Cleared ✅' : resKhata.firstShortageDate,
    extraCost: khataCost,
    clearsShortage: resKhata.gap === 0 || resKhata.minBalance >= safetyBuffer,
    gapAfter: resKhata.gap,
    scenarioResult: resKhata.scenarioResult,
    type: 'khata',
  });

  // 2. Response (ii): Delay a Supplier Payable by 15 Days
  // Find largest upcoming supplier payable and defer it past the shortage
  const upcomingList = [...(baseParams.upcomingExpensesList || [])];
  let deferredUpcoming = upcomingList;
  if (upcomingList.length > 0) {
    // Sort descending by amount to delay the most impactful payable
    const sorted = [...upcomingList].sort((a, b) => b.amount - a.amount);
    const largestId = sorted[0].id ?? sorted[0]._id;
    deferredUpcoming = upcomingList.map((item) => {
      if ((item.id ?? item._id) === largestId) {
        const d = new Date(item.dueDate || baseParams.startDate || new Date());
        d.setDate(d.getDate() + 15);
        return { ...item, dueDate: toLocalDateString(d) };
      }
      return item;
    });
  }

  const resSupplier = simulateScenarioTimeline(
    { ...baseParams, upcomingExpensesList: deferredUpcoming },
    controls
  );

  const supplierCost = 0; // Vendor grace period / relationship credit
  responses.push({
    id: 'delay_supplier_payable',
    title: 'Delay Supplier Payable by 15 Days',
    actionDesc: 'Negotiate a 15-day vendor payment grace period on largest scheduled inventory invoice.',
    minBalance: resSupplier.minBalance,
    firstShortageDate: resSupplier.gap === 0 ? 'Cleared ✅' : resSupplier.firstShortageDate,
    extraCost: supplierCost,
    clearsShortage: resSupplier.gap === 0 || resSupplier.minBalance >= safetyBuffer,
    gapAfter: resSupplier.gap,
    scenarioResult: resSupplier.scenarioResult,
    type: 'supplier',
  });

  // 3. Response (iii): Short-Term Working Capital Loan of Gap Amount
  // Injects gap amount as opening reserve cash; interest computed at owner-editable rate
  const loanAmount = Math.max(1000, Math.round(gap));
  const rateFraction = Number(interestRatePct || 12) / 100;
  const loanDays = Number(loanDurationDays || 30);
  const interestCost = Math.round(loanAmount * rateFraction * (loanDays / 365));

  const resLoan = simulateScenarioTimeline(
    {
      ...baseParams,
      openingReceivedCash: Number(baseParams.openingReceivedCash || 40000) + loanAmount,
    },
    controls
  );

  responses.push({
    id: 'short_term_loan',
    title: `Working Capital Loan (₹${loanAmount.toLocaleString()})`,
    actionDesc: `Inject ₹${loanAmount.toLocaleString()} short-term bridge loan for ${loanDays} days at ${interestRatePct}% p.a. interest.`,
    minBalance: resLoan.minBalance,
    firstShortageDate: resLoan.gap === 0 ? 'Cleared ✅' : resLoan.firstShortageDate,
    extraCost: interestCost,
    clearsShortage: resLoan.gap === 0 || resLoan.minBalance >= safetyBuffer,
    gapAfter: resLoan.gap,
    scenarioResult: resLoan.scenarioResult,
    type: 'loan',
    interestRatePct,
    loanAmount,
  });

  // 4. Response (iv): Reschedule a Fixed Due
  // Shift largest fixed monthly due (e.g. Rent/EMI) by 20 days; nominal late penalty fee
  const fixedList = [...(baseParams.fixedExpensesList || [])];
  let rescheduledFixed = fixedList;
  if (fixedList.length > 0) {
    const sortedFixed = [...fixedList].sort((a, b) => b.amount - a.amount);
    const largestFixedId = sortedFixed[0].id ?? sortedFixed[0]._id;
    rescheduledFixed = fixedList.map((f) => {
      if ((f.id ?? f._id) === largestFixedId) {
        return { ...f, dueDay: ((Number(f.dueDay || 1) + 18) % 28) + 1 };
      }
      return f;
    });
  }

  const resFixed = simulateScenarioTimeline(
    { ...baseParams, fixedExpensesList: rescheduledFixed },
    controls
  );

  const penaltyCost = 500; // Flat late payment fee / bank reschedule charge
  responses.push({
    id: 'reschedule_fixed_due',
    title: 'Reschedule Fixed Monthly Due',
    actionDesc: 'Shift highest monthly fixed commitment (Rent/EMI) by 20 days to bypass the cashflow dip.',
    minBalance: resFixed.minBalance,
    firstShortageDate: resFixed.gap === 0 ? 'Cleared ✅' : resFixed.firstShortageDate,
    extraCost: penaltyCost,
    clearsShortage: resFixed.gap === 0 || resFixed.minBalance >= safetyBuffer,
    gapAfter: resFixed.gap,
    scenarioResult: resFixed.scenarioResult,
    type: 'fixed',
  });

  // 5. Ranking Logic:
  // (1) Clears shortage first
  // (2) Lowest extra cost
  // (3) Highest minimum balance
  responses.sort((a, b) => {
    if (a.clearsShortage && !b.clearsShortage) return -1;
    if (!a.clearsShortage && b.clearsShortage) return 1;
    if (a.extraCost !== b.extraCost) return a.extraCost - b.extraCost;
    return b.minBalance - a.minBalance;
  });

  // Tag recommended order and best response
  responses.forEach((resp, index) => {
    resp.order = index + 1;
    resp.isBest = index === 0 && resp.clearsShortage;
  });

  return responses;
}
