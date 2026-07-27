import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { ConnectedState } from '../components/ConnectedState';
import { WaitingState } from '../components/WaitingState';

export const Dashboard = () => {
    const { isPaired } = useAuth();

    // Called unconditionally per Rules of Hooks. Runs on every mount
    // regardless of pairing state; see chat notes if pre-pairing
    // fetches to /dashboard/ are undesired on the backend.
    const { data, loading, error } = useDashboard();

    return (
        <div className="dashboard-page">
            {isPaired ? (
                <ConnectedState data={data} loading={loading} error={error} />
            ) : (
                <WaitingState />
            )}
        </div>
    );
};