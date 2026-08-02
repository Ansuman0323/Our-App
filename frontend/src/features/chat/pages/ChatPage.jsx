import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { ChatHeader } from '../components/ChatHeader';
import { useCall } from '../../calls/contexts/CallContext';
import { ChatOverlayProvider } from '../contexts/ChatOverlayContext';
import { ChatOverlayBackdrop } from '../components/ChatOverlayBackdrop';

export const ChatPage = () => {
    const { dbUser } = useAuth();
    const { startCall } = useCall();

    const {
        messages, partner, isLoading, loadInitialMessages, loadMoreMessages, hasMore, isFetchingTop,
        sendMessage, editMessage, deleteMessage, deleteMessageForMe, toggleReaction,
        partnerStatus, partnerLastSeen, isPartnerTyping, emitTypingStart, emitTypingStop, emitMarkRead, partnerReceipt
    } = useChat(dbUser);

    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const initialLoadDone = useRef(false);

    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;
        loadInitialMessages();
    }, [loadInitialMessages]);

    const partnerName = partner?.display_name ?? "Partner";
    const partnerId = partner?.id ?? null;

    const handleSaveEdit = async (msg, newContent) => {
        await editMessage(msg, newContent);
        setEditingMessage(null);
    };

    const handleSendMessage = async (content, tempId, replyingTo, file, type, mediaData) => {
        await sendMessage(content, tempId, replyingTo, file, type, mediaData);
        setReplyingToMessage(null);
    };

    if (isLoading) {
        return (
            <div className="chat-page-root items-center justify-center">
                <div className="flex flex-col items-center">
                    <div
                        className="w-10 h-10 rounded-full animate-spin mb-4"
                        style={{ border: '3px solid var(--surface-border)', borderTopColor: 'var(--dream-pink)' }}
                    />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Opening your private world…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ChatOverlayProvider>
            <div className="chat-page-root relative select-none">
                <ChatHeader
                    partnerName={partnerName}
                    status={partnerStatus}
                    partnerLastSeen={partnerLastSeen}
                    isTyping={isPartnerTyping}
                    onStartCall={(type) => {
                        if (partnerId) startCall(partnerId, type);
                    }}
                    canStartCall={!!partnerId}
                    togetherSince={partner?.together_since ?? partner?.paired_at ?? partner?.space_created_at}
                />

                <MessageList
                    messages={messages}
                    user={dbUser}
                    hasMore={hasMore}
                    isFetchingTop={isFetchingTop}
                    onLoadMore={loadMoreMessages}
                    onRetryMessage={sendMessage}
                    onEditMessage={setEditingMessage}
                    onReplyMessage={setReplyingToMessage}
                    onDeleteMessage={deleteMessage}
                    onToggleReaction={toggleReaction}
                    onDeleteMessageForMe={deleteMessageForMe}
                    partnerReceipt={partnerReceipt}
                    onMarkRead={emitMarkRead}
                    isPartnerTyping={isPartnerTyping}
                    partnerName={partnerName}
                />

                <MessageInput
                    onSend={handleSendMessage}
                    emitTypingStart={emitTypingStart}
                    emitTypingStop={emitTypingStop}
                    editingMessage={editingMessage}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingMessage(null)}
                    replyingToMessage={replyingToMessage}
                    onCancelReply={() => setReplyingToMessage(null)}
                />

                <ChatOverlayBackdrop />
            </div>
        </ChatOverlayProvider>
    );
};