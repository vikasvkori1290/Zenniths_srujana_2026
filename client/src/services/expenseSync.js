/**
 * Service to sync Monthly Fixed Expenses (from Profile) into Upcoming Expenses (on Home Page)
 * if their due date falls within 15 days.
 */

export const DEFAULT_FIXED_EXPENSES = [];

/**
 * Deduplicate fixed expenses by unique id or (title + dueDay + amount) composite key
 */
export function deduplicateFixedExpenses(list) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenComposite = new Set();
  const unique = [];

  for (const item of list) {
    if (!item) continue;
    const id = item.id || item.clientId;
    const titleNorm = String(item.title || '').trim().toLowerCase();
    const dueDay = Number(item.dueDay) || 1;
    const amount = Number(item.amount) || 0;
    const compositeKey = `${titleNorm}__${dueDay}__${amount}`;

    if (id && seenIds.has(id)) continue;
    if (compositeKey && seenComposite.has(compositeKey)) continue;

    if (id) seenIds.add(id);
    seenComposite.add(compositeKey);
    unique.push(item);
  }

  return unique;
}

/**
 * Deduplicate upcoming payables by unique id or (title + dueDate + amount) composite key
 */
export function deduplicateUpcomingExpenses(list) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenComposite = new Set();
  const unique = [];

  for (const item of list) {
    if (!item) continue;
    const id = item.id || item.clientId;
    const titleNorm = String(item.title || '').trim().toLowerCase();
    const dueDate = String(item.dueDate || '').trim();
    const amount = Number(item.amount) || 0;
    const compositeKey = `${titleNorm}__${dueDate}__${amount}`;

    if (id && seenIds.has(id)) continue;
    if (compositeKey && seenComposite.has(compositeKey)) continue;

    if (id) seenIds.add(id);
    seenComposite.add(compositeKey);
    unique.push(item);
  }

  return unique;
}

/**
 * Retrieve raw stored fixed expenses from localStorage or default, with auto-deduplication
 */
export function getStoredFixedExpenses() {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('aurum_fixed_expenses');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const clean = deduplicateFixedExpenses(parsed);
        // If duplicates were pruned, update localStorage silently
        if (clean.length !== parsed.length) {
          localStorage.setItem('aurum_fixed_expenses', JSON.stringify(clean));
        }
        return clean;
      }
    } catch (e) {
      console.warn('Failed to parse aurum_fixed_expenses', e);
    }
  }
  return [];
}

/**
 * Calculate which monthly fixed expenses are due within 15 days from today
 */
export function getFixedExpensesDueWithin15Days(fixedExpenses = null) {
  const items = deduplicateFixedExpenses(fixedExpenses || getStoredFixedExpenses());
  if (!Array.isArray(items)) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const results = [];

  for (const exp of items) {
    const dueDay = Number(exp.dueDay) || 1;
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // 1. Candidate in current month
    const daysInThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const validDayThisMonth = Math.min(dueDay, daysInThisMonth);
    const dueDateThisMonth = new Date(currentYear, currentMonth, validDayThisMonth);

    // 2. Candidate in next month
    const daysInNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate();
    const validDayNextMonth = Math.min(dueDay, daysInNextMonth);
    const dueDateNextMonth = new Date(currentYear, currentMonth + 1, validDayNextMonth);

    let targetDate = null;
    let isPendingOverdue = false;

    if (dueDateThisMonth >= today) {
      // Due date is in this month on or after today
      if (exp.status === 'Paid') {
        // Current month is already paid! Next cycle is next month.
        targetDate = dueDateNextMonth;
      } else {
        // Current month is pending and coming up
        targetDate = dueDateThisMonth;
      }
    } else {
      // Due date in this month has passed
      if (exp.status === 'Pending') {
        // Pending bill that was due earlier this month (overdue)
        targetDate = dueDateThisMonth;
        isPendingOverdue = true;
      } else {
        // Already paid for this past month, next cycle is next month
        targetDate = dueDateNextMonth;
      }
    }

    // Difference in calendar days
    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Show if due within 15 days (diffDays between 0 and 15, or recent overdue pending)
    if (diffDays >= -7 && diffDays <= 15) {
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const formattedDueDate = `${yyyy}-${mm}-${dd}`;

      let urgency = 'Medium';
      if (isPendingOverdue || diffDays <= 2) {
        urgency = 'Urgent';
      } else if (diffDays <= 7) {
        urgency = 'High';
      } else {
        urgency = 'Medium';
      }

      results.push({
        id: `fixed-${exp.id}`,
        fixedId: exp.id,
        title: exp.title,
        payee: exp.notes && exp.notes.length > 5 ? exp.notes : `${exp.category} Fixed Commitment`,
        amount: Number(exp.amount || 0),
        dueDate: formattedDueDate,
        diffDays,
        urgency,
        category: exp.category || 'Monthly Fixed',
        status: isPendingOverdue ? 'Overdue' : 'Upcoming',
        isFixedMonthly: true,
        dueDay,
        originalStatus: exp.status,
      });
    }
  }

  return results;
}

/**
 * Single source of truth for all Due Events across the app.
 * Reads ONLY from Fixed Expenses and Payables collections with real due dates.
 * Skips any due already marked "Paid for <month>".
 * Used by Timeline, Home Status, Upcoming Payables, Profile, and AI CFO.
 */
export function getDueEvents(dateRange = {}) {
  const options = typeof dateRange === 'number'
    ? { horizonDays: dateRange }
    : (dateRange || {});

  const now = options.startDate ? new Date(options.startDate) : new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const horizonDays = Number(options.horizonDays ?? 60);

  const endDay = options.endDate
    ? new Date(options.endDate)
    : new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + horizonDays);

  const fixedList = deduplicateFixedExpenses(
    Array.isArray(options.fixedExpenses)
      ? options.fixedExpenses
      : getStoredFixedExpenses()
  );

  let upcomingList = [];
  if (Array.isArray(options.upcomingExpenses)) {
    upcomingList = deduplicateUpcomingExpenses(options.upcomingExpenses);
  } else if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aurum_upcoming_expenses');
    if (saved) {
      try {
        upcomingList = deduplicateUpcomingExpenses(JSON.parse(saved) || []);
      } catch (e) {}
    }
  }

  const events = [];
  const eventsByDayIndex = {};
  const eventsByDate = {};

  // 1. Process Monthly Fixed Expenses across the date range
  for (const exp of fixedList || []) {
    const amount = Number(exp.amount || 0);
    const dueDay = Number(exp.dueDay) || 1;
    if (amount <= 0) continue;

    const startYear = startDay.getFullYear();
    const startMonth = startDay.getMonth();
    const endYear = endDay.getFullYear();
    const endMonth = endDay.getMonth();
    const monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth);

    for (let mOffset = 0; mOffset <= Math.max(0, monthsDiff); mOffset++) {
      const targetYear = startYear;
      const targetMonth = startMonth + mOffset;
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const validDay = Math.min(dueDay, daysInTargetMonth);
      const targetDate = new Date(targetYear, targetMonth, validDay);

      // Check if within [startDay, endDay]
      if (targetDate < startDay || targetDate > endDay) {
        continue;
      }

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const monthKey = `${yyyy}-${mm}`;

      // Check if this fixed expense is already marked "Paid for <month>"
      const isPaidForThisMonth =
        (Array.isArray(exp.paidMonths) && exp.paidMonths.includes(monthKey)) ||
        (exp.lastPaidMonth === monthKey) ||
        (exp.status === 'Paid' && mOffset === 0);

      if (isPaidForThisMonth) {
        continue; // Skip already paid due for this month
      }

      const diffMs = targetDate.getTime() - startDay.getTime();
      const dayIndex = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const eventItem = {
        id: `fixed-${exp.id}-${dateStr}`,
        fixedId: exp.id,
        title: exp.title || `${exp.category} Fixed Commitment`,
        payee: exp.notes && exp.notes.length > 5 ? exp.notes : `${exp.category} Fixed Commitment`,
        amount,
        category: exp.category || 'Monthly Fixed',
        date: dateStr,
        dueDate: dateStr,
        dayIndex,
        diffDays: dayIndex,
        isFixed: true,
        isFixedMonthly: true,
        dueDay,
        urgency: dayIndex <= 3 ? 'Urgent' : (dayIndex <= 7 ? 'High' : 'Medium'),
      };

      events.push(eventItem);
      if (!eventsByDayIndex[dayIndex]) eventsByDayIndex[dayIndex] = [];
      eventsByDayIndex[dayIndex].push(eventItem);

      if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
      eventsByDate[dateStr].push(eventItem);
    }
  }

  // 2. Process One-off Scheduled Payables (e.g. Supplier Invoices, GST)
  for (const up of upcomingList || []) {
    const amount = Number(up.amount || 0);
    if (amount <= 0 || !up.dueDate) continue;

    // Skip dues marked Paid
    if (up.status === 'Paid' || up.status === 'paid') continue;

    // Deduplicate if already linked to a fixed expense
    if (up.fixedId || up.isFixedMonthly) continue;

    const parts = String(up.dueDate).split('T')[0].split('-').map(Number);
    if (parts.length === 3) {
      const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if (targetDate < startDay || targetDate > endDay) continue;

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const diffMs = targetDate.getTime() - startDay.getTime();
      const dayIndex = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const eventItem = {
        id: up.id || `up-${dateStr}`,
        title: up.title || 'Supplier Payable',
        payee: up.payee || up.title || 'Supplier',
        amount,
        category: up.category || 'Supplier Dues',
        date: dateStr,
        dueDate: dateStr,
        dayIndex,
        diffDays: dayIndex,
        isFixed: false,
        isFixedMonthly: false,
        urgency: up.urgency || (dayIndex <= 3 ? 'Urgent' : (dayIndex <= 7 ? 'High' : 'Medium')),
      };

      events.push(eventItem);
      if (!eventsByDayIndex[dayIndex]) eventsByDayIndex[dayIndex] = [];
      eventsByDayIndex[dayIndex].push(eventItem);

      if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
      eventsByDate[dateStr].push(eventItem);
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.dayIndex - b.dayIndex);

  const totalDues = events.reduce((s, e) => s + e.amount, 0);
  const duesWithin15Days = events.filter((e) => e.dayIndex <= 15).reduce((s, e) => s + e.amount, 0);

  // Return augmented array that works as both array and object
  const result = [...events];
  result.events = events;
  result.eventsByDayIndex = eventsByDayIndex;
  result.eventsByDate = eventsByDate;
  result.totalDues = totalDues;
  result.duesWithin15Days = duesWithin15Days;

  return result;
}

/**
 * Toggle fixed expense status (Paid / Pending) and dispatch sync events.
 * Accepts optional dueDateOrMonth to record the specific month/cycle as paid,
 * ensuring dues marked Paid are excluded from future dates.
 */
export function toggleFixedExpenseStatus(fixedId, dueDateOrMonth = null) {
  const current = getStoredFixedExpenses();
  const targetMonthKey = dueDateOrMonth
    ? String(dueDateOrMonth).slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  const updated = current.map((item) => {
    if (item.id === fixedId) {
      const paidMonths = Array.isArray(item.paidMonths) ? [...item.paidMonths] : [];
      let newPaidMonths;
      let newStatus;

      if (paidMonths.includes(targetMonthKey) || (item.status === 'Paid' && !item.paidMonths?.length)) {
        newPaidMonths = paidMonths.filter((m) => m !== targetMonthKey);
        newStatus = newPaidMonths.length > 0 ? 'Paid' : 'Pending';
      } else {
        newPaidMonths = [...paidMonths, targetMonthKey];
        newStatus = 'Paid';
      }

      return {
        ...item,
        status: newStatus,
        paidMonths: newPaidMonths,
        lastPaidMonth: newStatus === 'Paid' ? targetMonthKey : item.lastPaidMonth,
      };
    }
    return item;
  });
  localStorage.setItem('aurum_fixed_expenses', JSON.stringify(updated));
  window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
  window.dispatchEvent(new Event('aurum_expenses_updated'));
  return updated;
}

