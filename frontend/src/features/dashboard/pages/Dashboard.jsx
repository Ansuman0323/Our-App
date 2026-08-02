import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { ConnectedState } from '../components/ConnectedState';
import { WaitingState } from '../components/WaitingState';
import { PageBackground, EmptyState, LoadingSkeleton } from '../../../components/ui';

export const Dashboard = () => {
    const { data, loading, error } = useDashboard();

    if (loading && !data) {
        return (
            <>
                <PageBackground />
                <LoadingSkeleton />
            </>
        );
    }
    if (error) {
        return (
            <>
                <PageBackground />
                <div className="dashboard-page dashboard-page--error">
                    <EmptyState icon="💔" title="Something went astray" subtitle={error} />
                </div>
            </>
        );
    }

    return (
        <>
            <PageBackground />
            <div className="dashboard-page">
                {data?.space_status === 'waiting' && <WaitingState />}
                {data?.space_status === 'connected' && (
                    <ConnectedState data={data} loading={loading} error={error} />
                )}
            </div>
        </>
    );
};