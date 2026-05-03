import axios from 'axios';

// Dev:  VITE_API_URL is not set → Vite proxy forwards /api → localhost:5000
// Prod: VITE_API_URL = https://attendance-system-acb5.onrender.com
//       baseURL becomes https://attendance-system-acb5.onrender.com/api
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
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
