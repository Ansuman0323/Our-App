import React, { useState, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { useAutoScroll } from '../hooks/useAutoScroll';

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

export const MessageList = ({ messages, user, hasMore, isFetchingTop, onLoadMore, onRetryMessage }) => {
    const { scrollRef, handleScroll } = useAutoScroll(messages, isFetchingTop);
    const [latestAnnounce, setLatestAnnounce] = useState('');

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

    return (
        <>
            <div aria-live="polite" className="sr-only">{latestAnnounce}</div>

            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-transparent scroll-smooth focus:outline-none"
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
                                />
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </>
    );
};