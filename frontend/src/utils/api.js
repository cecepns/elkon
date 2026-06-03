import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/elkon/api",
});

// Request interceptor to attach JWT token to authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("elkon_token");
    if (token) {
      config.configure = config.configure || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Reusable helper to format image URLs from backend
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  return `https://api.kingcreativestudio.my.id/elkon${imagePath}`;
};
