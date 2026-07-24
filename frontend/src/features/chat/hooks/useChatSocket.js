import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '../../../lib/socket';

export const useChatSocket = (
    onReceiveMessage,
    onReceiptUpdated,
    onReconnectSync,
    onMessageUpdated
) => {
    const hasConnectedOnce = useRef(false);

    const [partnerStatus, setPartnerStatus] = useState('offline');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);

    const onReceiveRef = useRef(onReceiveMessage);
    const onReceiptRef = useRef(onReceiptUpdated);
    const onSyncRef = useRef(onReconnectSync);
    const onUpdateRef = useRef(onMessageUpdated);

    useEffect(() => {
        onReceiveRef.current = onReceiveMessage;
        onReceiptRef.current = onReceiptUpdated;
        onSyncRef.current = onReconnectSync;
        onUpdateRef.current = onMessageUpdated;
    });

    useEffect(() => {
        let isMounted = true;
        let cleanupListeners = null;

        const bindSocket = async () => {
            // Retrieve the globally initialized socket
            const socket = await socketService.connect();
            if (!socket || !isMounted) return;

            // Define handlers
            const handleConnect = () => {
                console.log("Chat component attached to global socket!");
                if (hasConnectedOnce.current) {
                    onSyncRef.current();
                }
                hasConnectedOnce.current = true;
            };

            const handleReceive = (dto) => {
                console.log("New message received via socket:", dto);
                onReceiveRef.current?.(dto);
            };
            const handleReceipt = (dto) => onReceiptRef.current?.(dto);
            const handlePresence = (data) => setPartnerStatus(data.status);
            const handleTypingStart = () => setIsPartnerTyping(true);
            const handleTypingStop = () => setIsPartnerTyping(false);
            const handleUpdate = (dto) => onUpdateRef.current?.(dto.id, dto);
            const handleDelete = (dto) => onUpdateRef.current?.(dto.id, dto);

            // If the socket is already connected when navigating to Chat, trigger connect logic manually
            if (socket.connected) {
                handleConnect();
            }

            // Bind listeners
            socket.on('connect', handleConnect);
            socket.on('receive_message', handleReceive);
            socket.on('receipt_updated', handleReceipt);
            socket.on('presence_changed', handlePresence);
            socket.on('typing_start', handleTypingStart);
            socket.on('typing_stop', handleTypingStop);
            socket.on('message_updated', handleUpdate);
            socket.on('message_deleted', handleDelete);

            // Prepare teardown function
            cleanupListeners = () => {
                socket.off('connect', handleConnect);
                socket.off('receive_message', handleReceive);
                socket.off('receipt_updated', handleReceipt);
                socket.off('presence_changed', handlePresence);
                socket.off('typing_start', handleTypingStart);
                socket.off('typing_stop', handleTypingStop);
                socket.off('message_updated', handleUpdate);
                socket.off('message_deleted', handleDelete);
            };
        };

        bindSocket();

        return () => {
            isMounted = false;
            // CRITICAL: We remove event listeners to prevent memory leaks/duplicates, 
            // but we DO NOT disconnect the socket!
            if (cleanupListeners) cleanupListeners();
        };
    }, []);

    const emitTypingStart = useCallback(() => socketService.getSocket()?.emit('typing_start'), []);
    const emitTypingStop = useCallback(() => socketService.getSocket()?.emit('typing_stop'), []);
    const emitMarkRead = useCallback((messageId) => socketService.getSocket()?.emit('mark_read', { message_id: messageId }), []);

    return { partnerStatus, isPartnerTyping, emitTypingStart, emitTypingStop, emitMarkRead };
};