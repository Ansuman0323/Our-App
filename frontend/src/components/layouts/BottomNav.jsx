import React from 'react';
import { NavLink } from 'react-router-dom';
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
        <nav className="bottom-nav" role="navigation" aria-label="Primary">
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
                            <span className="bottom-nav__icon">
                                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                            </span>
                            <span className="bottom-nav__label">{label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};