import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { ChatHeader } from '../components/ChatHeader';

export const ChatPage = () => {
    const { dbUser } = useAuth();

    const {
        messages, isLoading, loadInitialMessages, loadMoreMessages, hasMore, isFetchingTop,
        sendMessage, editMessage, partnerStatus, isPartnerTyping, emitTypingStart, emitTypingStop
    } = useChat(dbUser);

    // The message currently being edited (or null). Owned here because both
    // MessageList (where "Edit" is selected from the actions menu) and
    // MessageInput (which becomes the edit UI) need to read/drive it.
    const [editingMessage, setEditingMessage] = useState(null);

    useEffect(() => {
        loadInitialMessages();
    }, [loadInitialMessages]);

    const partnerName = useMemo(() => {
        if (!dbUser || !messages.length) return 'Partner';
        const partnerMessage = messages.find(m => m.sender_id !== dbUser.id);
        return partnerMessage?.sender_name || 'Partner';
    }, [messages, dbUser]);

    // If the message being edited disappears from the list (e.g. deleted
    // from another device) or gets updated elsewhere, don't leave the
    // compose bar stuck in a stale edit state.
    useEffect(() => {
        if (!editingMessage) return;
        const stillExists = messages.some(
            (m) => (m.id ?? m.client_message_id) === (editingMessage.id ?? editingMessage.client_message_id)
        );
        if (!stillExists) setEditingMessage(null);
    }, [messages, editingMessage]);

    const handleEditMessage = (msg) => setEditingMessage(msg);

    const handleCancelEdit = () => setEditingMessage(null);

    const handleSaveEdit = async (msg, newContent) => {
        // editMessage is expected to: optimistically patch the message's
        // content/is_edited in local state immediately, call the PATCH
        // endpoint, and reconcile with the "message_updated" socket event
        // (mirroring how sendMessage/optimistic sends already work).
        setEditingMessage(null);
        await editMessage(msg, newContent);
    };

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
                    onEditMessage={handleEditMessage}
                />

                <MessageInput
                    onSend={sendMessage}
                    emitTypingStart={emitTypingStart}
                    emitTypingStop={emitTypingStop}
                    editingMessage={editingMessage}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                />
            </div>
        </div>
    );
};