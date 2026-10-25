import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRetainedCashPerDay,
  calculateTimelineCashflow,
  calculateExpectedKhataDate,
  buildTimelineReceivables,
  DEFAULT_MARGINS_BY_TYPE,
} from '../predictiveAnalytics.js';
import { getDueEvents } from '../expenseSync.js';

describe('AurumFlow Cash-Flow Engine & Retained Cash Specifications', () => {
  // Test 1: The worked example ₹8,000 → ₹1,500
  it('Requirement 1 & Worked Example: Sales ₹8,000 at 25% margin minus ₹500 running costs yields ₹1,500 retained cash', () => {
    const result = calculateRetainedCashPerDay({
      receivedCashSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
    });

    assert.equal(result.grossSales, 8000, 'Gross sales should be ₹8,000');
    assert.equal(result.grossProfit, 2000, 'Gross profit should be ₹2,000 (8000 * 0.25)');
    assert.equal(result.stockRestockCost, 6000, 'Stock restock cost should be ₹6,000 (8000 * 0.75)');
    assert.equal(result.dailyRunningCost, 500, 'Daily running cost should be ₹500');
    assert.equal(result.retainedCashPerDay, 1500, 'Retained cash must be exactly ₹1,500/day');
  });

  // Test 2: Expected vs Received separation (Requirement 2)
  it('Requirement 2: Expected receivables (Khata) are never merged into free cash or received cash', () => {
    const openingCash = 40000;
    const todaySales = 8000;
    const eKhataCustomers = [
      { id: 'c-1', name: 'Rahul', totalAmount: 4000, dueDate: '2026-11-05' },
      { id: 'c-2', name: 'Pooja', totalAmount: 6000, dueDate: 'Not Specified' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: openingCash,
      todayReceivedSales: todaySales,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      eKhataCustomersList: eKhataCustomers,
    });

    // free_cash = opening (40,000) + retained (8000*0.25 - 500 = 1500) = 41,500
    assert.equal(result.freeCashToday, 41500, 'Free cash today must be exactly ₹41,500');
    // Till / bank total = 40,000 + 8,000 = 48,000 (informational only)
    assert.equal(result.tillBankTotal, 48000, 'Till/bank total must be ₹48,000 (informational only)');
    assert.equal(result.expectedReceivables, 10000, 'Expected receivables must be exactly ₹10,000');

    // Crucial check: expected receivables are NOT added into freeCashToday or receivedCashInHand
    assert.notEqual(result.receivedCashInHand, 51500, 'Expected receivables must NEVER be added to cash in hand');
    assert.notEqual(result.freeCashToday, 51500);
  });

  // Test 3: No double counting of rent/EMI
  it('Requirement 3: Rent and EMI are treated as dated timeline events, NOT amortized daily deductions', () => {
    const fixedExpenses = [
      { id: 'fix-1', title: 'Store Rent', amount: 10000, dueDay: 5, category: 'Rent' },
      { id: 'fix-2', title: 'Machinery EMI', amount: 10000, dueDay: 10, category: 'EMI' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      fixedExpensesList: fixedExpenses,
      startDate: new Date('2026-11-01'), // Nov 1st
    });

    // Daily retained cash remains ₹1,500/day (not reduced by amortized rent/EMI)
    assert.equal(result.retainedCashPerDay, 1500, 'Daily retained cash must stay ₹1,500/day and not be reduced by amortized rent');

    // Rent hits on 5th Nov (day 4 from Nov 1) and EMI on 10th Nov (day 9 from Nov 1)
    const day4Dues = result.duesByDay[4] || [];
    assert.ok(day4Dues.some((d) => d.amount === 10000 && d.dueDay === 5), 'Day 5 of month must have the discrete ₹10,000 rent due');
    
    const day9Dues = result.duesByDay[9] || [];
    assert.ok(day9Dues.some((d) => d.amount === 10000 && d.dueDay === 10), 'Day 10 of month must have the discrete ₹10,000 EMI due');
  });


  // Test 4: Dynamic 15-day timeline obligations against safety buffer with ₹1,500/day retained
  it('Requirement 4 & 6: Timeline obligations due within 15 days against buffer with ₹1,500/day retained', () => {
    const fixedExpenses = [
      { id: 'fix-1', title: 'Store Rent', amount: 10000, dueDay: 5, category: 'Rent' },
      { id: 'fix-2', title: 'Machinery EMI', amount: 10000, dueDay: 10, category: 'EMI' },
      { id: 'fix-3', title: 'Staff Salary', amount: 7000, dueDay: 7, category: 'Salaries' },
      { id: 'fix-4', title: 'Electricity Bill', amount: 3000, dueDay: 14, category: 'Utilities' },
    ];

    const upcomingExpenses = [
      { id: 'up-1', title: 'Vendor Stock Batch', amount: 13000, dueDate: '2026-10-30', category: 'Supplier' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,    // retained = 1,500/day
      safetyBuffer: 1500,       // 3 * 500
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      startDate: new Date('2026-10-25'),
    });

    assert.equal(result.freeCashToday, 41500);
    assert.equal(result.tillBankTotal, 48000);
    assert.equal(result.retainedCashPerDay, 1500);

    const day15Data = result.timeline[14]; // 0-indexed for day 15
    assert.ok(day15Data, 'Day 15 timeline data must exist');
    assert.equal(day15Data.balance >= 1500, true, 'Balance at day 15 must be greater than safety buffer ₹1,500');
    assert.equal(result.status, 'SAFE', 'Status should be SAFE since balance remains above buffer');
  });

  // Test: with rent 10k + EMI 10k + salary 7k, no single month's total deductions may exceed ₹30,000
  it('Requirement: with rent 10k + EMI 10k + salary 7k, no single month\'s total deductions may exceed ₹30,000', () => {
    const fixedExpenses = [
      { id: 'fix-1', title: 'Store Rent', amount: 10000, dueDay: 5, category: 'Rent', status: 'Pending' },
      { id: 'fix-2', title: 'Machinery EMI', amount: 10000, dueDay: 10, category: 'EMI', status: 'Pending' },
      { id: 'fix-3', title: 'Staff Salary', amount: 7000, dueDay: 7, category: 'Salaries', status: 'Pending' },
    ];

    // Check November 2026 (full calendar month)
    const dueEventsNov = getDueEvents({
      fixedExpenses,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-30'),
    });

    // Rent 10k + EMI 10k + Salary 7k = ₹27,000
    assert.equal(dueEventsNov.totalDues, 27000, 'November total deductions should be ₹27,000');
    assert.ok(dueEventsNov.totalDues <= 30000, 'Total monthly deductions must not exceed ₹30,000');

    // Even adding utility bill of ₹3,000 (total = ₹30,000)
    const fixedWithUtility = [
      ...fixedExpenses,
      { id: 'fix-4', title: 'Electricity Bill', amount: 3000, dueDay: 18, category: 'Utilities', status: 'Pending' },
    ];
    const dueEventsFull = getDueEvents({
      fixedExpenses: fixedWithUtility,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-30'),
    });

    assert.equal(dueEventsFull.totalDues, 30000, 'Total with utilities is exactly ₹30,000');
    assert.ok(dueEventsFull.totalDues <= 30000, 'Monthly deductions with rent 10k + EMI 10k + salary 7k must never exceed ₹30,000');
  });

  // Test: Skip a due if it is already marked "Paid for <month>"
  it('Requirement 2: Skip a due if it is already marked "Paid for <month>"', () => {
    const fixedExpenses = [
      { id: 'fix-1', title: 'Store Rent', amount: 10000, dueDay: 5, category: 'Rent', status: 'Paid', paidMonths: ['2026-11'] },
      { id: 'fix-2', title: 'Machinery EMI', amount: 10000, dueDay: 10, category: 'EMI', status: 'Pending' },
      { id: 'fix-3', title: 'Staff Salary', amount: 7000, dueDay: 7, category: 'Salaries', status: 'Pending' },
    ];

    const dues = getDueEvents({
      fixedExpenses,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-30'),
    });

    // Rent is marked Paid for 2026-11, so it must be skipped!
    const titles = dues.events.map((e) => e.title);
    assert.ok(!titles.includes('Store Rent'), 'Store Rent must be skipped because it is marked Paid for 2026-11');
    assert.equal(dues.totalDues, 17000, 'Total dues should only be EMI ₹10,000 + Salary ₹7,000 = ₹17,000');
  });

  // Test 5: Acceptance Criteria - Lumpy due date triggers RISK even with positive daily average
  it('Acceptance Criteria: A lumpy due date triggers RISK even when daily cash flow is positive', () => {
    // If a supplier bill of ₹50,000 hits on Day 2
    const upcomingExpenses = [
      { id: 'up-huge', title: 'Bulk Inventory Payment', amount: 50000, dueDate: '2026-10-27' }, // Day 2
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000, // total in-hand = 48,000
      grossMarginPct: 25,
      dailyRunningCost: 500,    // retained = 1,500/day
      safetyBuffer: 1500,
      upcomingExpensesList: upcomingExpenses,
      startDate: new Date('2026-10-25'),
    });

    // Available at Day 2: 48,000 + 2 * 1,500 = 51,000
    // After 50,000 payment: balance is 1,000
    // Safety buffer is 1,500 -> 1,000 < 1,500 -> triggers RISK!
    assert.equal(result.retainedCashPerDay, 1500, 'Daily cash flow is positive (+₹1,500/day)');
    assert.equal(result.status, 'RISK', 'Must trigger RISK because balance dips below ₹1,500 buffer on Day 2');
    assert.ok(result.firstRisk, 'First risk event must be identified');
    assert.equal(result.firstRisk.day, 2, 'Risk occurs on Day 2');
  });
});

describe('Festival & Context Sales Adjuster Specifications', () => {
  // Test 6: Out-of-range multipliers are clamped (0.6 - 1.6, overlap capped at 1.8)
  it('Requirement: Out-of-range multipliers are clamped to [0.6, 1.6] and overlapping windows capped at 1.8', async () => {
    const { clampMultiplier, clampOverlap, sanitizeAdjustments, getMultipliersForDate } = await import('../contextAdjuster.js');

    // Individual clamping
    assert.equal(clampMultiplier(0.2), 0.6, 'Multiplier below 0.6 must be clamped to 0.6');
    assert.equal(clampMultiplier(2.5), 1.6, 'Multiplier above 1.6 must be clamped to 1.6');
    assert.equal(clampMultiplier(1.3), 1.3, 'Multiplier within range stays 1.3');

    // Overlap clamping
    assert.equal(clampOverlap(2.4), 1.8, 'Overlapping total must be capped at 1.8');
    assert.equal(clampOverlap(0.4), 0.6, 'Overlapping total cannot be below 0.6');

    // Sanitize adjustment list enforcing low <= base <= high
    const raw = [
      {
        event: 'Extreme Event',
        window_start: '2026-11-01',
        window_end: '2026-11-03',
        multiplier: { low: 0.1, base: 2.5, high: 3.0 },
      },
    ];
    const sanitized = sanitizeAdjustments(raw);
    const item = sanitized.adjustments[0];
    assert.equal(item.multiplier.low, 0.6, 'Low must be clamped to 0.6');
    assert.equal(item.multiplier.base, 1.6, 'Base must be clamped to 1.6');
    assert.equal(item.multiplier.high, 1.6, 'High must be clamped to 1.6');
    assert.ok(item.multiplier.low <= item.multiplier.base && item.multiplier.base <= item.multiplier.high);

    // Overlapping windows test
    const overlappingEvents = [
      {
        event: 'Event A',
        window_start: '2026-11-01',
        window_end: '2026-11-05',
        multiplier: { low: 1.2, base: 1.4, high: 1.5 },
      },
      {
        event: 'Event B',
        window_start: '2026-11-03',
        window_end: '2026-11-07',
        multiplier: { low: 1.2, base: 1.4, high: 1.5 },
      },
    ];
    // On 2026-11-04 (overlapping): base = 1.4 * 1.4 = 1.96 -> capped at 1.8
    const overlapResult = getMultipliersForDate('2026-11-04', overlappingEvents, true);
    assert.equal(overlapResult.base, 1.8, 'Overlapping window multiplier product 1.96 must be capped at 1.8');
    assert.equal(overlapResult.activeEvents.length, 2, 'Both overlapping events must be detected');
  });

  // Test 7: Malformed LLM response falls back to 1.0
  it('Requirement: A malformed LLM response falls back to 1.0 with "Context adjustment unavailable"', async () => {
    const { sanitizeAdjustments, getMultipliersForDate } = await import('../contextAdjuster.js');

    const malformed1 = null;
    const res1 = sanitizeAdjustments(malformed1);
    assert.equal(res1.unavailable, true, 'Null response must mark unavailable = true');
    assert.ok(res1.adjustments.length > 0, 'Fallback adjustments must be populated from static calendar');
    assert.equal(res1.adjustments[0].multiplier.base, 1.0, 'Base multiplier must be 1.0');
    assert.equal(res1.adjustments[0].reason, 'Context adjustment unavailable');

    const malformed2 = 'invalid json or empty object';
    const res2 = sanitizeAdjustments(malformed2);
    assert.equal(res2.unavailable, true);
    assert.equal(res2.adjustments[0].multiplier.base, 1.0);

    // Date lookup with fallback adjustments yields 1.0
    const dateLookup = getMultipliersForDate('2026-10-28', res1.adjustments, true);
    assert.equal(dateLookup.base, 1.0, 'Fallback date lookup must be 1.0');
  });

  // Test 8: Margin and running cost are applied after the multiplier
  it('Requirement: Margin and running cost are applied after the multiplier', async () => {
    const { calculateAdjustedRetainedCash } = await import('../contextAdjuster.js');

    const baselineSales = 8000;
    const multiplier = 1.3; // 30% surge
    const grossMarginPct = 25; // 25% margin
    const dailyRunningCost = 500; // ₹500/day

    const result = calculateAdjustedRetainedCash({
      baselineSales,
      multiplier,
      grossMarginPct,
      dailyRunningCost,
    });

    // 1. adj_sales = baseline_sales * multiplier = 8000 * 1.3 = 10,400
    assert.equal(result.adjSales, 10400, 'Adjusted sales must be ₹10,400 (8000 * 1.3)');

    // 2. gross profit = 10400 * 0.25 = 2,600
    assert.equal(result.grossProfit, 2600, 'Gross profit must be ₹2,600 (10400 * 0.25)');

    // 3. retained_cash = gross_profit - running_cost = 2600 - 500 = 2,100
    assert.equal(result.retainedCash, 2100, 'Retained cash must be ₹2,100 (2600 - 500)');

    // Critical negative test: Verify running cost was NOT subtracted before multiplier
    // (Wrong order: (8000 - 500) * 0.25 * 1.3 = 2437.5)
    assert.notEqual(result.retainedCash, 2438, 'Running cost must never be applied before the multiplier');
  });

  // Test 9: With the toggle OFF, the forecast matches the baseline exactly
  it('Requirement: With the toggle OFF, the forecast matches the baseline exactly', async () => {
    const adjustments = [
      {
        event: 'Diwali Rush',
        window_start: '2026-10-26',
        window_end: '2026-10-31',
        multiplier: { low: 1.2, base: 1.5, high: 1.6 },
      },
    ];

    // Baseline calculation (no adjustments)
    const baselineResult = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      startDate: new Date('2026-10-25'),
      isFestivalAdjustmentOn: false, // OFF
    });

    // Run with adjustments present BUT toggle OFF
    const toggleOffResult = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      startDate: new Date('2026-10-25'),
      contextAdjustments: adjustments,
      isFestivalAdjustmentOn: false, // OFF
    });

    // Run with toggle ON
    const toggleOnResult = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      startDate: new Date('2026-10-25'),
      contextAdjustments: adjustments,
      isFestivalAdjustmentOn: true, // ON
    });

    // Every day in toggleOff must EXACTLY equal baseline
    for (let i = 0; i < 60; i++) {
      assert.equal(
        toggleOffResult.timeline[i].balance,
        baselineResult.timeline[i].balance,
        `Day ${i + 1} balance with toggle OFF must match baseline exactly`
      );
      assert.equal(
        toggleOffResult.timeline[i].multBase,
        1.0,
        `Day ${i + 1} multiplier with toggle OFF must be 1.0`
      );
    }

    // Toggle ON should visibly differ during Diwali (e.g. Day 2 is 2026-10-27 in window)
    const day2On = toggleOnResult.timeline[1];
    const day2Off = toggleOffResult.timeline[1];
    assert.equal(day2On.multBase, 1.5, 'Toggle ON multiplier must be 1.5 during festival window');
    assert.ok(day2On.balance > day2Off.balance, 'Toggle ON balance must be higher due to festival multiplier');
  });

  // Test 10: Acceptance Criteria - Changing business_type visibly changes multipliers & reasons
  it('Acceptance Criteria: Changing business_type (kirana -> sweets) visibly changes the multipliers and reasons for the same calendar', async () => {
    const { generateDomainAdjustments } = await import('../contextAdjuster.js');

    const kiranaAdjustments = generateDomainAdjustments('kirana');
    const sweetsAdjustments = generateDomainAdjustments('sweets');

    // Find Diwali Pre-Festival in both
    const kiranaDiwali = kiranaAdjustments.find((a) => a.event.includes('Diwali Pre-Festival'));
    const sweetsDiwali = sweetsAdjustments.find((a) => a.event.includes('Diwali Pre-Festival'));

    assert.ok(kiranaDiwali, 'Kirana Diwali adjustment must exist');
    assert.ok(sweetsDiwali, 'Sweets Diwali adjustment must exist');

    // Multipliers must visibly differ
    assert.notEqual(
      kiranaDiwali.multiplier.base,
      sweetsDiwali.multiplier.base,
      'Kirana (1.3) and Sweets (1.55) multipliers must visibly differ'
    );
    assert.equal(kiranaDiwali.multiplier.base, 1.3, 'Kirana base multiplier should be 1.3');
    assert.equal(sweetsDiwali.multiplier.base, 1.55, 'Sweets base multiplier should be 1.55');

    // Reasons must visibly differ
    assert.notEqual(
      kiranaDiwali.reason,
      sweetsDiwali.reason,
      'Reasons for Kirana and Sweets must visibly differ'
    );
    assert.ok(kiranaDiwali.reason.includes('grocery provisions') || kiranaDiwali.reason.includes('oil'), 'Kirana reason mentions grocery/provisions');
    assert.ok(sweetsDiwali.reason.includes('sweet') || sweetsDiwali.reason.includes('confections'), 'Sweets reason mentions sweets/confections');
  });
});

describe('60-Day Timeline Due Markers & Vertical Step Specifications', () => {
  it('Requirement 1 & 6: Deducts dues ON that date (not next day), order: deduct dues first, then add retained cash', () => {
    // Starting balance = 10,000 opening + 0 today sales = 10,000
    // Daily sales 8,000, margin 25% (profit 2,000) - cost 500 = +1,500/day retained cash
    // Due on Nov 5 (Day index 4 from Nov 1): ₹6,000
    const fixedExpenses = [
      { id: 'fix-custom', title: 'Wholesale Inventory Bill', amount: 6000, dueDay: 5, category: 'Supplier', status: 'Pending' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 10000,
      todayReceivedSales: 0,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      safetyBuffer: 1500,
      fixedExpensesList: fixedExpenses,
      startDate: new Date('2026-11-01'), // Nov 1st -> Day 4 is Nov 5th (due date)
    });

    const dayBeforeDue = result.timeline[2]; // Nov 4 (d=3, index 2)
    const dueDatePoint = result.timeline[3]; // Nov 5 (d=4, index 3)

    assert.ok(dueDatePoint.hasDues, 'Nov 5 must have scheduled dues');
    assert.equal(dueDatePoint.dayDuesTotal, 6000, 'Due amount on Nov 5 must be ₹6,000');

    // Requirement 6: Order within a day: deduct dues first, then add that day's retained cash
    assert.equal(
      dueDatePoint.balanceBeforeDues,
      dayBeforeDue.balance,
      'balanceBeforeDues on due date must equal the end-of-day balance of the prior day'
    );
    assert.equal(
      dueDatePoint.balanceAfterDues,
      dueDatePoint.balanceBeforeDues - 6000,
      'Deduction occurs ON that date as a vertical step: balanceAfterDues = balanceBeforeDues - dues'
    );
    assert.equal(
      dueDatePoint.balance,
      dueDatePoint.balanceAfterDues + dueDatePoint.retainedBase,
      'End balance on due date = balanceAfterDues + retained cash'
    );
  });

  it('Requirement 4: Merge multiple dues on the same date into one marker with each item and the total', () => {
    // Nov 5 (dayIndex 4) has Rent (10,000) AND Supplier Invoice (5,000)
    const fixedExpenses = [
      { id: 'fix-1', title: 'Warehouse Rent', amount: 10000, dueDay: 5, category: 'Rent', status: 'Pending' },
    ];
    const upcomingExpenses = [
      { id: 'up-1', title: 'Packaging Materials', amount: 5000, dueDate: '2026-11-05', category: 'Supplier Dues' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      startDate: new Date('2026-11-01'),
    });

    const day5 = result.timeline[3]; // Nov 5 (d=4, index 3)
    assert.ok(day5.hasDues, 'Nov 5 must have dues');
    assert.equal(day5.dayDues.length, 2, 'Multiple dues on Nov 5 must be merged into ONE point');
    assert.equal(day5.dayDuesTotal, 15000, 'Total merged dues must be ₹15,000');

    const titles = day5.dayDues.map((d) => d.title);
    assert.ok(titles.includes('Warehouse Rent'), 'Merged list includes Warehouse Rent');
    assert.ok(titles.includes('Packaging Materials'), 'Merged list includes Packaging Materials');
  });

  it('Requirement 3: Marker color is yellow when balance_after >= buffer, red when < buffer (shows Arrange ₹X), and green for Khata', () => {
    const safetyBuffer = 3000;

    // Case A: Safe due (balance_after >= buffer) -> markerColor should be yellow
    const safeResult = calculateTimelineCashflow({
      openingReceivedCash: 20000,
      todayReceivedSales: 0,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      safetyBuffer,
      fixedExpensesList: [
        { id: 'fix-1', title: 'Minor Tooling', amount: 5000, dueDay: 2, category: 'Repairs', status: 'Pending' },
      ],
      startDate: new Date('2026-11-01'),
    });
    const day2Safe = safeResult.timeline[0]; // Nov 2 (d=1, index 0)
    assert.ok(day2Safe.balanceAfterDues >= safetyBuffer, 'Balance after dues is above buffer');
    assert.equal(day2Safe.markerColor, 'yellow', 'Marker color must be yellow when balance_after >= buffer');

    // Case B: Breach due (balance_after < buffer) -> markerColor should be red
    const breachResult = calculateTimelineCashflow({
      openingReceivedCash: 5000,
      todayReceivedSales: 0,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      safetyBuffer,
      fixedExpensesList: [
        { id: 'fix-2', title: 'Heavy Equipment Lease', amount: 4000, dueDay: 2, category: 'EMI', status: 'Pending' },
      ],
      startDate: new Date('2026-11-01'),
    });
    const day2Breach = breachResult.timeline[0]; // Nov 2 (d=1, index 0)
    assert.ok(day2Breach.balanceAfterDues < safetyBuffer, 'Balance after dues is below buffer');
    assert.equal(day2Breach.markerColor, 'red', 'Marker color must be red when balance_after < buffer');
    const arrangeAmount = safetyBuffer - day2Breach.balanceAfterDues;
    assert.ok(arrangeAmount > 0, 'Arrange amount must be buffer - balanceAfterDues');

    // Case C: Expected Khata receipt on date with no dues -> markerColor should be green
    const khataResult = calculateTimelineCashflow({
      openingReceivedCash: 20000,
      todayReceivedSales: 0,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      safetyBuffer,
      eKhataCustomersList: [
        { id: 'cust-1', name: 'Ramesh Store', totalAmount: 5000, dueDate: '2026-11-03' },
      ],
      startDate: new Date('2026-11-01'),
    });
    const day3Khata = khataResult.timeline[1]; // Nov 3 (d=2, index 1)
    assert.equal(day3Khata.hasDues, false, 'No scheduled dues on day 3');
    assert.ok(day3Khata.hasKhata, 'Khata receipt present on day 3');
    assert.equal(day3Khata.markerColor, 'green', 'Marker color must be green for expected Khata receipt');
  });

  it('Requirement 5: Dues marked Paid are excluded from future dates', () => {
    const fixedExpenses = [
      { id: 'fix-1', title: 'Store Rent', amount: 10000, dueDay: 5, category: 'Rent', status: 'Paid', paidMonths: ['2026-11'] },
      { id: 'fix-2', title: 'Machinery EMI', amount: 10000, dueDay: 10, category: 'EMI', status: 'Pending', paidMonths: [] },
    ];
    const upcomingExpenses = [
      { id: 'up-1', title: 'Paid Supplier Invoice', amount: 4000, dueDate: '2026-11-06', status: 'Paid' },
      { id: 'up-2', title: 'Pending Supplier Invoice', amount: 6000, dueDate: '2026-11-08', status: 'Pending' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 30000,
      todayReceivedSales: 8000,
      grossMarginPct: 25,
      dailyRunningCost: 500,
      fixedExpensesList: fixedExpenses,
      upcomingExpensesList: upcomingExpenses,
      startDate: new Date('2026-11-01'),
    });

    // Rent is marked Paid for 2026-11 -> should NOT appear on Nov 5 (d=4, index 3)
    const day5 = result.timeline[3];
    assert.equal(day5.hasDues, false, 'Paid rent must be excluded from Nov 5');
    assert.equal(day5.dayDuesTotal, 0, 'No dues on Nov 5 since rent is paid');

    // One-off payable 'up-1' is marked Paid -> should NOT appear on Nov 6 (d=5, index 4)
    const day6 = result.timeline[4];
    assert.equal(day6.hasDues, false, 'Paid supplier invoice must be excluded from Nov 6');

    // Pending EMI on Nov 10 (d=9, index 8) MUST appear
    const day10 = result.timeline[8];
    assert.ok(day10.hasDues, 'Pending EMI on Nov 10 must appear');
    assert.equal(day10.dayDuesTotal, 10000, 'Pending EMI is ₹10,000');
  });
});

describe('User Explicit Verification Tests (Unified Cash Engine)', () => {
  // Test 1: (opening ₹40,000, sales ₹19,973, margin 20%, running ₹500):
  // - free cash today = ₹43,495; expected-mode start = ₹41,100
  it('Test 1: Opening ₹40,000, sales ₹19,973, margin 20%, running ₹500 -> free cash today = ₹43,495; expected-mode start = ₹41,100', () => {
    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 19973,
      grossMarginPct: 20,
      dailyRunningCost: 500,
      ownerTargetDailySales: 8000,
      salesHistory: [], // falls back to owner target ₹8,000
    });

    assert.equal(result.freeCashToday, 43495, 'Free cash today must be exactly ₹43,495 (40000 + round(19973*0.20) - 500)');
    assert.equal(result.expectedModeStart, 41100, 'Expected-mode start must be exactly ₹41,100 (40000 + round(8000*0.20) - 500)');
  });

  // Test 2: ₹1,000 udhar sale then payment: −₹800 on sale day, +₹1,000 on payment, net +₹200
  it('Test 2: ₹1,000 udhar sale then payment: -₹800 on sale day, +₹1,000 on payment, net +₹200', () => {
    // On sale day: udhar sale ₹1,000, cash received ₹0, running cost ₹0 for isolation
    const saleDay = calculateRetainedCashPerDay({
      cashUpiReceived: 0,
      grossSales: 1000,
      grossMarginPct: 20,
      dailyRunningCost: 0,
    });
    // retained = cash(0) - gross(1000)*(1 - 0.20) - running(0) = -800
    assert.equal(saleDay.retainedCashPerDay, -800, 'Sale day retained cash must deduct stock cost: -₹800');

    // On payment day: customer pays ₹1,000, gross sales ₹0 (already counted), running cost ₹0
    const paymentDay = calculateRetainedCashPerDay({
      cashUpiReceived: 1000,
      grossSales: 0,
      grossMarginPct: 20,
      dailyRunningCost: 0,
    });
    // retained = cash(1000) - gross(0)*(1 - 0.20) - running(0) = +1000
    assert.equal(paymentDay.retainedCashPerDay, 1000, 'Payment day adds collection in full: +₹1,000');

    const netRetained = saleDay.retainedCashPerDay + paymentDay.retainedCashPerDay;
    assert.equal(netRetained, 200, 'Net retained cash must be exactly +₹200 (profit on ₹1,000 at 20%)');
  });

  // Test 3: Reality and Expected charts differ only by ₹2,395 after today
  it('Test 3: Reality and Expected charts differ only by ₹2,395 after today (every day d=1..60)', () => {
    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 19973,
      grossMarginPct: 20,
      dailyRunningCost: 500,
      ownerTargetDailySales: 8000,
      horizonDays: 60,
    });

    const initialDiff = result.freeCashToday - result.expectedModeStart;
    assert.equal(initialDiff, 2395, 'Start difference must be ₹2,395');

    // Verify for every day in the 60-day timeline:
    assert.equal(result.timeline.length, 60, 'Timeline must have 60 days');
    result.timeline.forEach((point) => {
      const diff = point.realityBalance - point.expectedBalance;
      assert.equal(
        diff,
        2395,
        `Day ${point.day} reality (${point.realityBalance}) and expected (${point.expectedBalance}) must differ by exactly ₹2,395`
      );
    });
  });

  // Test 4: With rent 10k + EMI 10k + salary 7k + 3k other monthly, no 60-day balance exceeds ₹41,100 + 59×2,380 − 60,000
  it('Test 4: With rent 10k + EMI 10k + salary 7k + 3k other monthly, no 60-day balance exceeds ₹41,100 + 59×2,380 − 60,000', () => {
    const fixedExpenses = [
      { id: 'fix-1', title: 'Store Rent', amount: 10000, dueDay: 5, category: 'Rent', status: 'Pending' },
      { id: 'fix-2', title: 'Machinery EMI', amount: 10000, dueDay: 10, category: 'EMI', status: 'Pending' },
      { id: 'fix-3', title: 'Staff Salary', amount: 7000, dueDay: 7, category: 'Salaries', status: 'Pending' },
      { id: 'fix-4', title: 'Other Monthly', amount: 3000, dueDay: 20, category: 'Other', status: 'Pending' },
    ];

    const result = calculateTimelineCashflow({
      openingReceivedCash: 40000,
      todayReceivedSales: 19973,
      grossMarginPct: 20,
      dailyRunningCost: 500,
      ownerTargetDailySales: 8000,
      fixedExpensesList: fixedExpenses,
      horizonDays: 60,
      startDate: new Date('2026-10-25'),
    });

    // Upper bound: 41,100 + 59 * 2,380 - 60,000 = 121,520
    const theoreticalMax = 41100 + (59 * 2380) - 60000;

    result.timeline.forEach((point) => {
      assert.ok(
        point.expectedBalance <= theoreticalMax,
        `Day ${point.day} expected balance (${point.expectedBalance}) must not exceed theoretical upper bound ${theoreticalMax}`
      );
    });
  });

  // Test 5: Khata receipts never precede their due date
  it('Test 5: Khata receipts never precede their due date', () => {
    const today = new Date('2026-10-25');

    // 1. Future due date with 0 delay: exact due date
    assert.equal(
      calculateExpectedKhataDate('2026-11-10', 0, today),
      '2026-11-10',
      'Future due date must not precede due date'
    );

    // 2. Future due date with negative delay: must never precede due date
    assert.equal(
      calculateExpectedKhataDate('2026-11-10', -3, today),
      '2026-11-10',
      'Negative delay must never precede due date'
    );

    // 3. Future due date with positive delay: due_date + delay
    assert.equal(
      calculateExpectedKhataDate('2026-11-10', 5, today),
      '2026-11-15',
      'Positive delay shifts expected date forward'
    );

    // 4. Past due date (overdue): max(due_date + delay, today) >= today
    assert.equal(
      calculateExpectedKhataDate('2026-10-15', 2, today),
      '2026-10-25',
      'Overdue receipt is scheduled today or later, never before due date'
    );

    // 5. In timeline receivables, future due customer c-1 is on day 16, never before day 16
    const customers = [
      { id: 'c-1', name: 'Alok', totalAmount: 5000, dueDate: '2026-11-10', avgDelayDays: 0 },
    ];
    const { recvByDay } = buildTimelineReceivables({
      eKhataCustomersList: customers,
      horizonDays: 60,
      startDate: today,
    });

    for (let d = 1; d < 16; d++) {
      assert.equal(recvByDay[d] || 0, 0, `Day ${d} must not precede due date (Nov 10 / Day 16)`);
    }
    assert.equal(recvByDay[16], 5000, 'Nov 10 receipt must be on Day 16');
  });
});


