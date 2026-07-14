import React, { useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { ChatHeader } from '../components/ChatHeader';

export const ChatPage = () => {
    // FIX: Use dbUser (Postgres Integer ID) instead of the Supabase UUID
    const { dbUser } = useAuth();

    // Pass dbUser to the chat hook
    const {
        messages, isLoading, loadInitialMessages, loadMoreMessages, hasMore, isFetchingTop,
        sendMessage, partnerStatus, isPartnerTyping, emitTypingStart, emitTypingStop
    } = useChat(dbUser);

    useEffect(() => {
        loadInitialMessages();
    }, [loadInitialMessages]);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-[calc(100dvh-80px)]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-slate-400 mt-4">Connecting to space...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-80px)] max-w-3xl mx-auto bg-slate-50 relative shadow-xl overflow-hidden">
            <ChatHeader
                partnerName="Partner"
                status={partnerStatus}
                isTyping={isPartnerTyping}
            />

            <MessageList
                messages={messages}
                user={dbUser} // FIX: Now msg.sender_id === user.id will match correctly!
                hasMore={hasMore}
                isFetchingTop={isFetchingTop}
                onLoadMore={loadMoreMessages}
                onRetryMessage={sendMessage}
            />

            <MessageInput
                onSend={sendMessage}
                emitTypingStart={emitTypingStart}
                emitTypingStop={emitTypingStop}
            />
        </div>
    );
};