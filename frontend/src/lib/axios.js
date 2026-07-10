import axios from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request Interceptor Placeholder
apiClient.interceptors.request.use((config) => {
    // Future: Attach JWT or Supabase tokens here
    return config;
});

// Response Interceptor Placeholder
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Future: Handle global 401s, refresh tokens, etc.
        return Promise.reject(error);
    }
);