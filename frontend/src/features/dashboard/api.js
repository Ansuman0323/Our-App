import { apiClient } from '../../lib/axios';

export const dashboardApi = {
    getHome: async () => {
        const response = await apiClient.get('/dashboard/');
        return response.data;
    }
};