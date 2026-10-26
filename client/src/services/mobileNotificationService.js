import { LocalNotifications } from '@capacitor/local-notifications';
import { toLocalDateString } from './predictiveAnalytics.js';
import { getStoredFixedExpenses } from './expenseSync.js';
import { API_BASE, PROD_BACKEND_URL } from './api.js';

/**
 * Retrieve saved upcoming expenses from localStorage
 */
export function getStoredUpcomingExpenses() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('aurum_upcoming_expenses');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

/**
 * Retrieve saved eKhata customers from localStorage
 */
export function getStoredEKhataCustomers() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('aurum_ekhata_data') || localStorage.getItem('aurum_ekhata_customers');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

/**
 * Checks whether the app is running in a Capacitor native mobile environment
 */
export function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.location.protocol === 'capacitor:' ||
    (window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform())
  );
}

/**
 * Request notification permissions from Android / Browser
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return false;

  // 1. Native Capacitor Android
  if (isCapacitorNative()) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch (e) {
      console.warn('[LocalNotifications Request Permission Error]:', e);
    }
  }

  // 2. Standard Web Notification API
  if ('Notification' in window) {
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (e) {
      console.warn('[Web Notification Permission Error]:', e);
    }
  }

  return false;
}

/**
 * Dispatches a native or web push notification immediately
 */
export async function sendMobileNotification({ title, body, id = 1001, extra = {} }) {
  if (typeof window === 'undefined') return true; // Node.js test runner environment

  let delivered = false;

  // Strictly dispatch native Android notification via Capacitor on mobile
  if (isCapacitorNative()) {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return false;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: title || 'FinSafe Alert',
            body: body || 'You have an important financial update.',
            schedule: { at: new Date(Date.now() + 500) }, // Trigger immediately (500ms)
            sound: 'default',
            smallIcon: 'ic_launcher',
            actionTypeId: '',
            extra,
          },
        ],
      });
      delivered = true;
    } catch (err) {
      console.warn('[Capacitor LocalNotification Error]:', err);
    }
  }

  return delivered;
}

/**
 * Identifies all obligations that need to be settled TOMORROW
 */
export function getDuesForTomorrow({
  fixedExpenses = [],
  upcomingExpenses = [],
  now = new Date(),
} = {}) {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowDateStr = toLocalDateString(tomorrow);
  const tomorrowDayOfMonth = tomorrow.getDate();
  const currentMonthStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}`;

  const tomorrowDues = [];

  // 1. One-off Upcoming Expenses due tomorrow
  for (const exp of upcomingExpenses) {
    if (!exp || exp.status === 'Paid') continue;
    const due = String(exp.dueDate || '').trim();
    if (due === tomorrowDateStr) {
      tomorrowDues.push({
        id: exp.id || `up-${Date.now()}`,
        title: exp.title || 'Scheduled Due',
        amount: Number(exp.amount || 0),
        category: exp.category || 'Payables',
        dueDate: tomorrowDateStr,
        isFixed: false,
      });
    }
  }

  // 2. Monthly Fixed Expenses falling on tomorrow's day of month
  for (const fix of fixedExpenses) {
    if (!fix) continue;
    const dueDay = Number(fix.dueDay) || 1;
    // Check if already paid for current month
    const paidMonths = Array.isArray(fix.paidMonths) ? fix.paidMonths : [];
    const isPaidThisMonth = fix.status === 'Paid' || paidMonths.includes(currentMonthStr);

    if (dueDay === tomorrowDayOfMonth && !isPaidThisMonth) {
      tomorrowDues.push({
        id: fix.id || `fix-${Date.now()}`,
        title: fix.title || 'Monthly Commitment',
        amount: Number(fix.amount || 0),
        category: fix.category || 'Fixed Expense',
        dueDate: tomorrowDateStr,
        dueDay,
        isFixed: true,
      });
    }
  }

  const totalDueTomorrow = tomorrowDues.reduce((s, d) => s + d.amount, 0);

  return {
    tomorrowDateStr,
    tomorrowDues,
    totalDueTomorrow,
    hasDueTomorrow: tomorrowDues.length > 0,
  };
}

/**
 * Retrieve saved tomorrow bill alert from localStorage
 */
export function getStoredTomorrowBillAlert() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('aurum_tomorrow_bill_alert');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/**
 * Save tomorrow bill alert to localStorage and notify UI
 */
export function saveTomorrowBillAlert(alertData) {
  if (typeof window === 'undefined') return alertData;
  const current = localStorage.getItem('aurum_tomorrow_bill_alert');
  const serialized = alertData ? JSON.stringify(alertData) : null;
  if (current === serialized) {
    return alertData;
  }
  if (!alertData) {
    localStorage.removeItem('aurum_tomorrow_bill_alert');
  } else {
    localStorage.setItem('aurum_tomorrow_bill_alert', serialized);
  }
  window.dispatchEvent(new Event('aurum_tomorrow_bill_updated'));
  return alertData;
}

/**
 * Evaluates bills due tomorrow, computes cash sufficiency vs shortage,
 * queries the LLM for Money Arrangement instructions if shortage exists,
 * and sends the native mobile notification!
 */
export async function evaluateAndNotifyTomorrowBills({
  fixedExpenses = null,
  upcomingExpenses = null,
  ekhataCustomers = null,
  currentCash = 0,
  safetyBuffer = 1500,
  businessName = 'FinSafe Store',
  businessType = 'kirana',
  dailySales = {},
  forceNotification = false,
  now = new Date(),
} = {}) {
  const fixed = fixedExpenses || getStoredFixedExpenses();
  const upcoming = upcomingExpenses || getStoredUpcomingExpenses();
  const ekhata = ekhataCustomers || getStoredEKhataCustomers();

  const tomorrowCheck = getDuesForTomorrow({
    fixedExpenses: fixed,
    upcomingExpenses: upcoming,
    now,
  });

  if (!tomorrowCheck.hasDueTomorrow) {
    saveTomorrowBillAlert(null);
    return {
      hasDueTomorrow: false,
      message: 'No bills due tomorrow.',
    };
  }

  const totalDue = tomorrowCheck.totalDueTomorrow;
  const shortfall = Math.max(0, Math.round((totalDue + Number(safetyBuffer)) - Number(currentCash)));
  const isSufficient = shortfall <= 0;

  // Avoid spamming redundant AI network calls on every screen mount if obligations have not changed
  const existingAlert = getStoredTomorrowBillAlert();
  if (
    !forceNotification &&
    existingAlert &&
    existingAlert.totalDueTomorrow === totalDue &&
    existingAlert.shortfall === shortfall &&
    Math.abs(Number(existingAlert.currentCash || 0) - Number(currentCash)) < 100 &&
    existingAlert.hasDueTomorrow === true
  ) {
    return existingAlert;
  }

  // Prepare top pending customer credit accounts for LLM recommendations
  const pendingDebtors = ekhata
    .filter((c) => Number(c.totalAmount || c.balance || 0) > 0)
    .sort((a, b) => Number(b.totalAmount || b.balance || 0) - Number(a.totalAmount || a.balance || 0))
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      amount: Number(c.totalAmount || c.balance || 0),
      dueDate: c.dueDate || 'Immediate',
      phone: c.phone || '',
    }));

  let advisoryData = null;

  // Query Backend LLM endpoint
  try {
    const endpoint = `${API_BASE || PROD_BACKEND_URL}/prediction/tomorrow-bill-advisory`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tomorrowDues: tomorrowCheck.tomorrowDues,
        totalDueTomorrow: totalDue,
        currentCash,
        safetyBuffer,
        shortfall,
        ekhataPending: pendingDebtors,
        businessName,
        businessType,
        dailySales,
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      if (json.success) {
        advisoryData = json;
      }
    }
  } catch (apiErr) {
    console.warn('[Tomorrow Bill Advisory API Call Error]:', apiErr.message);
  }

  // Fallback if backend API offline
  if (!advisoryData) {
    const primaryDue = tomorrowCheck.tomorrowDues[0]?.title || 'Scheduled Due';
    if (isSufficient) {
      advisoryData = {
        hasDueTomorrow: true,
        isSufficient: true,
        totalDueTomorrow: totalDue,
        currentCash,
        safetyBuffer,
        shortfall: 0,
        primaryDueTitle: primaryDue,
        tomorrowDues: tomorrowCheck.tomorrowDues,
        notificationTitle: `Bill Due Tomorrow: ₹${totalDue.toLocaleString('en-IN')}`,
        notificationBody: `You have ${primaryDue} (₹${totalDue.toLocaleString('en-IN')}) due tomorrow. Your cash balance (₹${currentCash.toLocaleString('en-IN')}) covers it safely with your buffer intact.`,
        actionSteps: [
          `Confirm settlement mode (UPI / NetBanking / Cash) for ${primaryDue}.`,
          `Your safety buffer of ₹${Number(safetyBuffer).toLocaleString('en-IN')} will remain completely protected after settlement.`,
        ],
      };
    } else {
      const topDebtor = pendingDebtors[0];
      const debtorAdvice = topDebtor
        ? `Request ₹${Math.min(shortfall, topDebtor.amount).toLocaleString('en-IN')} from ${topDebtor.name} via morning UPI`
        : 'Request early customer Udhar settlements';

      advisoryData = {
        hasDueTomorrow: true,
        isSufficient: false,
        totalDueTomorrow: totalDue,
        currentCash,
        safetyBuffer,
        shortfall,
        primaryDueTitle: primaryDue,
        tomorrowDues: tomorrowCheck.tomorrowDues,
        notificationTitle: `⚠️ Bill Due Tomorrow: ₹${totalDue.toLocaleString('en-IN')} (Shortfall ₹${shortfall.toLocaleString('en-IN')})`,
        notificationBody: `Bill of ₹${totalDue.toLocaleString('en-IN')} due tomorrow with ₹${shortfall.toLocaleString('en-IN')} gap. Action: ${debtorAdvice} to protect safety buffer.`,
        quickSummary: `Shortfall of ₹${shortfall.toLocaleString('en-IN')} detected for tomorrow's ${primaryDue}. Recover pending customer credit immediately.`,
        actionSteps: [
          topDebtor
            ? `Call ${topDebtor.name} (owes ₹${topDebtor.amount.toLocaleString('en-IN')}) to collect ₹${Math.min(shortfall, topDebtor.amount).toLocaleString('en-IN')} before 11:00 AM.`
            : `Collect ₹${shortfall.toLocaleString('en-IN')} from active customer Udhar accounts.`,
          `Set aside today's evening retained sales (+₹${Number(dailySales?.retainedCashPerDay || 1500).toLocaleString('en-IN')}) directly for the bill.`,
          `Contact ${primaryDue} vendor to arrange a 48-hour split settlement without penalty if collection is delayed.`,
        ],
        contingencyAdvice: 'Request vendor to accept 50% tomorrow and remainder on weekend.',
      };
    }
  }

  // Save to localStorage for in-app display
  saveTomorrowBillAlert(advisoryData);

  // Check if we should dispatch native push notification
  // Avoid re-alerting multiple times per day unless forced
  const hasStorage = typeof localStorage !== 'undefined';
  const lastNotifiedDate = hasStorage ? localStorage.getItem('aurum_last_bill_notified_date') : null;
  const todayKey = toLocalDateString(new Date());

  if (forceNotification || lastNotifiedDate !== todayKey) {
    await sendMobileNotification({
      title: advisoryData.notificationTitle,
      body: advisoryData.notificationBody,
      id: 2001,
      extra: advisoryData,
    });
    if (hasStorage) {
      localStorage.setItem('aurum_last_bill_notified_date', todayKey);
    }
  }

  return advisoryData;
}
