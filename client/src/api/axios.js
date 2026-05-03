import axios from 'axios';

// Hardcoded Render backend URL — works in all environments without
// relying on VITE_API_URL being resolved correctly at build time.
// Dev proxy in vite.config.js is still used for local development
// because import.meta.env.DEV is true and Vite rewrites /api calls.
const RENDER_URL = 'https://attendance-system-acb5.onrender.com';

const BASE = import.meta.env.DEV
  ? '/api'                    // dev: Vite proxy → localhost:5000
  : `${RENDER_URL}/api`;      // prod: direct to Render

console.log('[axios] mode:', import.meta.env.MODE, '| baseURL:', BASE);

const api = axios.create({
  baseURL:         BASE,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/me');
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;
