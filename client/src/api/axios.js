import axios from 'axios';

// 👉 Production + Dev compatible BASE URL
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

console.log('[axios] baseURL:', BASE);

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// 🔐 Attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⚠️ Handle auth errors cleanly
api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/me');

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');

      // 🔥 IMPORTANT: do NOT use window.location.href
      // React Router handle karega redirect
      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject(err);
  }
);

export default api;