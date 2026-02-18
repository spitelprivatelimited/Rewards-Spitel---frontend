import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const campaigns = {
  list: (params) => api.get('/campaigns', { params }),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns/create', data),
  update: (id, data) => api.patch(`/campaigns/${id}/update`, data),
};

export const coupons = {
  byCustomer: (mobile, clientId) => api.get(`/coupons/customer/${encodeURIComponent(mobile)}/coupons`, { params: clientId ? { clientId } : {} }),
  list: (params) => api.get('/coupons', { params }),
  redeem: (data) => api.post('/coupons/redeem', data),
};

export const clients = {
  list: () => api.get('/clients'),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.patch(`/clients/${id}`, data),
};

export const analytics = {
  dashboard: (clientId) => api.get('/analytics/dashboard', { params: clientId ? { clientId } : {} }),
  redemptions: (clientId) => api.get('/analytics/redemptions', { params: clientId ? { clientId } : {} }),
};

export const dining = {
  submit: (data) => api.post('/dining', data),
};
