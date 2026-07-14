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

    const socket = useChatSocket(history.handleIncomingMessage, handleReceiptUpdated, handleReconnectSync);

    const sendMessage = async (content, existingTempId = null) => {
        if (!content.trim()) return;

        // FIX: Prevent concurrent retry spam
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

    return { ...history, ...socket, sendMessage };
};