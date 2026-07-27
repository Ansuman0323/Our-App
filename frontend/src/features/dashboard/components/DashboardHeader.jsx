import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

// Purely decorative — mirrors the greeting text, no data dependency.
const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 5) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌆';
};

// Static copy only — no backend field. Rotates by day-of-year so it's
// stable for the length of a session but varies day to day instead of
// always showing the same line.
const TAGLINES = [
    'Every day with you is my favorite.',
    'Our story gets more beautiful every day.',
    'The best moments are the ones we share.',
];

const getTagline = () => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - start;
    const dayOfYear = Math.floor(diff / 86400000);
    return TAGLINES[dayOfYear % TAGLINES.length];
};

export const DashboardHeader = () => {
    const { dbUser, logout } = useAuth();
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="dashboard-header"
        >
            <div className="dashboard-header__main">
                <p className="dashboard-header__eyebrow">
                    {getGreeting()}
                    <span aria-hidden="true">{getGreetingIcon()}</span>
                </p>
                <h2 className="dashboard-header__name">
                    {dbUser?.display_name || 'User'} <span aria-hidden="true">❤️</span>
                </h2>

                {/* Static, non-data copy — rotates daily, see TAGLINES above. */}
                <p className="dashboard-header__tagline">
                    {getTagline()}
                </p>

                <div className="dashboard-header__divider" role="presentation" />

                <span className="dashboard-header__status">
                    <span className="dashboard-header__status-dot" aria-hidden="true" />
                    Together Forever <span aria-hidden="true">❤️</span>
                </span>
            </div>

            <div className="dashboard-header__side">
                {/* Reserved for a future profile photo, couple photo, or generated
                    avatar. Deliberately left neutral for now — no initials, no
                    invented imagery — so the layout doesn't need reworking later.
                    The small heart badge is a purely decorative accent, not a
                    stand-in for a photo. */}
                <div className="dashboard-header__avatar" aria-hidden="true">
                    <motion.span
                        className="dashboard-header__avatar-badge"
                        animate={prefersReducedMotion ? undefined : { y: [0, -2, 0] }}
                        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        ❤️
                    </motion.span>
                </div>

                <button
                    type="button"
                    onClick={logout}
                    className="dashboard-header__logout"
                    aria-label="Log out"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
};