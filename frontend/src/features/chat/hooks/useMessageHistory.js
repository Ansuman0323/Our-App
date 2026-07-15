import { useState, useCallback } from 'react';
import { chatApi } from '../api';

export const useMessageHistory = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingTop, setIsFetchingTop] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loadInitialMessages = useCallback(async (isSilentSync = false) => {
        try {
            if (!isSilentSync) setIsLoading(true);
            const data = await chatApi.getMessages();

            setMessages(prev => {
                if (!isSilentSync) return data;

                // Deduplicate and merge to prevent destroying older loaded history on reconnect
                const allMap = new Map();
                prev.forEach(m => allMap.set(m.client_message_id, m));
                data.forEach(m => allMap.set(m.client_message_id, m));

                // Ensure chronological order
                return Array.from(allMap.values()).sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
            });

            if (!isSilentSync) setHasMore(data.length === 50);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            if (!isSilentSync) setIsLoading(false);
        }
    }, []);

    const loadMoreMessages = useCallback(async () => {
        // Prevent duplicate calls if already fetching, or if there is no more history
        if (!hasMore || isFetchingTop || messages.length === 0) return;

        try {
            setIsFetchingTop(true);
            // Grab the ID of the oldest message currently in state to use as the keyset cursor
            const oldestMessageId = messages[0].id;
            const olderMessages = await chatApi.getMessages(oldestMessageId);

            if (olderMessages.length < 50) {
                setHasMore(false);
            }

            // Prepend the older messages to the top of the array
            setMessages(prev => [...olderMessages, ...prev]);
        } catch (error) {
            console.error("Failed to fetch older messages:", error);
        } finally {
            setIsFetchingTop(false);
        }
    }, [hasMore, isFetchingTop, messages]);

    const addOptimisticMessage = useCallback((tempMsg) => {
        setMessages(prev => [...prev, tempMsg]);
    }, []);

    const confirmOptimisticMessage = useCallback((clientMessageId, serverMsg) => {
        setMessages(prev => prev.map(msg =>
            msg.client_message_id === clientMessageId ? serverMsg : msg
        ));
    }, []);

    const markMessageError = useCallback((clientMessageId) => {
        setMessages(prev => prev.map(msg =>
            msg.client_message_id === clientMessageId ? { ...msg, status: 'error' } : msg
        ));
    }, []);

    const handleIncomingMessage = useCallback((message) => {
        setMessages(prev => {
            // Prevent duplicates if we already sent this message optimistically
            const exists = prev.some(m => m.client_message_id === message.client_message_id);
            if (exists) {
                return prev.map(m => m.client_message_id === message.client_message_id ? message : m);
            }
            return [...prev, message];
        });
    }, []);

    const updateMessage = useCallback((messageId, updates) => {
        setMessages(prev =>
            prev.map(msg =>
                msg.id === messageId ||
                    msg.client_message_id === messageId
                    ? { ...msg, ...updates }
                    : msg
            )
        );
    }, []);
    return {
        messages,
        isLoading,
        isFetchingTop,
        hasMore,
        loadInitialMessages,
        loadMoreMessages,
        addOptimisticMessage,
        confirmOptimisticMessage,
        markMessageError,
        handleIncomingMessage,
        updateMessage
    };
};