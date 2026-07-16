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

                prev.forEach(m => {
                    allMap.set(m.client_message_id, m);
                });

                data.forEach(serverMsg => {
                    const existing = allMap.get(serverMsg.client_message_id);

                    if (!existing) {
                        allMap.set(serverMsg.client_message_id, serverMsg);
                        return;
                    }

                    // Never replace a deleted message with an older normal message
                    if (
                        existing.status === "DELETED" &&
                        serverMsg.status !== "DELETED"
                    ) {
                        return;
                    }

                    // Never replace a message that is uploading
                    if (existing.status === "pending") {
                        return;
                    }

                    allMap.set(serverMsg.client_message_id, {
                        ...existing,
                        ...serverMsg
                    });
                });

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
        if (!hasMore || isFetchingTop || messages.length === 0) return;

        try {
            setIsFetchingTop(true);
            const oldestMessageId = messages[0].id;
            const olderMessages = await chatApi.getMessages(oldestMessageId);

            if (olderMessages.length < 50) {
                setHasMore(false);
            }

            setMessages(prev => {
                const map = new Map();

                [...olderMessages, ...prev].forEach(msg => {
                    map.set(msg.client_message_id, msg);
                });

                return Array.from(map.values()).sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
            });
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
        setMessages(prev =>
            prev.map(msg => {
                if (msg.client_message_id !== clientMessageId) return msg;

                return {
                    ...msg,
                    ...serverMsg,
                    attachment: serverMsg.attachment ?? msg.attachment,
                    reactions: serverMsg.reactions ?? msg.reactions,
                    reply: serverMsg.reply ?? msg.reply
                };
            })
        );
    }, []);

    const markMessageError = useCallback((clientMessageId) => {
        setMessages(prev => prev.map(msg =>
            msg.client_message_id === clientMessageId ? { ...msg, status: 'error' } : msg
        ));
    }, []);

    const handleIncomingMessage = useCallback((message) => {
        setMessages(prev => {
            const index = prev.findIndex(
                m => m.client_message_id === message.client_message_id
            );

            if (index === -1) {
                return [...prev, message];
            }

            return prev.map(m => {
                if (m.client_message_id !== message.client_message_id) return m;

                // Never replace a deleted message with an older normal version
                if (
                    m.status === "DELETED" &&
                    message.status !== "DELETED"
                ) {
                    return m;
                }

                return {
                    ...m,
                    ...message,
                    attachment: message.attachment ?? m.attachment,
                    reactions: message.reactions ?? m.reactions,
                    reply: message.reply ?? m.reply
                };
            });
        });
    }, []);

    // EXTENDED: Safely updates the main message AND any reply previews referencing it
    const updateMessage = useCallback((messageId, updates) => {
        setMessages(prev =>
            prev.map(msg => {
                const isTarget = msg.id === messageId || msg.client_message_id === messageId;
                const hasTargetReply = msg.reply && (msg.reply.id === messageId || msg.reply.client_message_id === messageId);

                // If this message doesn't need to be updated, return it untouched to preserve React.memo
                if (!isTarget && !hasTargetReply) return msg;

                let updatedMsg = { ...msg };

                // 1. Update the actual message if it matches
                if (isTarget) {
                    updatedMsg = { ...updatedMsg, ...updates };
                }

                // 2. Update the quoted reply preview if it matches
                if (hasTargetReply) {
                    updatedMsg.reply = { ...updatedMsg.reply, ...updates };
                }

                return updatedMsg;
            })
        );
    }, []);

    // Add this with the other useCallback methods:
    const removeMessage = useCallback((messageId) => {
        setMessages(prev => prev.filter(msg =>
            msg.id !== messageId && msg.client_message_id !== messageId
        ));
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
        updateMessage,
        removeMessage
    };
};