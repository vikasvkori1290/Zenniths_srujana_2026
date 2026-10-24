/**
 * Service to sync Monthly Fixed Expenses (from Profile) into Upcoming Expenses (on Home Page)
 * if their due date falls within 15 days.
 */

export const DEFAULT_FIXED_EXPENSES = [
  {
    id: 'fix-1',
    title: 'Commercial Store & Warehouse Rent',
    amount: 22000,
    category: 'Rent',
    dueDay: 5,
    status: 'Paid',
    receiptName: 'Rent_Receipt_Oct2026.pdf',
    notes: 'Paid to Landlord via NEFT transaction',
  },
  {
    id: 'fix-2',
    title: 'Business Equipment & Machinery EMI',
    amount: 14500,
    category: 'EMI',
    dueDay: 10,
    status: 'Paid',
    receiptName: 'HDFC_EMI_Schedule.pdf',
    notes: 'Auto-debited from primary current account',
  },
  {
    id: 'fix-3',
    title: 'Commercial Electricity & Utility Bill',
    amount: 4800,
    category: 'Utilities',
    dueDay: 18,
    status: 'Pending',
    receiptName: null,
    notes: 'BESCOM commercial meter connection',
  },
  {
    id: 'fix-4',
    title: 'Assistant Operator Salary & Stipend',
    amount: 6500,
    category: 'Salaries',
    dueDay: 7,
    status: 'Paid',
    receiptName: 'Salary_Voucher.pdf',
    notes: 'Monthly operating staff payout',
  },
  {
    id: 'fix-5',
    title: 'High-speed Fiber & Cloud Subscriptions',
    amount: 1800,
    category: 'Subscriptions',
    dueDay: 22,
    status: 'Pending',
    receiptName: null,
    notes: 'Airtel Office Broadband + Invoicing SaaS',
  },
];

/**
 * Retrieve raw stored fixed expenses from localStorage or default
 */
export function getStoredFixedExpenses() {
  if (typeof window === 'undefined') return DEFAULT_FIXED_EXPENSES;
  const saved = localStorage.getItem('aurum_fixed_expenses');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('Failed to parse aurum_fixed_expenses', e);
    }
  }
  return DEFAULT_FIXED_EXPENSES;
}

/**
 * Calculate which monthly fixed expenses are due within 15 days from today
 */
export function getFixedExpensesDueWithin15Days(fixedExpenses = null) {
  const items = fixedExpenses || getStoredFixedExpenses();
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
 * Toggle fixed expense status (Paid / Pending) and dispatch sync events
 */
export function toggleFixedExpenseStatus(fixedId) {
  const current = getStoredFixedExpenses();
  const updated = current.map((item) =>
    item.id === fixedId
      ? { ...item, status: item.status === 'Paid' ? 'Pending' : 'Paid' }
      : item
  );
  localStorage.setItem('aurum_fixed_expenses', JSON.stringify(updated));
  window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
  window.dispatchEvent(new Event('aurum_expenses_updated'));
  return updated;
}
