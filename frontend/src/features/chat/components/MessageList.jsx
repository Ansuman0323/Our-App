import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { MessageContextMenu } from './MessageContextMenu';
import { MessageBottomSheet } from './MessageBottomSheet';
import { MessageActionItem } from './MessageActionItem';
import { MessageInfoModal } from './MessageInfoModal';
import { useChatOverlay } from '../contexts/ChatOverlayContext';

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const formatDateDivider = (date) => {
    const today = new Date();
    const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const midnightDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = midnightToday.getTime() - midnightDate.getTime();
    const diffCalendarDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffCalendarDays === 0) return 'Today';
    if (diffCalendarDays === 1) return 'Yesterday';
    if (diffCalendarDays > 1 && diffCalendarDays < 7) {
        return date.toLocaleDateString([], { weekday: 'long' });
    }
    return date.toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
};

const DateDivider = ({ label }) => (
    <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-5 first:mt-0"
    >
        <span className="chat-date-pill">
            <span className="chat-date-pill__heart">♡</span>
            {label}
            <span className="chat-date-pill__heart">♡</span>
        </span>
    </motion.div>
);

const TypingBubble = ({ partnerName }) => (
    <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-start mb-2.5 mt-1"
    >
        <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-md"
            style={{
                background: 'var(--surface-glass)',
                border: '1px solid var(--surface-border)',
                backdropFilter: 'blur(var(--blur-md))',
                WebkitBackdropFilter: 'blur(var(--blur-md))',
            }}
        >
            <span className="chat-typing">
                <span className="chat-typing__heart">♥</span>
                <span className="chat-typing__dot" />
                <span className="chat-typing__dot" />
                <span className="chat-typing__dot" />
            </span>
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {partnerName || 'They'} are writing something…
            </span>
        </div>
    </motion.div>
);

export const MessageList = ({
    messages,
    user,
    hasMore,
    isFetchingTop,
    onLoadMore,
    onRetryMessage,
    onEditMessage,
    onReplyMessage,
    onDeleteMessage,
    onDeleteMessageForMe,
    onToggleReaction,
    partnerReceipt,
    onMarkRead,
    isPartnerTyping = false,
    partnerName
}) => {
    const { scrollRef, handleScroll } = useAutoScroll(messages, isFetchingTop);
    const [latestAnnounce, setLatestAnnounce] = useState('');

    const [activeMessage, setActiveMessage] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);
    const [isMobileMode, setIsMobileMode] = useState(false);
    const [infoMessage, setInfoMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const { activeOverlay, openOverlay, closeOverlay } = useChatOverlay();

    // If some other overlay (e.g. the composer's emoji/GIF picker) takes
    // over, make sure our own context menu / bottom sheet state doesn't
    // linger — only one overlay may ever be visible at a time.
    useEffect(() => {
        if (!activeMessage) return;
        if (activeOverlay !== 'contextMenu' && activeOverlay !== 'bottomSheet') {
            setActiveMessage(null);
            setMenuPosition(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeOverlay]);

    // --- READ RECEIPT TICK STATE ---
    // Maps message id -> its index in the (chronologically ascending) messages array,
    // so we can compare "did the partner's cursor pass this message" cheaply.
    const messageIndexMap = useMemo(() => {
        const map = new Map();
        messages.forEach((m, i) => { if (m.id) map.set(m.id, i); });
        return map;
    }, [messages]);

    const receiptCursor = useMemo(() => {
        if (!partnerReceipt) return null;
        return {
            hasRead: !!partnerReceipt.last_read_message_id,
            hasDelivered: !!partnerReceipt.last_delivered_message_id,
            readIdx: partnerReceipt.last_read_message_id ? messageIndexMap.get(partnerReceipt.last_read_message_id) : undefined,
            deliveredIdx: partnerReceipt.last_delivered_message_id ? messageIndexMap.get(partnerReceipt.last_delivered_message_id) : undefined,
        };
    }, [partnerReceipt, messageIndexMap]);

    // NOTE: if the cursor's target message isn't in the currently loaded window,
    // we treat it as covering everything loaded rather than leaving ticks stuck grey.
    // The loaded window is always the most recent tail of the conversation, so in
    // practice the cursor is virtually always resolvable; this is just a safe fallback.
    const getDeliveryState = useCallback((index) => {
        if (!receiptCursor) return 'sent';
        const isRead = receiptCursor.hasRead && (receiptCursor.readIdx === undefined || index <= receiptCursor.readIdx);
        if (isRead) return 'read';
        const isDelivered = receiptCursor.hasDelivered && (receiptCursor.deliveredIdx === undefined || index <= receiptCursor.deliveredIdx);
        if (isDelivered) return 'delivered';
        return 'sent';
    }, [receiptCursor]);

    // --- READ RECEIPT: VIEWPORT DETECTION ---
    // Tracks which partner messages are actually scrolled into view, and marks the
    // newest one read — but only while the tab is focused/visible (rule 2).
    const visibleIdsRef = useRef(new Set());
    const lastMarkedReadRef = useRef(null);
    const markReadDebounceRef = useRef(null);

    const attemptMarkRead = useCallback(() => {
        if (document.visibilityState !== 'visible' || !onMarkRead) return;

        let newestId = null;
        let newestIndex = -1;
        visibleIdsRef.current.forEach((id) => {
            const idx = messageIndexMap.get(id);
            if (idx === undefined) return;
            const msg = messages[idx];
            if (
                !msg ||
                msg.sender_id === user?.id ||
                msg.status === "pending" ||
                msg.status === "DELETED"
            ) {
                return;
            }
            if (idx > newestIndex) {
                newestIndex = idx;
                newestId = msg.id;
            }
        });

        if (newestId && newestId !== lastMarkedReadRef.current) {
            lastMarkedReadRef.current = newestId;
            onMarkRead(newestId);
        }
    }, [messages, messageIndexMap, user?.id, onMarkRead]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const observer = new IntersectionObserver((entries) => {
            let changed = false;
            entries.forEach((entry) => {
                const id = entry.target.getAttribute('data-message-id');
                if (!id) return;
                if (entry.isIntersecting) {
                    if (!visibleIdsRef.current.has(id)) changed = true;
                    visibleIdsRef.current.add(id);
                } else if (visibleIdsRef.current.has(id)) {
                    changed = true;
                    visibleIdsRef.current.delete(id);
                }
            });
            if (changed) {
                if (markReadDebounceRef.current) clearTimeout(markReadDebounceRef.current);
                markReadDebounceRef.current = setTimeout(attemptMarkRead, 400);
            }
        }, { root: container, threshold: 0.5 });

        container.querySelectorAll('[data-message-id]').forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
            if (markReadDebounceRef.current) clearTimeout(markReadDebounceRef.current);
        };
    }, [messages, attemptMarkRead]);

    // Re-check when the tab regains focus/visibility, in case messages were
    // already in view while it was backgrounded.
    useEffect(() => {
        document.addEventListener('visibilitychange', attemptMarkRead);
        window.addEventListener('focus', attemptMarkRead);
        return () => {
            document.removeEventListener('visibilitychange', attemptMarkRead);
            window.removeEventListener('focus', attemptMarkRead);
        };
    }, [attemptMarkRead]);

    useEffect(() => {
        const latest = messages[messages.length - 1];
        if (latest && latest.sender_id !== user?.id && latest.status !== 'pending') {
            const label =
                latest.content ||
                latest.attachment?.file_name ||
                "Media message";

            setLatestAnnounce(`New message: ${label}`);
        }
    }, [messages, user?.id]);

    const onScroll = () => {
        handleScroll();
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && hasMore && !isFetchingTop) {
            onLoadMore();
        }
    };

    const handleOpenActions = (msg, config) => {
        // Prevent actions on pending messages only
        if (msg.status === 'pending') return;

        setActiveMessage(msg);
        if (config.isTouch || window.innerWidth < 768) {
            setIsMobileMode(true);
            setMenuPosition(null);
            openOverlay('bottomSheet');
        } else {
            setIsMobileMode(false);
            setMenuPosition({ anchorRect: config.anchorRect, isMine: config.isMine });
            openOverlay('contextMenu');
        }
    };

    const handleCloseActions = () => {
        setActiveMessage(null);
        setMenuPosition(null);
        closeOverlay();
    };

    const executeAction = (actionType) => {
        if (!activeMessage) return;

        switch (actionType) {
            case 'copy':
                const text = activeMessage.content;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text);
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try { document.execCommand('copy'); } catch (err) { }
                    document.body.removeChild(textArea);
                }
                break;
            case 'info':
                setInfoMessage(activeMessage);
                break;
            case 'reply':
                onReplyMessage?.(activeMessage);
                break;
            case 'edit':
                onEditMessage?.(activeMessage);
                break;
            case 'delete':
                setMessageToDelete(activeMessage);
                break;
            case 'delete_for_me':
                // Instantly remove without opening the confirmation modal
                onDeleteMessageForMe(activeMessage);
                break;
        }
        handleCloseActions();
    };

    const scrollToMessage = (msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const bubble = el.querySelector('[data-bubble-content="true"]');
            if (bubble) {
                bubble.classList.add('ring-4', 'ring-yellow-400', 'bg-yellow-100', 'transition-all', 'duration-500');
                setTimeout(() => {
                    bubble.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-100');
                }, 1200);
            }
        }
    };

    const renderActionItems = () => {
        const isMine = activeMessage?.sender_id === user?.id;
        const isDeleted = activeMessage?.status === 'DELETED';

        // NEW: Return a strictly reduced menu for deleted placeholders
        if (isDeleted) {
            return (
                <>
                    <MessageActionItem
                        label="Message Info"
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>}
                        onClick={() => executeAction('info')}
                    />
                    <div className="my-1 border-b border-slate-100" />
                    <MessageActionItem
                        label="Delete for Me"
                        variant="danger"
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>}
                        onClick={() => executeAction('delete_for_me')}
                    />
                </>
            );
        }

        // Normal Menu
        return (
            <>
                <MessageActionItem
                    label="Reply"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>}
                    onClick={() => executeAction('reply')}
                />
                <MessageActionItem
                    label="Copy"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
                    onClick={() => executeAction('copy')}
                />
                <MessageActionItem
                    label="Message Info"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>}
                    onClick={() => executeAction('info')}
                />

                {isMine && (
                    <>
                        <div className="my-1 border-b border-slate-100" />
                        <MessageActionItem
                            label="Edit"
                            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                            onClick={() => executeAction('edit')}
                        />
                    </>
                )}

                <MessageActionItem
                    label="Delete"
                    variant="danger"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>}
                    onClick={() => executeAction('delete')}
                />
            </>
        );
    };

    return (
        <>
            <div aria-live="polite" className="sr-only">{latestAnnounce}</div>

            {activeMessage && !isMobileMode && menuPosition && activeOverlay === 'contextMenu' && (
                <MessageContextMenu
                    anchorRect={menuPosition.anchorRect}
                    isMine={menuPosition.isMine}
                    message={activeMessage}
                    onClose={handleCloseActions}
                    onAction={(type) => type === 'renderItems' ? renderActionItems() : executeAction(type)}
                    onToggleReaction={onToggleReaction}
                />
            )}

            {activeMessage && isMobileMode && activeOverlay === 'bottomSheet' && (
                <MessageBottomSheet
                    message={activeMessage}
                    onClose={handleCloseActions}
                    onAction={(type) => type === 'renderItems' ? renderActionItems() : executeAction(type)}
                    onToggleReaction={onToggleReaction}
                />
            )}

            <MessageInfoModal
                message={infoMessage}
                onClose={() => setInfoMessage(null)}
            />

            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8 bg-transparent scroll-smooth focus:outline-none"
                tabIndex={0}
            >
                {isFetchingTop && (
                    <div className="flex justify-center mb-4">
                        <div className="chat-date-pill">
                            <div
                                className="w-3 h-3 rounded-full animate-spin"
                                style={{ border: '2px solid var(--surface-border)', borderTopColor: 'var(--dream-pink)' }}
                            />
                            Gathering your memories…
                        </div>
                    </div>
                )}

                {messages.length === 0 && !isFetchingTop ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full flex flex-col items-center justify-center text-center px-6"
                    >
                        <div className="chat-empty-illustration mb-6">💌</div>
                        <h3
                            className="text-xl font-bold mb-2"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                        >
                            Every love story begins with one message.
                        </h3>
                        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                            Say hello, share something sweet, or just tell them you're thinking of them.
                        </p>
                    </motion.div>
                ) : (
                    messages.map((msg, index) => {
                        const prevMsg = messages[index - 1];
                        const isMine = msg.sender_id === user?.id;

                        const msgDate = new Date(msg.created_at);
                        const showDateDivider = !prevMsg || !isSameDay(msgDate, new Date(prevMsg.created_at));

                        const isConsecutive = !showDateDivider && prevMsg &&
                            prevMsg.sender_id === msg.sender_id &&
                            (msgDate - new Date(prevMsg.created_at)) < 300000;

                        return (
                            <React.Fragment key={msg.id || msg.client_message_id}>
                                {showDateDivider && <DateDivider label={formatDateDivider(msgDate)} />}
                                <div id={`message-${msg.id || msg.client_message_id}`} data-message-id={msg.id} className="w-full flex">
                                    <MessageBubble
                                        message={msg}
                                        isMine={isMine}
                                        isConsecutive={isConsecutive}
                                        deliveryState={isMine ? getDeliveryState(index) : undefined}
                                        onRetry={() => onRetryMessage(msg.content, msg.client_message_id)}
                                        onOpenActions={handleOpenActions}
                                        onQuoteClick={scrollToMessage}
                                        user={user}
                                        onToggleReaction={onToggleReaction}
                                        onSwipeToReply={onReplyMessage}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    })
                )}

                <AnimatePresence>
                    {isPartnerTyping && messages.length > 0 && <TypingBubble partnerName={partnerName} />}
                </AnimatePresence>
            </div>

            {messageToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMessageToDelete(null)} />
                    <div
                        className="rounded-2xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 duration-200"
                        style={{
                            background: 'var(--surface-glass-strong)',
                            border: '1px solid var(--surface-border)',
                            boxShadow: 'var(--shadow-floating)',
                            backdropFilter: 'blur(var(--blur-lg))',
                            WebkitBackdropFilter: 'blur(var(--blur-lg))',
                        }}
                    >
                        <div className="p-5 text-center pb-4">
                            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Delete Message?</h3>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                {messageToDelete.sender_id === user?.id
                                    ? "You can delete this message for yourself or for everyone."
                                    : "This message will be deleted for you. Other chat members will still be able to see it."}
                            </p>
                        </div>
                        <div className="flex flex-col" style={{ borderTop: '1px solid var(--surface-border)' }}>

                            {messageToDelete.sender_id === user?.id && (
                                <button
                                    onClick={() => { onDeleteMessage(messageToDelete); setMessageToDelete(null); }}
                                    className="w-full py-3.5 text-sm font-bold transition-colors"
                                    style={{ color: 'var(--color-danger)', borderBottom: '1px solid var(--surface-border)' }}
                                >
                                    Delete for Everyone
                                </button>
                            )}

                            <button
                                onClick={() => { onDeleteMessageForMe(messageToDelete); setMessageToDelete(null); }}
                                className="w-full py-3.5 text-sm font-bold transition-colors"
                                style={{ color: 'var(--color-danger)', borderBottom: '1px solid var(--surface-border)' }}
                            >
                                Delete for Me
                            </button>

                            <button
                                onClick={() => setMessageToDelete(null)}
                                className="w-full py-3.5 text-sm font-semibold transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};