import axios from "axios";
import { envConfig } from "./config/env";

// Normalize URL: remove trailing slashes and ensure /api suffix
const normalizeUrl = (url) => {
  const trimmed = url.trim();
  const withoutTrailing = trimmed.replace(/\/+$/, "");
  return withoutTrailing.endsWith("/api")
    ? withoutTrailing
    : `${withoutTrailing}/api`;
};

// Get API base URL based on environment
const getBaseUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  if (backendUrl) {
    return normalizeUrl(backendUrl);
  }

  // Fallback for development without env var
  return "/api";
};

const baseURL = getBaseUrl();

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Log API endpoint in development
if (envConfig.isDev) {
  console.log(
    `[API Config] Environment: ${envConfig.env}, Base URL: ${baseURL}`,
  );
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(err);
  },
);

export default api;

export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    api.patch("/auth/change-password", { currentPassword, newPassword }),
};

export const campaigns = {
  list: (params) => api.get("/campaigns", { params }),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post("/campaigns/create", data),
  update: (id, data) => api.patch(`/campaigns/${id}/update`, data),
};

export const coupons = {
  byCustomer: (mobile, clientId) =>
    api.get(`/coupons/customer/${encodeURIComponent(mobile)}/coupons`, {
      params: clientId ? { clientId } : {},
    }),
  list: (params) => api.get("/coupons", { params }),
  redeem: (data) => api.post("/coupons/redeem", data),
};

export const clients = {
  list: () => api.get("/clients"),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post("/clients", data),
  update: (id, data) => api.patch(`/clients/${id}`, data),
};

export const users = {
  list: (params) => api.get("/users", { params }),
  create: (data) => api.post("/users", data),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  resetPassword: (id, newPassword) =>
    api.patch(`/users/${id}/reset-password`, { newPassword }),
  delete: (id) => api.delete(`/users/${id}`),
};

export const analytics = {
  dashboard: (clientId) =>
    api.get("/analytics/dashboard", { params: clientId ? { clientId } : {} }),
  redemptions: (clientId) =>
    api.get("/analytics/redemptions", { params: clientId ? { clientId } : {} }),
};

export const dining = {
  submit: (data) => api.post("/dining", data),
  exportCSV: (params) =>
    api.get("/dining/export/csv", { params, responseType: "blob" }),
};
