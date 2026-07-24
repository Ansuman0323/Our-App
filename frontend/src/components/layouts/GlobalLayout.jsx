import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

// Fixed named import
import { IncomingCallModal } from '../../features/calls/components/IncomingCallModal';
import ActiveCallOverlay from '../../features/calls/components/ActiveCallOverlay/ActiveCallOverlay';
import { useCallSocket } from '../../features/calls/hooks/useCallSocket'; // NEW

export const GlobalLayout = () => {
    // Mount the global WebRTC signaling orchestrator
    useCallSocket();

    return (
        <div className="min-h-screen flex flex-col w-full bg-slate-50">
            <header className="w-full h-16 border-b bg-white flex items-center px-4 shadow-sm">
                <h1 className="text-xl font-bold text-slate-800">
                    Together
                </h1>
            </header>

            <main className="flex-1 overflow-x-hidden relative">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="container mx-auto p-4"
                >
                    <Outlet />
                </motion.div>

                {/* Global Call UI */}
                <IncomingCallModal />
                <ActiveCallOverlay />
            </main>
        </div>
    );
};