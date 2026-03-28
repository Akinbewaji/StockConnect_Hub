import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_URL = API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authFetch = async (url: string, options: any = {}) => {
  const method = (options.method || "GET").toLowerCase();
  const data = options.body ? JSON.parse(options.body) : undefined;
  
  // Map fetch-like options to axios options
  const config = {
    method,
    url,
    data,
    ...options,
  };

  try {
    const response = await api(config);
    // Return a fetch-like response object for backward compatibility
    return {
      ok: true,
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      blob: async () => new Blob([JSON.stringify(response.data)], { type: 'application/json' }),
      headers: {
        get: (name: string) => response.headers[name.toLowerCase()],
      },
    };
  } catch (error: any) {
    if (error.response) {
      return {
        ok: false,
        status: error.response.status,
        json: async () => error.response.data,
        text: async () => JSON.stringify(error.response.data),
        blob: async () => new Blob([JSON.stringify(error.response.data)], { type: 'application/json' }),
        headers: {
          get: (name: string) => error.response.headers[name.toLowerCase()],
        },
      };
    }

    throw error;
  }
};

export default api;

