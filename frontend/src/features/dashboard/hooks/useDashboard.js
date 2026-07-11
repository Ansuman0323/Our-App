import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api';

export const useDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            const result = await dashboardApi.getHome();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();

        // Smart polling: Only poll if we are still waiting for a partner
        let interval;
        if (data?.space_status === 'waiting') {
            interval = setInterval(fetchDashboard, 5000);
        }
        return () => clearInterval(interval);
    }, [fetchDashboard, data?.space_status]);

    return { data, loading, error };
};