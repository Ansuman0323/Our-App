import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { PageBackground } from '../ui';

/**
 * Shell for unauthenticated screens: Login, Signup.
 * Deliberately has no header and no BottomNav — those only
 * belong in AppLayout, once the user is inside the app.
 *
 * Now shares the same ambient backdrop (glow + floating particles) as
 * every authenticated screen, plus a small brand mark up top, so the
 * very first screen someone sees already reads as "Together" rather
 * than a generic auth form dropped onto a blank page.
 */
export const AuthLayout = () => {
    return (
        <div className="auth-shell">
            <PageBackground />

            <div className="auth-shell__brand" aria-hidden="true">
                <span className="auth-shell__brand-mark">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 21s-6.7-4.35-9.33-8.6C1.02 9.7 1.9 6.2 4.9 5.02 7 4.2 9.2 5 10.5 6.75L12 8.6l1.5-1.85C14.8 5 17 4.2 19.1 5.02c3 1.18 3.88 4.68 2.23 7.38C18.7 16.65 12 21 12 21z"
                            fill="currentColor"
                        />
                    </svg>
                </span>
                <span className="auth-shell__brand-name">Together</span>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="auth-shell__content"
            >
                <Outlet />
            </motion.div>
        </div>
    );
};