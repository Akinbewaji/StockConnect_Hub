// API Base URL - defaults to localhost:5000 for development
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_URL = API_BASE_URL;

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  // Prepend API base URL if the URL doesn't start with http
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response;
};
