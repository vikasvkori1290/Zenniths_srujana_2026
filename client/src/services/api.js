const API_BASE = '/api/v1';

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
 * Fetch complete financial summary from MongoDB Atlas
 */
export async function getFinanceSummary() {
  try {
    const res = await fetch(`${API_BASE}/finance/summary`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Finance summary fetch failed, using local storage fallback:', err.message);
    return { success: false, isDbConnected: false };
  }
}

/**
 * Sync eKhata customer to MongoDB Atlas
 */
export async function syncEKhataCustomerToDb(customer) {
  try {
    const res = await fetch(`${API_BASE}/finance/ekhata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to sync eKhata customer to MongoDB Atlas:', err);
    return { success: false };
  }
}

/**
 * Sync Fixed Expense to MongoDB Atlas
 */
export async function syncFixedExpenseToDb(expense) {
  try {
    const res = await fetch(`${API_BASE}/finance/fixed-expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Sync Upcoming Scheduled Expense to MongoDB Atlas
 */
export async function syncUpcomingExpenseToDb(expense) {
  try {
    const res = await fetch(`${API_BASE}/finance/upcoming-expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Fetch all items with optional filters
 */
export async function getItems(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All') query.append('category', params.category);
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
  if (params.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/items${queryString}`);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to fetch items (${res.status})`);
  }
  return await res.json();
}

/**
 * Create a new item
 */
export async function createItem(itemData) {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to create item (${res.status})`);
  }
  return await res.json();
}

/**
 * Update an existing item
 */
export async function updateItem(id, itemData) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to update item (${res.status})`);
  }
  return await res.json();
}

/**
 * Delete an item
 */
export async function deleteItem(id) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to delete item (${res.status})`);
  }
  return await res.json();
}
