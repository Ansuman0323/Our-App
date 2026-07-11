import { apiClient } from '../../lib/axios';

export const authApi = {
    syncUser: async (userData) => {
        const response = await apiClient.post('/auth/sync', userData);
        return response.data;
    },

    getMe: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    }
};