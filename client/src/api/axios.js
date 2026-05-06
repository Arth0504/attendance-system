import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch (err) {
    console.error('Failed to parse user from localStorage:', err);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
