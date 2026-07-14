import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../../../lib/supabase';

export const useChatSocket = (onReceiveMessage, onReceiptUpdated, onReconnectSync) => {
    const socketRef = useRef(null);
    const hasConnectedOnce = useRef(false);

    const [partnerStatus, setPartnerStatus] = useState('offline');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);

    const onReceiveRef = useRef(onReceiveMessage);
    const onReceiptRef = useRef(onReceiptUpdated);
    const onSyncRef = useRef(onReconnectSync);

    useEffect(() => {
        onReceiveRef.current = onReceiveMessage;
        onReceiptRef.current = onReceiptUpdated;
        onSyncRef.current = onReconnectSync;
    });

    useEffect(() => {
        let isMounted = true;

        const initSocket = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token || !isMounted) return;

            socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                auth: { token },
                // FIX: Removed `transports: ['websocket']`. 
                // This allows Flask to use HTTP Polling on your local dev server!
            });

            const socket = socketRef.current;

            socket.on('connect', () => {
                console.log("Socket connected successfully!");
                if (hasConnectedOnce.current) {
                    onSyncRef.current();
                }
                hasConnectedOnce.current = true;
            });

            socket.on('receive_message', (dto) => {
                console.log("New message received via socket:", dto);
                if (onReceiveRef.current) onReceiveRef.current(dto);
            });

            socket.on('receipt_updated', (dto) => {
                if (onReceiptRef.current) onReceiptRef.current(dto);
            });

            socket.on('presence_changed', (data) => setPartnerStatus(data.status));
            socket.on('typing_start', () => setIsPartnerTyping(true));
            socket.on('typing_stop', () => setIsPartnerTyping(false));
            socket.on("connect_error", (err) => {
                console.error("CONNECT ERROR");
                console.error(err);
                console.error("Message:", err.message);
                console.error("Description:", err.description);
                console.error("Context:", err.context);
            });
            socket.on("disconnect", (reason) => {
                console.log("Disconnected:", reason);
            });
        };

        initSocket();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const emitTypingStart = useCallback(() => socketRef.current?.emit('typing_start'), []);
    const emitTypingStop = useCallback(() => socketRef.current?.emit('typing_stop'), []);
    const emitMarkRead = useCallback((messageId) => socketRef.current?.emit('mark_read', { message_id: messageId }), []);

    return { partnerStatus, isPartnerTyping, emitTypingStart, emitTypingStop, emitMarkRead };
};