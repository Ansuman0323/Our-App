import React, { useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { ChatHeader } from '../components/ChatHeader';

export const ChatPage = () => {
    const { dbUser } = useAuth();

    const {
        messages, isLoading, loadInitialMessages, loadMoreMessages, hasMore, isFetchingTop,
        sendMessage, partnerStatus, isPartnerTyping, emitTypingStart, emitTypingStop
    } = useChat(dbUser);

    useEffect(() => {
        loadInitialMessages();
    }, [loadInitialMessages]);

    const partnerName = useMemo(() => {
        if (!dbUser || !messages.length) return 'Partner';
        const partnerMessage = messages.find(m => m.sender_id !== dbUser.id);
        return partnerMessage?.sender_name || 'Partner';
    }, [messages, dbUser]);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-[100dvh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium text-slate-500">Connecting securely...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 min-h-[100dvh] flex items-center justify-center md:py-6 md:px-4">
            <div className="flex flex-col w-full h-[100dvh] md:h-[calc(100dvh-48px)] max-w-[960px] bg-[#efeae2] relative md:shadow-2xl md:rounded-[2rem] overflow-hidden border-slate-200/60 md:border">
                <ChatHeader
                    partnerName={partnerName}
                    status={partnerStatus}
                    isTyping={isPartnerTyping}
                />

                <MessageList
                    messages={messages}
                    user={dbUser}
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
        </div>
    );
};