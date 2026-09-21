  // Only 401 (no valid session) is an AuthError, which signs the user out. 403 means the
  // account is fine but lacks the role, so it surfaces as an ordinary message.
  if (response.status === 401) {
    throw new AuthError(body?.error || 'Sign in required.');
  }// Public API host. The data API is the PHP endpoint below.
export const API_BASE_URL = 'http://stephen123.mooo.com';

const REQUEST_TIMEOUT_MS = 12000;

let authToken = '';
export const setAuthToken = token => { authToken = token || ''; };

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

const endpoint = (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${API_BASE_URL}/pinay_actresses.php${query ? `?${query}` : ''}`;
};

async function request(params, options = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers };
  if (authToken) {
    // Both headers on purpose: some shared hosts strip Authorization before PHP sees it.
    headers.Authorization = `Bearer ${authToken}`;
    headers['X-Auth-Token'] = authToken;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(endpoint(params), { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The registry took too long to respond.');
    throw new Error('Could not reach the registry. Check your connection.');
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = null; }
  }
  if (response.status === 401) {
    throw new AuthError(body?.error || 'Admin login required.');
  }
  if (!response.ok) {
    throw new Error(body?.error || body?.status_message || `Registry error (${response.status}).`);
  }
  return body;
}

const PAGE_SIZE = 50;

/**
 * Fetches the whole registry a page at a time so the first screen can render before every
 * biography has downloaded. onPage(rowsSoFar, total) fires after each page. A server that
 * predates pagination answers with a plain array, which is accepted as the complete list.
 */
async function fetchAllPages(name, onPage) {
  let rows = [];
  const seen = new Set();
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const page = await request({ name, limit: PAGE_SIZE, offset });
    if (Array.isArray(page)) {
      onPage?.(page, page.length);
      return page;
    }
    const fresh = (page.items || []).filter(r => !seen.has(String(r.id)));
    fresh.forEach(r => seen.add(String(r.id)));
    rows = rows.concat(fresh);
    total = Number(page.total) || 0;
    offset += PAGE_SIZE;
    onPage?.(rows, total);
    if (!page.items?.length) break;
  }
  return rows;
}

export const actressApi = {
  getAll: (name = '', onPage) => fetchAllPages(name, onPage),
  getById: id => request({ id }),
  create: actress => request({}, { method: 'POST', body: JSON.stringify(actress) }),
  update: (id, actress) => request({ id }, { method: 'PUT', body: JSON.stringify(actress) }),
  remove: id => request({ id }, { method: 'DELETE' }),
};

export const authApi = {
  register: (username, password, displayName) =>
    request({ action: 'register' }, { method: 'POST', body: JSON.stringify({ username, password, display_name: displayName }) }),
  login: (username, password) => request({ action: 'login' }, { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request({ action: 'me' }),
  // Invalidates every token for the account on the server (all devices).
  logout: () => request({ action: 'logout' }, { method: 'POST' }),
  changePassword: (current, next) => request({ action: 'password' }, { method: 'PUT', body: JSON.stringify({ current, next }) }),
  updateProfile: profile => request({ action: 'profile' }, { method: 'PUT', body: JSON.stringify(profile) }),
  getFavorites: () => request({ action: 'favorites' }),
  setFavorites: ids => request({ action: 'favorites' }, { method: 'PUT', body: JSON.stringify({ ids }) }),
  mySubmissions: () => request({ action: 'mine' }),
};

export const reviewApi = {
  list: id => request({ action: 'reviews', id }),
  submit: (id, rating, comment) => request({ action: 'reviews', id }, { method: 'PUT', body: JSON.stringify({ rating, comment }) }),
  remove: (id, reviewId) => request({ action: 'reviews', id, review_id: reviewId }, { method: 'DELETE' }),
};

export const notificationApi = {
  list: () => request({ action: 'notifications' }),
  add: (tone, message, actressId) =>
    request({ action: 'notifications' }, { method: 'POST', body: JSON.stringify({ tone, message, actress_id: actressId ?? null }) }),
  markAllRead: () => request({ action: 'notifications' }, { method: 'PUT' }),
  clear: () => request({ action: 'notifications' }, { method: 'DELETE' }),
};
