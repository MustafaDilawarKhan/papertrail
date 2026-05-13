// Central API configuration
// In development: set VITE_API_BASE_URL in .env.local
// In production: set VITE_API_BASE_URL in your deployment environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://aidbackend.vercel.app";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("aid_token");
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  const rawText = await response.text();
  const data = rawText ? (() => {
    try { return JSON.parse(rawText); } catch { return rawText; }
  })() : null;

  if (!response.ok) {
    const detail = data && typeof data === "object" && data.detail ? data.detail : data;
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return data;
}

export default API_BASE_URL;
