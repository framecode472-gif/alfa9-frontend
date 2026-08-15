// Shared API helper for member-facing pages (Deposit, Withdraw, Notification, etc).
// Auth.jsx stores the real JWT here after login/register: localStorage 'alfa9_token'.
//
// API_BASE is "smart": on Vercel (or any host where the VITE_API_URL env var is
// set) it points at the live Railway backend. Locally, where that env var isn't
// set, it automatically falls back to localhost:5000 — so this same file works
// unchanged in both places, no manual edits needed when switching between them.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * @param {string} endpoint - e.g. '/user/profile'
 * @param {object} options - fetch options. Pass `body` as a plain object
 *   for JSON requests, or as a FormData instance for file uploads
 *   (Content-Type is left unset so the browser sets the multipart boundary).
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('alfa9_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: isFormData || !options.body ? options.body : JSON.stringify(options.body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // ===== SINGLE-DEVICE SESSION KICK =====
    // Backend sends this specific code when the account was logged into on
    // another device — this session is now stale. Force this browser back
    // to the login screen instead of just showing an error toast.
    if (data.code === 'SESSION_INVALIDATED') {
      localStorage.removeItem('alfa9_token');
      localStorage.removeItem('alfa9_user');
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }
    throw new Error(data.message || data.error || 'Something went wrong');
  }
  return data;
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('alfa9_user') || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('alfa9_token');
}