import React, { useState, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { MessageContextMenu } from './MessageContextMenu';
import { MessageBottomSheet } from './MessageBottomSheet';
import { MessageActionItem } from './MessageActionItem';
import { MessageInfoModal } from './MessageInfoModal';

// Helper to reliably check if two dates fall on the same local calendar day
const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const formatDateDivider = (date) => {
    const today = new Date();

    // Normalize both dates to local midnight (00:00:00.000)
    // This strips away the time component, isolating the calendar day.
    const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const midnightDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Calculate difference strictly based on the normalized calendar days
    const diffTime = midnightToday.getTime() - midnightDate.getTime();

    // Math.round safely absorbs any fractional differences caused by Daylight Saving Time (DST) changes
    const diffCalendarDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffCalendarDays === 0) return 'Today';
    if (diffCalendarDays === 1) return 'Yesterday';

    // Previous 7 calendar days (2 to 6 days ago)
    if (diffCalendarDays > 1 && diffCalendarDays < 7) {
        return date.toLocaleDateString([], { weekday: 'long' });
    }

    // Older than 6 days: Return standard date, showing year only if not current year
    return date.toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
};

const DateDivider = ({ label }) => (
    <div className="flex justify-center my-4 first:mt-0 animate-in fade-in duration-300">
        <span className="bg-white/80 backdrop-blur-sm text-slate-500 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm border border-slate-200/60">
            {label}
        </span>
    </div>
);

export const MessageList = ({ messages, user, hasMore, isFetchingTop, onLoadMore, onRetryMessage, onEditMessage }) => {
    const { scrollRef, handleScroll } = useAutoScroll(messages, isFetchingTop);
    const [latestAnnounce, setLatestAnnounce] = useState('');

    // --- ACTION SYSTEM STATE ---
    const [activeMessage, setActiveMessage] = useState(null);
    // menuPosition now carries the clicked bubble's anchorRect (+ isMine),
    // not raw cursor coordinates, so MessageContextMenu can position itself
    // beside the bubble instead of at arbitrary viewport coordinates.
    const [menuPosition, setMenuPosition] = useState(null);
    const [isMobileMode, setIsMobileMode] = useState(false);
    const [infoMessage, setInfoMessage] = useState(null);

    useEffect(() => {
        const latest = messages[messages.length - 1];
        if (latest && latest.sender_id !== user?.id && latest.status !== 'pending') {
            setLatestAnnounce(`New message: ${latest.content}`);
        }
    }, [messages, user?.id]);

    const onScroll = () => {
        handleScroll();
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && hasMore && !isFetchingTop) {
            onLoadMore();
        }
    };

    const handleOpenActions = (msg, config) => {
        if (msg.status === 'pending') return; // Don't allow actions on pending messages

        setActiveMessage(msg);
        if (config.isTouch || window.innerWidth < 768) {
            setIsMobileMode(true);
            setMenuPosition(null);
        } else {
            setIsMobileMode(false);
            setMenuPosition({ anchorRect: config.anchorRect, isMine: config.isMine });
        }
    };

    const handleCloseActions = () => {
        setActiveMessage(null);
        setMenuPosition(null);
    };

    // Action Dispatcher
    const executeAction = (actionType) => {
        if (!activeMessage) return;

        switch (actionType) {
            case 'copy':
                const text = activeMessage.content;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text);
                } else {
                    // Graceful fallback for older browsers
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
                console.log("TODO: Implement Reply", activeMessage.id);
                break;
            case 'edit':
                // Hands off to the compose bar (MessageInput) via ChatPage,
                // which owns the shared editingMessage state.
                onEditMessage?.(activeMessage);
                break;
            case 'delete':
                console.log("TODO: Implement Delete", activeMessage.id);
                break;
        }
        handleCloseActions();
    };

    // Render the action items identically for both Desktop and Mobile
    const renderActionItems = () => {
        const isMine = activeMessage?.sender_id === user?.id;

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
                        <MessageActionItem
                            label="Delete"
                            variant="danger"
                            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>}
                            onClick={() => executeAction('delete')}
                        />
                    </>
                )}
            </>
        );
    };

    return (
        <>
            {/* Visually hidden screen reader announcer */}
            <div aria-live="polite" className="sr-only">{latestAnnounce}</div>

            {/* ACTION MENUS */}
            {activeMessage && !isMobileMode && menuPosition && (
                <MessageContextMenu
                    anchorRect={menuPosition.anchorRect}
                    isMine={menuPosition.isMine}
                    message={activeMessage}
                    onClose={handleCloseActions}
                    onAction={(type) => type === 'renderItems' ? renderActionItems() : executeAction(type)}
                />
            )}

            {activeMessage && isMobileMode && (
                <MessageBottomSheet
                    message={activeMessage}
                    onClose={handleCloseActions}
                    onAction={(type) => type === 'renderItems' ? renderActionItems() : executeAction(type)}
                />
            )}

            <MessageInfoModal
                message={infoMessage}
                onClose={() => setInfoMessage(null)}
            />

            {/* MAIN SCROLL CONTAINER */}
            <div
                ref={scrollRef}
                onScroll={onScroll}
                // min-h-0 is crucial here to force Flexbox to allow scrolling
                className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8 bg-transparent scroll-smooth focus:outline-none"
                tabIndex={0}
            >
                {isFetchingTop && (
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                            <span className="text-xs font-medium text-slate-500">Loading history...</span>
                        </div>
                    </div>
                )}

                {messages.length === 0 && !isFetchingTop ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-5xl shadow-sm mb-6">
                            💜
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No messages yet</h3>
                        <p className="text-sm text-slate-500 max-w-xs text-center">
                            Start your conversation by sending a message below.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const prevMsg = messages[index - 1];
                        const isMine = msg.sender_id === user?.id;

                        const msgDate = new Date(msg.created_at);
                        const showDateDivider = !prevMsg || !isSameDay(msgDate, new Date(prevMsg.created_at));

                        // Grouping logic: same sender, same calendar day, within 5 minutes
                        const isConsecutive = !showDateDivider && prevMsg &&
                            prevMsg.sender_id === msg.sender_id &&
                            (msgDate - new Date(prevMsg.created_at)) < 300000;

                        return (
                            <React.Fragment key={msg.id || msg.client_message_id}>
                                {showDateDivider && <DateDivider label={formatDateDivider(msgDate)} />}
                                <MessageBubble
                                    message={msg}
                                    isMine={isMine}
                                    isConsecutive={isConsecutive}
                                    onRetry={() => onRetryMessage(msg.content, msg.client_message_id)}
                                    onOpenActions={handleOpenActions}
                                />
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </>
    );
};