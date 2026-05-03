import axios from 'axios';

// 🔥 Backend URL (Render)
const BASE_URL = "https://attendance-system-acb5.onrender.com/api";

console.log("🌐 API BASE URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000, // ⏱️ avoid hanging requests
});

// 🔐 Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// 📥 Handle responses globally
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.config.url);
    return response;
  },
  (error) => {
    const url = error.config?.url || "";
    const isAuthRoute =
      url.includes("/auth/login") || url.includes("/auth/me");

    console.error("❌ API Error:", {
      url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });

    // 🔒 Auto logout on 401 (except login/me)
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(error);
  }
);

export default api;