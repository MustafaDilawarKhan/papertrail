// Central configuration for the API base URL
// Uses the VITE_API_URL environment variable if present, otherwise defaults to local
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default API_BASE_URL;
