import axios from 'axios';
import { supabase } from './supabase';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Temporarily removed supabase.auth.signOut() and the redirect
            // This allows the app to stay on the dashboard so we can inspect the failure.
            console.error("401 Unauthorized received from backend. Check Flask terminal logs for exact JWT error.");
        }
        return Promise.reject(error);
    }
);
