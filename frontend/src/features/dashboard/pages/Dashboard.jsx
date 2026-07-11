import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDashboard } from '../hooks/useDashboard';
import { WaitingState } from '../components/WaitingState';
import { ConnectedState } from '../components/ConnectedState';

export const Dashboard = () => {
    const { data, loading, error } = useDashboard();

    if (loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-pulse text-sm font-medium text-slate-400">Loading your space...</div>
            </div>
        );
    }

    if (error) return <div className="p-4 text-center text-red-500">Error loading dashboard: {error}</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-6">
            <main className="px-6 py-6 max-w-4xl mx-auto">
                {/* AnimatePresence belongs HERE in the main layout */}
                <AnimatePresence mode="wait">
                    {data?.space_status === 'waiting' ? (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                        >
                            <WaitingState />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="connected"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <ConnectedState widgets={data?.widgets} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};