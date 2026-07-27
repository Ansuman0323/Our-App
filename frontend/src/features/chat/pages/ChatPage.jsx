import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { ChatHeader } from '../components/ChatHeader';
import { useCall } from '../../calls/contexts/CallContext';

export const ChatPage = () => {
    const { dbUser } = useAuth();
    const { startCall } = useCall();

    const {
        messages, isLoading, loadInitialMessages, loadMoreMessages, hasMore, isFetchingTop,
        sendMessage, editMessage, deleteMessage, deleteMessageForMe, toggleReaction,
        partnerStatus, isPartnerTyping, emitTypingStart, emitTypingStop, emitMarkRead, partnerReceipt
    } = useChat(dbUser);

    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const initialLoadDone = useRef(false);

    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;
        loadInitialMessages();
    }, [loadInitialMessages]);

    const partnerName = useMemo(() => {
        if (!dbUser || !messages.length) return 'Partner';
        const partnerMessage = messages.find(m => m.sender_id !== dbUser.id);
        return partnerMessage?.sender_name || 'Partner';
    }, [messages, dbUser]);

    const partnerId = useMemo(() => {
        if (!dbUser || !messages.length) return null;
        const partnerMessage = messages.find(m => m.sender_id !== dbUser.id);
        return partnerMessage?.sender_id || null;
    }, [messages, dbUser]);

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
            <div className="chat-page-root items-center justify-center relative overflow-hidden bg-[#FDF6F0]">
                {/* Ambient glow field — signature motif, decorative only */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#C4707E]/25 blur-3xl" />
                    <div className="absolute bottom-0 -right-20 w-80 h-80 rounded-full bg-[#C9A66B]/20 blur-3xl" />
                </div>

                <div className="relative flex flex-col items-center">
                    <div className="relative w-12 h-12 mb-5">
                        <div className="absolute inset-0 rounded-full border-[3px] border-[#C4707E]/20" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#C4707E] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-[#C4707E] text-lg">♥</div>
                    </div>
                    <p className="text-sm font-medium tracking-wide" style={{ fontFamily: "'Manrope', sans-serif", color: '#3F2A38' }}>
                        Opening your space together...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-page-root relative select-none bg-[#FDF6F0]">
            {/* Ambient glow field — persists behind header/list/input, decorative only */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
                <div className="absolute top-[-10%] left-[-8%] w-96 h-96 rounded-full bg-[#C4707E]/[0.08] blur-3xl" />
                <div className="absolute top-[30%] right-[-12%] w-[28rem] h-[28rem] rounded-full bg-[#C9A66B]/[0.07] blur-3xl" />
                <div className="absolute bottom-[-15%] left-[20%] w-96 h-96 rounded-full bg-[#F6DEE3]/[0.35] blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <ChatHeader
                    partnerName={partnerName}
                    status={partnerStatus}
                    isTyping={isPartnerTyping}
                    onStartCall={() => {
                        if (partnerId) startCall(partnerId);
                    }}
                    canStartCall={!!partnerId}
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
            </div>
        </div>
    );
};