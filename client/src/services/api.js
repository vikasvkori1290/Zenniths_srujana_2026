import {
  deduplicateFixedExpenses,
  deduplicateUpcomingExpenses,
  deduplicateEKhataCustomers,
  deduplicateDailyIncomeRecords,
} from './expenseSync.js';

export const PROD_BACKEND_URL = 'https://zenniths-srujana-2026.vercel.app/api/v1';

export const API_BASE = (() => {
  let url = import.meta.env?.VITE_API_URL;
  if (!url && typeof window !== 'undefined') {
    const stored = localStorage.getItem('aurum_backend_url');
    // Ignore legacy localhost strings that break mobile builds
    if (stored && !stored.includes('localhost') && !stored.includes('127.0.0.1')) {
      url = stored;
    }
  }

  if (url) {
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (cleanUrl.endsWith('/api/v1')) return cleanUrl;
    if (cleanUrl.endsWith('/api')) return cleanUrl + '/v1';
    return cleanUrl + '/api/v1';
  }

  // Always use the Vercel production backend so both the mobile APK and web application
  // share the identical live database and business state
  return PROD_BACKEND_URL;
})();

/**
 * Returns authorization headers with bearer token if logged in
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('aurum_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch backend and database health status
 */
export async function getHealthStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: {
        status: 'offline',
        database: { connected: false, status: 'unreachable' },
      },
    };
  }
}

/**
 * Fetch complete financial summary from MongoDB Atlas for the authenticated user
 */
export async function getFinanceSummary() {
  try {
    const res = await fetch(`${API_BASE}/finance/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Finance summary fetch failed, using local storage fallback:', err.message);
    return { success: false, isDbConnected: false };
  }
}

/**
 * Sync entire eKhata Customer list to MongoDB Atlas for the current user
 */
export async function syncEKhataListToDb(customers) {
  try {
    const cleanCustomers = deduplicateEKhataCustomers(customers || []);
    const res = await fetch(`${API_BASE}/finance/ekhata/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customers: cleanCustomers }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to sync eKhata list to MongoDB:', err);
    return { success: false };
  }
}

/**
 * Sync single eKhata customer to MongoDB Atlas
 */
export async function syncEKhataCustomerToDb(customer) {
  try {
    const res = await fetch(`${API_BASE}/finance/ekhata`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Delete eKhata customer from MongoDB Atlas
 */
export async function deleteEKhataCustomerFromDb(idNumber) {
  try {
    const res = await fetch(`${API_BASE}/finance/ekhata/${idNumber}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Sync all Fixed Expenses to MongoDB Atlas for the current user
 */
export async function syncFixedExpensesToDb(expenses) {
  try {
    const res = await fetch(`${API_BASE}/finance/fixed-expense/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ expenses }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Sync all Upcoming Scheduled Payables to MongoDB Atlas for the current user
 */
export async function syncUpcomingExpensesToDb(expenses) {
  try {
    const res = await fetch(`${API_BASE}/finance/upcoming-expense/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ expenses }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Directly fetch user's Upcoming Scheduled Payables from MongoDB Atlas
 */
export async function fetchUpcomingExpensesFromDb() {
  try {
    const res = await fetch(`${API_BASE}/finance/upcoming-expense`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.upcomingExpenses)) {
      const clean = deduplicateUpcomingExpenses(data.upcomingExpenses);
      localStorage.setItem('aurum_upcoming_expenses', JSON.stringify(clean));
      window.dispatchEvent(new Event('aurum_expenses_updated'));
      window.dispatchEvent(new Event('storage'));
      return clean;
    }
  } catch (err) {
    console.warn('Failed to fetch upcoming expenses from DB:', err);
  }
  return null;
}

/**
 * Directly fetch user's Fixed Expenses from MongoDB Atlas
 */
export async function fetchFixedExpensesFromDb() {
  try {
    const res = await fetch(`${API_BASE}/finance/fixed-expense`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.fixedExpenses)) {
      const clean = deduplicateFixedExpenses(data.fixedExpenses);
      localStorage.setItem('aurum_fixed_expenses', JSON.stringify(clean));
      window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
      window.dispatchEvent(new Event('storage'));
      return clean;
    }
  } catch (err) {
    console.warn('Failed to fetch fixed expenses from DB:', err);
  }
  return null;
}

/**
 * Directly fetch user's Daily Income History from MongoDB Atlas
 */
export async function fetchDailyIncomeFromDb() {
  try {
    const res = await fetch(`${API_BASE}/finance/income`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.dailyIncome)) {
      const records = deduplicateDailyIncomeRecords(data.dailyIncome);
      localStorage.setItem('aurum_all_income_records', JSON.stringify(records));
      const todayStr = new Date().toISOString().split('T')[0];
      const todayItems = records.filter((i) => i.date === todayStr);
      localStorage.setItem('aurum_today_income', JSON.stringify(todayItems));
      window.dispatchEvent(new Event('aurum_income_updated'));
      window.dispatchEvent(new Event('storage'));
      return records;
    }
  } catch (err) {
    console.warn('Failed to fetch daily income from DB:', err);
  }
  return null;
}

/**
 * Sync Daily Income Records to MongoDB Atlas for the current user
 */
export async function syncDailyIncomeToDb(records) {
  try {
    const cleanRecords = deduplicateDailyIncomeRecords(records || []);
    const res = await fetch(`${API_BASE}/finance/income/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records: cleanRecords }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Sync Cashflow Settings to MongoDB Atlas for the current user
 */
export async function syncSettingsToDb(settings) {
  try {
    const res = await fetch(`${API_BASE}/finance/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Sync Merchant Business Profile updates to MongoDB Atlas
 */
export async function syncProfileToDb(profileData) {
  try {
    const res = await fetch(`${API_BASE}/finance/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to sync profile to DB:', err);
    return { success: false };
  }
}

let _lastDbLoadTime = 0;

/**
 * Load user's data from MongoDB Atlas into application state and clear hardcoded defaults
 */
export async function loadUserDataFromDb(force = false) {
  if (!force && Date.now() - _lastDbLoadTime < 30000) {
    return null; // Prevent UI freeze from redundant back-to-back summary loads
  }
  _lastDbLoadTime = Date.now();
  const summaryRes = await getFinanceSummary();
  if (summaryRes && summaryRes.success && summaryRes.data) {
    const { ekhata, fixedExpenses, upcomingExpenses, dailyIncome, cashflowSettings, userProfile } = summaryRes.data;

    // Set eKhata (deduplicated)
    const cleanKhata = deduplicateEKhataCustomers(ekhata || []);
    localStorage.setItem('aurum_ekhata_data', JSON.stringify(cleanKhata));
    localStorage.setItem('aurum_ekhata_customers', JSON.stringify(cleanKhata));
    window.dispatchEvent(new Event('aurum_ekhata_updated'));

    // Set fixed expenses (deduplicated)
    const cleanFixed = deduplicateFixedExpenses(fixedExpenses || []);
    localStorage.setItem('aurum_fixed_expenses', JSON.stringify(cleanFixed));
    window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));

    // Set upcoming expenses (deduplicated)
    const cleanUpcoming = deduplicateUpcomingExpenses(upcomingExpenses || []);
    localStorage.setItem('aurum_upcoming_expenses', JSON.stringify(cleanUpcoming));
    window.dispatchEvent(new Event('aurum_expenses_updated'));

    // Set daily income (deduplicated)
    const cleanIncome = deduplicateDailyIncomeRecords(dailyIncome || []);
    localStorage.setItem('aurum_all_income_records', JSON.stringify(cleanIncome));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayItems = cleanIncome.filter((i) => i.date === todayStr);
    localStorage.setItem('aurum_today_income', JSON.stringify(todayItems));
    window.dispatchEvent(new Event('aurum_income_updated'));

    // Set cashflow settings if present
    if (cashflowSettings) {
      localStorage.setItem('aurum_cashflow_settings', JSON.stringify(cashflowSettings));
      window.dispatchEvent(new Event('aurum_cashflow_settings_updated'));
    }

    // Set user business profile if present
    if (userProfile) {
      const curProf = JSON.parse(localStorage.getItem('aurum_profile_info') || '{}');
      const updatedProf = {
        ...curProf,
        name: userProfile.name || curProf.name,
        businessName: userProfile.businessName || curProf.businessName,
        businessType: userProfile.businessType || curProf.businessType,
        dailyGoal: userProfile.dailyGoal !== undefined ? userProfile.dailyGoal : curProf.dailyGoal,
        phone: userProfile.phone || curProf.phone,
        email: userProfile.email || curProf.email,
        upiId: userProfile.upiId || curProf.upiId,
      };
      localStorage.setItem('aurum_profile_info', JSON.stringify(updatedProf));
      if (userProfile.businessType) {
        localStorage.setItem('aurum_business_type', userProfile.businessType);
      }
      try {
        const u = JSON.parse(localStorage.getItem('aurum_auth_user') || '{}');
        u.name = userProfile.name || u.name;
        u.businessName = userProfile.businessName || u.businessName;
        u.businessType = userProfile.businessType || u.businessType;
        u.dailyGoal = userProfile.dailyGoal !== undefined ? userProfile.dailyGoal : u.dailyGoal;
        u.phone = userProfile.phone || u.phone;
        u.upiId = userProfile.upiId || u.upiId;
        localStorage.setItem('aurum_auth_user', JSON.stringify(u));
      } catch (e) {}
      window.dispatchEvent(new Event('aurum_profile_updated'));
      window.dispatchEvent(new Event('aurum_business_type_updated'));
    }

    window.dispatchEvent(new Event('storage'));
    return summaryRes.data;
  }
  return null;
}
