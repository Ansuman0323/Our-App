import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ROMANTIC_QUOTES = [
    "Every message is a little love letter.",
    "Home is wherever this chat is open.",
    "Still my favorite notification.",
    "Two hearts, one thread.",
];

const useTogetherDays = (togetherSince) => {
    return useMemo(() => {
        if (!togetherSince) return null;
        const start = new Date(togetherSince);
        if (Number.isNaN(start.getTime())) return null;
        const diffMs = Date.now() - start.getTime();
        const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return days;
    }, [togetherSince]);
};

// `lastSeenTs` is an epoch-seconds timestamp (or ms — both handled below).
const formatLastSeen = (lastSeenTs) => {
    if (!lastSeenTs) return null;
    const ms = lastSeenTs > 1e12 ? lastSeenTs : lastSeenTs * 1000; // support sec or ms
    const diffMs = Date.now() - ms;
    if (diffMs < 0) return 'just now';

    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// NOTE: `togetherSince`, `quote`, and `partnerLastSeen` are OPTIONAL props.
// If the caller doesn't pass them, the extra lines simply don't render —
// no existing call site breaks.
export const ChatHeader = ({
    partnerName,
    status,
    isTyping,
    onStartCall,
    canStartCall = true,
    togetherSince,
    quote,
    partnerLastSeen
}) => {
    const navigate = useNavigate();
    const togetherDays = useTogetherDays(togetherSince);
    const displayQuote = quote || ROMANTIC_QUOTES[(partnerName?.length || 0) % ROMANTIC_QUOTES.length];

    // Status text is always derived, never hardcoded. Anything other than
    // an explicit 'online' renders as offline (with "last seen" if we have it).
    const isOnline = status === 'online';
    const lastSeenLabel = !isOnline ? formatLastSeen(partnerLastSeen) : null;
    const statusLabel = isOnline ? 'online' : (lastSeenLabel ? `last seen ${lastSeenLabel}` : 'offline');

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative px-3 py-2.5 md:px-5 md:py-3.5 shrink-0 z-20 overflow-hidden"
            style={{
                paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
                background: 'var(--surface-glass-strong)',
                backdropFilter: 'blur(var(--blur-md)) saturate(160%)',
                WebkitBackdropFilter: 'blur(var(--blur-md)) saturate(160%)',
                borderBottom: '1px solid var(--surface-border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            {/* decorative wash, purely visual */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'var(--gradient-header-wash)', opacity: 0.6 }}
            />

            <div className="relative flex items-center justify-between gap-2">
                {/* Left Side */}
                <div className="flex items-center gap-1 md:gap-3 min-w-0">
                    <motion.button
                        type="button"
                        onClick={() => navigate(-1)}
                        whileTap={{ scale: 0.88 }}
                        className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full shrink-0 focus:outline-none"
                        style={{ color: 'var(--text-secondary)' }}
                        aria-label="Go back"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </motion.button>

                    <div className="relative shrink-0">
                        <div
                            className="w-12 h-12 md:w-[3.25rem] md:h-[3.25rem] rounded-full flex items-center justify-center text-lg font-bold"
                            style={{
                                background: 'var(--gradient-rose-lavender)',
                                color: 'var(--color-on-color)',
                                boxShadow: 'var(--shadow-glow-accent)',
                                border: '2px solid rgba(255,255,255,0.35)',
                            }}
                        >
                            {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
                        </div>
                        {isOnline && !isTyping && (
                            <span
                                className="absolute bottom-0 right-0 w-3 h-3 rounded-full animate-pulse"
                                style={{ background: 'var(--color-success)', boxShadow: '0 0 0 2px var(--dream-bg-1)' }}
                            />
                        )}
                    </div>

                    <div className="flex flex-col justify-center min-w-0 pl-0.5">
                        <h2
                            className="font-bold text-[15px] md:text-[17px] tracking-tight leading-tight truncate"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                        >
                            {partnerName}
                        </h2>

                        <AnimatePresence mode="wait">
                            {isTyping ? (
                                <motion.div
                                    key="typing"
                                    initial={{ opacity: 0, y: 2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -2 }}
                                    className="chat-typing mt-0.5"
                                >
                                    <span className="chat-typing__heart">♥</span>
                                    <span className="chat-typing__dot" />
                                    <span className="chat-typing__dot" />
                                    <span className="chat-typing__dot" />
                                    <span className="text-[11px] font-medium ml-0.5" style={{ color: 'var(--dream-pink)' }}>
                                        writing something…
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="status"
                                    initial={{ opacity: 0, y: 2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -2 }}
                                    className="flex items-center gap-1.5 mt-0.5 min-w-0"
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ background: isOnline ? 'var(--color-success)' : 'var(--text-muted)' }}
                                    />
                                    <span className="text-[11.5px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                                        {statusLabel}
                                    </span>
                                    {togetherDays !== null && (
                                        <>
                                            <span style={{ color: 'var(--text-muted)' }}>·</span>
                                            <span className="text-[11.5px] font-semibold truncate" style={{ color: 'var(--dream-rosegold)' }}>
                                                Together {togetherDays.toLocaleString()}d
                                            </span>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <motion.button
                        type="button"
                        onClick={() => onStartCall('voice')}
                        disabled={!canStartCall}
                        whileTap={canStartCall ? { scale: 0.92 } : undefined}
                        className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none"
                        style={{
                            background: 'var(--surface-glass)',
                            color: 'var(--dream-lavender)',
                            border: '1px solid var(--surface-border)',
                        }}
                        aria-label="Start voice call"
                        title="Start Voice Call"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={() => onStartCall('video')}
                        disabled={!canStartCall}
                        whileTap={canStartCall ? { scale: 0.92 } : undefined}
                        className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        style={{
                            background: 'var(--gradient-rose-lavender)',
                            boxShadow: 'var(--shadow-glow-accent)',
                        }}
                        aria-label="Start video call"
                        title="Start Video Call"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--color-on-color)' }}
                        >
                            <path d="m22 8-6 4 6 4V8Z" />
                            <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {!isTyping && displayQuote && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="relative hidden md:block mt-1.5 pl-[3.75rem] text-[12.5px] italic truncate"
                    style={{ fontFamily: 'var(--font-quote)', color: 'var(--text-muted)' }}
                >
                    “{displayQuote}”
                </motion.p>
            )}
        </motion.div>
    );
};