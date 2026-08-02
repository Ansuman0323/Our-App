import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { GlassCard, GlassIconButton, PremiumAvatar } from '../../../components/ui';

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
// always showing the same line. Used as a fallback for `quote` when
// no shared quote is supplied by the caller.
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

const getDateLabel = () =>
    new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

// Accepts an ISO date/string/Date and returns the whole-day difference
// from now. Returns null on anything unparsable so callers can fall
// back to warmer copy instead of showing "NaN days".
const daysSince = (date) => {
    if (!date) return null;
    const then = new Date(date);
    if (Number.isNaN(then.getTime())) return null;
    const diffMs = new Date().setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round(diffMs / 86400000));
};

// Given an anniversary date, returns the number of days until the
// *next* occurrence of that month/day (this year or next).
const daysUntilAnniversary = (date) => {
    if (!date) return null;
    const then = new Date(date);
    if (Number.isNaN(then.getTime())) return null;
    const today = new Date();
    const next = new Date(today.getFullYear(), then.getMonth(), then.getDate());
    next.setHours(0, 0, 0, 0);
    const todayMid = new Date(today);
    todayMid.setHours(0, 0, 0, 0);
    if (next < todayMid) next.setFullYear(next.getFullYear() + 1);
    return Math.round((next - todayMid) / 86400000);
};

// Counts a number up from 0 to `target` once, on mount/target-change —
// used for the "days together" stat so it feels like it's arriving
// rather than just appearing. Skips straight to `target` for
// prefers-reduced-motion or when there's nothing to animate.
const useCountUp = (target, { duration = 900, disabled = false } = {}) => {
    const [value, setValue] = useState(target === null ? null : 0);
    const frameRef = React.useRef();

    React.useEffect(() => {
        if (target === null) {
            setValue(null);
            return undefined;
        }
        if (disabled || target === 0) {
            setValue(target);
            return undefined;
        }
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            // easeOutCubic — quick start, gentle settle, no bounce.
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration, disabled]);

    return value;
};

/**
 * DashboardHeader — the emotional entry point to the dashboard.
 *
 * All relationship data is passed in as optional props so this stays
 * a pure presentation component with no new required contract: if a
 * parent doesn't yet pass `sinceDate` / `anniversaryDate` / `quote` /
 * `todayMemory`, the header still renders a complete, warm hero using
 * sensible fallbacks instead of blank or placeholder-looking copy.
 *
 * - sinceDate: ISO date the couple's space was created / paired.
 * - anniversaryDate: ISO date of the anniversary to count down to.
 * - quote: a shared quote/note to feature under the stats.
 * - todayMemory: short string, e.g. "On this day, 2 years ago...".
 * - partnerName: the paired partner's display name. When present, the
 *   hero reads as "You ❤️ Partner" instead of just "You ❤️", so the
 *   greeting names the relationship, not just the logged-in person.
 */
export const DashboardHeader = ({ sinceDate, anniversaryDate, quote, todayMemory, partnerName }) => {
    const { dbUser, logout } = useAuth();
    const prefersReducedMotion = useReducedMotion();

    const daysTogether = daysSince(sinceDate);
    const anniversaryIn = daysUntilAnniversary(anniversaryDate);
    const displayQuote = quote || todayMemory || getTagline();
    const animatedDays = useCountUp(daysTogether, { disabled: prefersReducedMotion });

    return (
        <GlassCard className="dashboard-header">
            <div className="dashboard-header__top">
                <div className="dashboard-header__main">
                    <p className="dashboard-header__eyebrow">
                        {getGreeting()}
                        <span aria-hidden="true">{getGreetingIcon()}</span>
                    </p>
                    <h2 className="dashboard-header__name">
                        {dbUser?.display_name || 'You'}{' '}
                        <span className="dashboard-header__heart" aria-hidden="true">
                            ❤️
                        </span>
                        {partnerName && <> {partnerName}</>}
                    </h2>

                    <p className="dashboard-header__status">{getDateLabel()}</p>
                </div>

                <div className="dashboard-header__side">
                    {/* Reserved for a future profile photo, couple photo, or generated
                        avatar. Deliberately left neutral for now — no initials, no
                        invented imagery — so the layout doesn't need reworking later.
                        The heart glyph inside PremiumAvatar is a purely decorative
                        accent, not a stand-in for a photo. */}
                    <motion.span
                        animate={prefersReducedMotion ? undefined : { y: [0, -3, 0] }}
                        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <PremiumAvatar size={56} />
                    </motion.span>

                    <GlassIconButton onClick={logout} label="Log out">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </GlassIconButton>
                </div>
            </div>

            {/* Relationship stats — only rendered when real dates are
                available, so the hero never shows a fabricated "0 days". */}
            {(daysTogether !== null || anniversaryIn !== null) && (
                <div className="dashboard-header__stats">
                    {daysTogether !== null && (
                        <div className="dashboard-header__stat">
                            <span className="dashboard-header__stat-value">{animatedDays}</span>
                            <span className="dashboard-header__stat-label">
                                {daysTogether === 1 ? 'day together' : 'days together'}
                            </span>
                        </div>
                    )}
                    {daysTogether !== null && anniversaryIn !== null && (
                        <div className="dashboard-header__stat-divider" aria-hidden="true" />
                    )}
                    {anniversaryIn !== null && (
                        <div className="dashboard-header__stat">
                            <span className="dashboard-header__stat-value">
                                {anniversaryIn === 0 ? 'Today' : anniversaryIn}
                            </span>
                            <span className="dashboard-header__stat-label">
                                {anniversaryIn === 0 ? 'is your anniversary' : 'days to anniversary'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <p className="dashboard-header__quote">
                <span className="dashboard-header__quote-mark" aria-hidden="true">“</span>
                {displayQuote}
            </p>
        </GlassCard>
    );
};