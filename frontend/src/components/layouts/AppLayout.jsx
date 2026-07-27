import React from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

import { IncomingCallModal } from '../../features/calls/components/IncomingCallModal';
import ActiveCallOverlay from '../../features/calls/components/ActiveCallOverlay/ActiveCallOverlay';
import { useCallSocket } from '../../features/calls/hooks/useCallSocket';
import { BottomNav } from './BottomNav';

/**
 * Shell for authenticated, paired-app screens: Dashboard, Chat,
 * Planner, Memories, Wishlist, Calendar, Journal, Notifications.
 * Owns the sticky header and fixed BottomNav — AuthLayout does not.
 *
 * On Chat (and any future /chat/* sub-route), both the global App
 * header and BottomNav are hidden: ChatHeader becomes the sole top
 * bar, and MessageList becomes the sole scroll surface. .app-main is
 * a bounded flex:1 box, so removing either in-flow sibling lets it
 * fill the freed space automatically — no extra CSS needed for the
 * header; BottomNav (fixed/out-of-flow) still relies on the
 * .app-main--full class added previously.
 */
export const AppLayout = () => {
    // Mount the global WebRTC signaling orchestrator
    useCallSocket();

    const location = useLocation();
    const isChatRoute = location.pathname.startsWith('/chat');

    return (
        <div className="app-shell">
            {!isChatRoute && (
                <header className="app-header">
                    <div className="app-header__brand">
                        <span className="app-header__mark" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12 21s-6.7-4.35-9.33-8.6C1.02 9.7 1.9 6.2 4.9 5.02 7 4.2 9.2 5 10.5 6.75L12 8.6l1.5-1.85C14.8 5 17 4.2 19.1 5.02c3 1.18 3.88 4.68 2.23 7.38C18.7 16.65 12 21 12 21z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                        <h1 className="app-header__title">Together</h1>
                    </div>
                </header>
            )}

            <main className={`app-main${isChatRoute ? ' app-main--full' : ''}`}>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="app-main__content"
                >
                    <Outlet />
                </motion.div>

                {/* Global Call UI */}
                <IncomingCallModal />
                <ActiveCallOverlay />
            </main>

            {!isChatRoute && <BottomNav />}
        </div>
    );
};