import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageCircle, ClipboardList, Image, Gift } from 'lucide-react';

/**
 * Single source of truth for the bottom navigation.
 * To add/remove/reorder a tab, edit this array only.
 *
 * NOTE: `to` paths are best-guess based on feature folder names
 * (dashboard, chat, planner, memories, wishlist). Confirm against
 * your router config (components/routes/index.jsx) and adjust here
 * if any differ.
 */
const NAV_ITEMS = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/planner', label: 'Planner', icon: ClipboardList },
    { to: '/memories', label: 'Memories', icon: Image },
    { to: '/wishlist', label: 'Wishlist', icon: Gift },
];

export const BottomNav = () => {
    return (
        <motion.nav
            className="bottom-nav"
            role="navigation"
            aria-label="Primary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <motion.span
                                    layoutId="bottom-nav-active"
                                    className="bottom-nav__glow"
                                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                                    aria-hidden="true"
                                />
                            )}
                            <motion.span
                                className="bottom-nav__icon"
                                animate={isActive ? { y: [0, -2, 0], scale: 1.08 } : { y: 0, scale: 1 }}
                                transition={
                                    isActive
                                        ? { y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
                                        : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                                }
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                            </motion.span>
                            <span className="bottom-nav__label">{label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </motion.nav>
    );
};