import { useCallback, useEffect, useState } from 'react';
import { useMessageHistory } from './useMessageHistory';
import { useChatSocket } from './useChatSocket';
import { chatApi } from '../api';
import { toast } from 'react-hot-toast';

export const useChat = (user) => {
    const history = useMessageHistory();
    const [partnerReceipt, setPartnerReceipt] = useState(null);

    const fetchPartnerReceipt = useCallback(async () => {
        try {
            const receipt = await chatApi.getReceipts();
            setPartnerReceipt(receipt ?? null);
        } catch (error) {
            console.error("Failed to fetch partner receipt", error);
        }
    }, []);

    // Hydrate on mount so ticks are correct before any socket event arrives (refresh-safe).
    useEffect(() => {
        if (!user?.id) return;
        fetchPartnerReceipt();
    }, [user?.id, fetchPartnerReceipt]);

    const handleReceiptUpdated = useCallback((receiptDto) => {
        // Defensive filter: only ever treat this as the PARTNER's cursor, regardless
        // of which include_self setting the emitting socket handler used.
        if (!receiptDto || receiptDto.user_id === user?.id) return;
        setPartnerReceipt(receiptDto);
    }, [user?.id]);

    const handleReconnectSync = useCallback(() => {
        history.loadInitialMessages(true);
        // Safety net: re-hydrate the receipt cursor in case a 'receipt_updated'
        // event was missed while disconnected.
        fetchPartnerReceipt();
    }, [history, fetchPartnerReceipt]);

    const socket = useChatSocket(
        history.handleIncomingMessage,
        handleReceiptUpdated,
        handleReconnectSync,
        history.updateMessage
    );

    useEffect(() => {
        if (!socket.socket) return;
        const handleDeleted = (dto) => {
            if (history.updateMessage) history.updateMessage(dto.id, dto);
        };
        socket.socket.on('message_deleted', handleDeleted);
        return () => socket.socket.off('message_deleted', handleDeleted);
    }, [socket.socket, history.updateMessage]);

    // UPDATE: New signature supporting file and type
    const sendMessage = async (
        content,
        existingTempId = null,
        replyToMessage = null,
        file = null,
        type = 'TEXT'
    ) => {
        const text = content ?? "";

        if (!text.trim() && !file) return;

        if (existingTempId) {
            const existingMsg = history.messages.find(m => m.client_message_id === existingTempId);
            if (existingMsg && existingMsg.status === 'pending') return;
        }

        const clientMessageId = existingTempId || crypto.randomUUID();

        if (!existingTempId) {
            history.addOptimisticMessage({
                id: clientMessageId,
                client_message_id: clientMessageId,
                content: text,
                type: type,
                sender_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString(),
                reply_to_id: replyToMessage ? replyToMessage.id : null,
                uploadProgress: file ? 0 : undefined,
                // UPDATED: Use singular attachment object to match new backend schema
                attachment: file ? {
                    storage_key: null,
                    url: URL.createObjectURL(file),
                    file_name: file.name,
                    mime_type: file.type,
                    file_size: file.size,
                    thumbnail_url: null
                } : null,
                reactions: [],
                reply: replyToMessage ? {
                    id: replyToMessage.id,
                    sender_id: replyToMessage.sender_id,
                    sender_name: replyToMessage.sender_name,
                    content: replyToMessage.content,
                    status: replyToMessage.status,
                    type: replyToMessage.type,
                } : null
            });
        } else {
            history.confirmOptimisticMessage(clientMessageId, {
                ...history.messages.find(m => m.client_message_id === clientMessageId),
                status: 'pending'
            });
        }

        try {
            const serverMsg = await chatApi.sendMessage({
                client_message_id: clientMessageId,
                content: text,
                type,
                file,
                reply_to_id: replyToMessage ? replyToMessage.id : undefined
            }, (progress) => {
                if (history.updateMessage) {
                    history.updateMessage(clientMessageId, { uploadProgress: progress });
                }
            });
            history.confirmOptimisticMessage(clientMessageId, serverMsg);
        } catch (error) {
            console.error("Failed to send message", error);
            history.markMessageError(clientMessageId);
            toast.error("Failed to send message.");
        }
    };

    const editMessage = async (message, newContent) => {
        if (!newContent.trim() || newContent === message.content) return;
        const previousContent = message.content;
        const messageId = message.id || message.client_message_id;

        if (history.updateMessage) {
            history.updateMessage(messageId, { content: newContent, is_edited: true, status: 'pending' });

        }

        try {
            const updatedServerMsg = await chatApi.editMessage(messageId, newContent);
            if (history.updateMessage) history.updateMessage(messageId, updatedServerMsg);
        } catch (error) {
            console.error("Failed to edit message", error);
            toast.error("Failed to edit message.");
            if (history.updateMessage) history.updateMessage(messageId, { content: previousContent, status: 'error' });
        }
    };

    const deleteMessage = async (message) => {
        const messageId = message.id || message.client_message_id;
        const previousStatus = message.status;

        if (history.updateMessage) history.updateMessage(messageId, { status: 'DELETED' });

        try {
            const deletedServerMsg = await chatApi.deleteMessage(messageId);
            if (history.updateMessage) history.updateMessage(messageId, deletedServerMsg);
            toast.success("Message deleted.");
        } catch (error) {
            console.error("Failed to delete message", error);
            if (history.updateMessage) history.updateMessage(messageId, { status: previousStatus });
            toast.error("Failed to delete message.");
        }
    };

    const toggleReaction = async (message, emoji) => {
        if (message.status === 'pending' || message.status === 'DELETED') return;

        const messageId = message.id || message.client_message_id;
        const previousReactions = [...(message.reactions || [])];

        let newReactions = [...previousReactions];
        const existingIndex = newReactions.findIndex(r => r.user_id === user.id);

        if (existingIndex >= 0) {
            if (newReactions[existingIndex].emoji === emoji) {
                newReactions.splice(existingIndex, 1);
            } else {
                newReactions[existingIndex] = { ...newReactions[existingIndex], emoji };
            }
        } else {
            newReactions.push({ user_id: user.id, sender_name: user.display_name, emoji });
        }

        if (history.updateMessage) history.updateMessage(messageId, { reactions: newReactions });

        try {
            const updatedServerMsg = await chatApi.toggleReaction(messageId, emoji);
            if (history.updateMessage) history.updateMessage(messageId, updatedServerMsg);
        } catch (error) {
            console.error("Failed to toggle reaction", error);
            if (history.updateMessage) history.updateMessage(messageId, { reactions: previousReactions });
        }
    };

    const deleteMessageForMe = async (message) => {
        const messageId = message.id || message.client_message_id;

        // Prevent duplicate requests
        if (message.__deletingForMe) return;

        if (history.updateMessage) {
            history.updateMessage(messageId, {
                __deletingForMe: true
            });
        }

        try {
            // Wait until backend confirms deletion
            await chatApi.deleteMessageForMe(messageId);

            // Remove only after success
            if (history.removeMessage) {
                history.removeMessage(messageId);
            }

            // ❌ DO NOT call loadInitialMessages() here.
            // The backend already succeeded.
            // The next normal socket/polling sync will keep everything consistent.

        } catch (error) {
            console.error("Failed to delete message for me", error);

            // Remove temporary flag
            if (history.updateMessage) {
                history.updateMessage(messageId, {
                    __deletingForMe: false
                });
            }
        }
    };

    return { ...history, ...socket, partnerReceipt, sendMessage, editMessage, deleteMessage, toggleReaction, deleteMessageForMe };
};