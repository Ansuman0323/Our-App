import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { ConnectedState } from '../components/ConnectedState';
import { WaitingState } from '../components/WaitingState';

export const Dashboard = () => {
    const { data, loading, error } = useDashboard();

    if (loading && !data) {
        return <div className="dashboard-page dashboard-page--loading">Loading...</div>;
    }
    if (error) {
        return <div className="dashboard-page dashboard-page--error">{error}</div>;
    }

    return (
        <div className="dashboard-page">
            {data?.space_status === 'waiting' && <WaitingState />}
            {data?.space_status === 'connected' && (
                <ConnectedState data={data} loading={loading} error={error} />
            )}
        </div>
    );
};