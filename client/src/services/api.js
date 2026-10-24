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
