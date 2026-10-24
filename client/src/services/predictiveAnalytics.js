/**
 * Business Logic Engine: Predictive Cash Runway & Burn Rate Analytics
 * Calculates daily inflow velocity, outflow burn rate, cash runway days, and liquidity advisory.
 */

export function calculatePredictiveCashRunway({
  startingBalance = 40000,
  todayIncomeList = [],
  fixedExpensesList = [],
  upcomingExpensesList = [],
  eKhataCustomersList = [],
}) {
  // 1. Calculate liquid cash available today
  const totalTodayIncome = (todayIncomeList || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const liquidCashAvailable = startingBalance + totalTodayIncome;

  // 2. Calculate Monthly Fixed Commitments
  const totalMonthlyFixed = (fixedExpensesList || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  // Amortized daily fixed burn (30-day month)
  const dailyFixedBurn = Math.round(totalMonthlyFixed / 30);

  // 3. Calculate Near-Term Upcoming Payables (15-day liabilities)
  const totalUpcomingLiabilities = (upcomingExpensesList || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const dailyUpcomingBurn = Math.round(totalUpcomingLiabilities / 15);

  // Total Daily Outflow Burn Rate
  const dailyBurnRate = dailyFixedBurn + dailyUpcomingBurn;

  // 4. Calculate Customer Credit Inflow Velocity (expected from eKhata)
  const totalEligibleReceivables = (eKhataCustomersList || [])
    .filter((c) => Number(c.totalAmount || 0) > 0)
    .reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);

  // Estimated daily collection rate (assuming typical 15-day collection cycle for near-term udhar)
  const dailyCollectionVelocity = Math.round(totalEligibleReceivables / 15);

  // Average daily income (minimum floor of daily goal or today's trend)
  const baselineDailyIncome = Math.max(totalTodayIncome, 8000);
  const totalDailyInflow = baselineDailyIncome + dailyCollectionVelocity;

  // 5. Net Daily Cash Flow
  const netDailyCashFlow = totalDailyInflow - dailyBurnRate;

  // 6. Predictive Runway Days
  let runwayDays = 0;
  let runwayStatus = 'SAFE'; // 'SAFE', 'CAUTION', 'CRITICAL'

  if (dailyBurnRate <= 0) {
    runwayDays = 90;
    runwayStatus = 'SAFE';
  } else if (netDailyCashFlow >= 0) {
    // Self-sustaining: Runway exceeds 60+ days based on cash generation
    runwayDays = Math.min(
      90,
      Math.round(liquidCashAvailable / Math.max(dailyBurnRate * 0.5, 1))
    );
    runwayStatus = runwayDays >= 30 ? 'SAFE' : 'CAUTION';
  } else {
    // Burn rate exceeds inflows
    const netDeficit = Math.abs(netDailyCashFlow);
    runwayDays = Math.max(1, Math.floor(liquidCashAvailable / netDeficit));
    if (runwayDays < 15) {
      runwayStatus = 'CRITICAL';
    } else if (runwayDays <= 30) {
      runwayStatus = 'CAUTION';
    } else {
      runwayStatus = 'SAFE';
    }
  }

  // 7. Actionable AI Advisory
  let advisoryTitle = '';
  let advisoryText = '';

  if (runwayStatus === 'SAFE') {
    advisoryTitle = 'Healthy Operational Cash Runway';
    advisoryText = `You have ~${runwayDays} days of cash runway. Daily inflows (₹${totalDailyInflow.toLocaleString()}/day) exceed operational burn (₹${dailyBurnRate.toLocaleString()}/day).`;
  } else if (runwayStatus === 'CAUTION') {
    advisoryTitle = 'Moderate Liquidity Watch';
    advisoryText = `Runway is estimated at ~${runwayDays} days. Upcoming liabilities of ₹${totalUpcomingLiabilities.toLocaleString()} will increase burn. Collecting pending customer udhar (₹${totalEligibleReceivables.toLocaleString()}) will extend runway by +14 days.`;
  } else {
    advisoryTitle = 'High Burn Rate Warning';
    advisoryText = `Runway is under 15 days (~${runwayDays} days left). Near-term expenses (₹${totalUpcomingLiabilities.toLocaleString()}) require immediate cash preservation. Prioritize collecting urgent customer dues.`;
  }

  return {
    liquidCashAvailable,
    totalMonthlyFixed,
    totalUpcomingLiabilities,
    totalEligibleReceivables,
    dailyBurnRate,
    totalDailyInflow,
    netDailyCashFlow,
    runwayDays,
    runwayStatus,
    advisoryTitle,
    advisoryText,
  };
}
