import { useCallback } from 'react';
import { useMessageHistory } from './useMessageHistory';
import { useChatSocket } from './useChatSocket';
import { chatApi } from '../api';

export const useChat = (user) => {
    const history = useMessageHistory();

    const handleReceiptUpdated = useCallback((receiptDto) => {
        // Future: Update specific message delivered/read ticks
    }, []);

    // Passes silent load logic to socket to fire on reconnects
    const handleReconnectSync = useCallback(() => {
        history.loadInitialMessages(true); // Silent sync, no loading spinner
    }, [history]);

    // NEW: Passes history.updateMessage to listen for incoming edits from partner
    const socket = useChatSocket(
        history.handleIncomingMessage,
        handleReceiptUpdated,
        handleReconnectSync,
        history.updateMessage
    );

    const sendMessage = async (content, existingTempId = null) => {
        if (!content.trim()) return;

        // Prevent concurrent retry spam
        if (existingTempId) {
            const existingMsg = history.messages.find(m => m.client_message_id === existingTempId);
            if (existingMsg && existingMsg.status === 'pending') return;
        }

        const clientMessageId = existingTempId || crypto.randomUUID();

        if (!existingTempId) {
            history.addOptimisticMessage({
                id: clientMessageId,
                client_message_id: clientMessageId,
                content,
                sender_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString()
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
                content
            });
            history.confirmOptimisticMessage(clientMessageId, serverMsg);
        } catch (error) {
            console.error("Failed to send message", error);
            history.markMessageError(clientMessageId);
        }
    };

    // NEW: The complete end-to-end Edit Pipeline
    const editMessage = async (message, newContent) => {
        if (!newContent.trim() || newContent === message.content) return;

        const previousContent = message.content;
        const messageId = message.id || message.client_message_id;

        // 1. Optimistic Update: Instantly change the UI to feel lightning fast
        if (history.updateMessage) {
            history.updateMessage(messageId, {
                content: newContent,
                is_edited: true,
                status: 'pending'
            });
        }

        try {
            // 2. Network Request
            const updatedServerMsg = await chatApi.editMessage(messageId, newContent);

            // 3. Confirm Update: Replace with authoritative server data
            if (history.updateMessage) {
                history.updateMessage(messageId, updatedServerMsg);
            }
        } catch (error) {
            console.error("Failed to edit message", error);

            // 4. Rollback: Revert to previous content on failure
            if (history.updateMessage) {
                history.updateMessage(messageId, {
                    content: previousContent,
                    status: 'error'
                });
            }
        }
    };

    // RETURN INCLUDES editMessage
    return { ...history, ...socket, sendMessage, editMessage };
};