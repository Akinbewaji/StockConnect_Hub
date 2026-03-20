import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Ensure the URL is properly formatted for the API
if (API_BASE_URL) {
  // Remove trailing slash if present
  if (API_BASE_URL.endsWith('/')) {
    API_BASE_URL = API_BASE_URL.slice(0, -1);
  }
  
  // Append /api if it's not already there and if we're not using a relative path that already includes it
  // or if the user provided just the base domain
  if (!API_BASE_URL.endsWith('/api') && !API_BASE_URL.startsWith('/')) {
    // If it's a full URL without /api, append it
    if (API_BASE_URL.startsWith('http')) {
      API_BASE_URL += '/api';
    }
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
