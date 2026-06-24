// Use absolute URL if provided (for Sockets), otherwise fallback to the Render URL for production
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://intelmeet-backend.onrender.com';

export default API_BASE_URL;
