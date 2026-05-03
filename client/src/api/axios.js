import axios from 'axios';

// Dev:  VITE_API_URL not set → Vite proxy forwards /api → localhost:5000
// Prod: VITE_API_URL = https://attendance-system-acb5.onrender.com
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

console.log('[axios] baseURL:', BASE);

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
      // Dispatch a custom event — AuthContext listens and calls React Router navigate.
      // Never use window.location.href here: it bypasses Vercel's SPA rewrite
      // and causes a hard 404 on the CDN before index.html is served.
      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject(err);
  }
);

export default api;
