import axios from 'axios';

// Get API URL from env or fallback to localhost for development
// Note: In Vite, env variables must be prefixed with VITE_
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Optional: Add request interceptor for tokens if we want to centralize it
// api.interceptors.request.use(async (config) => {
//     const user = ... get current user ...
//     if (user) {
//         const token = await user.getIdToken();
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

export default api;
