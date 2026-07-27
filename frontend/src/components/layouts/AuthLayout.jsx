import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

/**
 * Shell for unauthenticated screens: Login, Signup.
 * Deliberately has no header and no BottomNav — those only
 * belong in AppLayout, once the user is inside the app.
 */
export const AuthLayout = () => {
    return (
        <div className="auth-shell">
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