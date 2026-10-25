export const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api/v1';

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
    const res = await fetch(`${API_BASE}/finance/ekhata/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customers }),
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
 * Sync Daily Income Records to MongoDB Atlas for the current user
 */
export async function syncDailyIncomeToDb(records) {
  try {
    const res = await fetch(`${API_BASE}/finance/income/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records }),
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
 * Load user's data from MongoDB Atlas into application state and clear hardcoded defaults
 */
export async function loadUserDataFromDb() {
  const summaryRes = await getFinanceSummary();
  if (summaryRes && summaryRes.success && summaryRes.data) {
    const { ekhata, fixedExpenses, upcomingExpenses, dailyIncome, cashflowSettings } = summaryRes.data;

    // Set eKhata
    localStorage.setItem('aurum_ekhata_data', JSON.stringify(ekhata || []));
    window.dispatchEvent(new Event('aurum_ekhata_updated'));

    // Set fixed expenses
    localStorage.setItem('aurum_fixed_expenses', JSON.stringify(fixedExpenses || []));
    window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));

    // Set upcoming expenses
    localStorage.setItem('aurum_upcoming_expenses', JSON.stringify(upcomingExpenses || []));
    window.dispatchEvent(new Event('aurum_expenses_updated'));

    // Set daily income
    localStorage.setItem('aurum_all_income_records', JSON.stringify(dailyIncome || []));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayItems = (dailyIncome || []).filter((i) => i.date === todayStr);
    localStorage.setItem('aurum_today_income', JSON.stringify(todayItems));
    window.dispatchEvent(new Event('aurum_income_updated'));

    // Set cashflow settings if present
    if (cashflowSettings) {
      localStorage.setItem('aurum_cashflow_settings', JSON.stringify(cashflowSettings));
      window.dispatchEvent(new Event('aurum_cashflow_settings_updated'));
    }

    window.dispatchEvent(new Event('storage'));
    return summaryRes.data;
  }
  return null;
}
