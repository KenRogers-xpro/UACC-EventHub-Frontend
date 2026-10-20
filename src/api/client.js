import axios from 'axios';

// Create Axios client with base URL pointing to Render in production or local in dev
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://uacc-eventhub-backend.onrender.com/api'
    : 'http://localhost:5000/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('uacc_admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and trying to access admin route, clear token
      if (
        window.location.pathname !== '/login' &&
        !window.location.pathname.startsWith('/invite')
      ) {
        localStorage.removeItem('uacc_admin_token');
        localStorage.removeItem('uacc_admin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth APIs ──
export const authAPI = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// ── Events APIs ──
export const eventsAPI = {
  getAll: async () => {
    const res = await apiClient.get('/events');
    return res.data;
  },
  getOne: async (eventId) => {
    const res = await apiClient.get(`/events/${eventId}`);
    return res.data;
  },
  create: async (eventData) => {
    const res = await apiClient.post('/events', eventData);
    return res.data;
  },
  update: async (eventId, eventData) => {
    const res = await apiClient.put(`/events/${eventId}`, eventData);
    return res.data;
  },
  delete: async (eventId) => {
    const res = await apiClient.delete(`/events/${eventId}`);
    return res.data;
  },
};

// ── Invitee Management APIs ──
export const inviteesAPI = {
  add: async (eventId, guestData) => {
    const res = await apiClient.post(`/events/${eventId}/invitees`, guestData);
    return res.data;
  },
  remove: async (inviteeId) => {
    const res = await apiClient.delete(`/invitees/${inviteeId}`);
    return res.data;
  },
};

// ── RSVP APIs (Public) ──
export const rsvpAPI = {
  getInvite: async (token) => {
    const res = await apiClient.get(`/invite/${token}`);
    return res.data;
  },
  submitRSVP: async (token, response) => {
    const res = await apiClient.post(`/invite/${token}/respond`, { response });
    return res.data;
  },
  getMaterials: async (token) => {
    const res = await apiClient.get(`/invite/${token}/materials`);
    return res.data;
  },
};

// ── Materials APIs ──
export const materialsAPI = {
  upload: async (eventId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post(`/events/${eventId}/materials`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  delete: async (materialId) => {
    const res = await apiClient.delete(`/materials/${materialId}`);
    return res.data;
  },
};
