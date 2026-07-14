import React, { useState, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { useAutoScroll } from '../hooks/useAutoScroll';

export const MessageList = ({
    messages, user, hasMore, isFetchingTop, onLoadMore, onRetryMessage
}) => {
    const { scrollRef, handleScroll } = useAutoScroll(messages, isFetchingTop);
    const [latestAnnounce, setLatestAnnounce] = useState('');

    // Announce only NEW messages securely to screen readers
    useEffect(() => {
        const latest = messages[messages.length - 1];
        if (latest && latest.sender_id !== user.id && latest.status !== 'pending') {
            setLatestAnnounce(`New message: ${latest.content}`);
        }
    }, [messages, user.id]);

    const onScroll = () => {
        handleScroll();
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && hasMore && !isFetchingTop) {
            onLoadMore();
        }
    };

    return (
        <>
            {/* Visually hidden screen reader announcer */}
            <div aria-live="polite" className="sr-only">
                {latestAnnounce}
            </div>

            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth focus:outline-none"
                tabIndex={0}
            >
                {isFetchingTop && (
                    <div className="text-center text-xs text-slate-400 mb-4 animate-pulse">
                        Loading older messages...
                    </div>
                )}

                {messages.length === 0 && !isFetchingTop ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p className="text-sm font-medium text-slate-500">No messages yet</p>
                        <p className="text-xs mt-1">Send a message to start the conversation.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id || msg.client_message_id}
                            message={msg}
                            isMine={msg.sender_id === user.id}
                            onRetry={() => onRetryMessage(msg.content, msg.client_message_id)}
                        />
                    ))
                )}
            </div>
        </>
    );
};