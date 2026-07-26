import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../../../lib/socket';
import { useCall } from '../contexts/CallContext';
import { isValidPayload } from '../utils/validation';

const DEBUG = import.meta.env.DEV || import.meta.env.VITE_CALL_DEBUG === 'true';

// WeakMap prevents memory leaks during React StrictMode double-mounts
const socketCleanups = new WeakMap();

export const useCallSocket = () => {
    const {
        sessionId,       // Phase 3: The immutable DOM session identity
        callState,
        callId,
        handleIncomingCall,
        handleCallAccepted,
        handleOfferReceived,
        handleAnswerReceived,
        handleIceCandidate,
        handleRemoteTeardown,
        _registerEmitters
    } = useCall();

    // ==========================================
    // STABLE REFERENCES
    // ==========================================
    // Handlers are kept in a mutable ref to prevent the main socket listener 
    // useEffect from tearing down and recreating listeners on every state change.
    const handlersRef = useRef({
        handleIncomingCall, handleCallAccepted, handleOfferReceived,
        handleAnswerReceived, handleIceCandidate, handleRemoteTeardown
    });

    useEffect(() => {
        handlersRef.current = {
            handleIncomingCall, handleCallAccepted, handleOfferReceived,
            handleAnswerReceived, handleIceCandidate, handleRemoteTeardown
        };
    }, [
        handleIncomingCall, handleCallAccepted, handleOfferReceived,
        handleAnswerReceived, handleIceCandidate, handleRemoteTeardown
    ]);

    // Track mutable call state strictly for the reconciliation payload
    const stateRef = useRef({ sessionId, callState, callId });
    useEffect(() => {
        stateRef.current = { sessionId, callState, callId };
    }, [sessionId, callState, callId]);

    // ==========================================
    // EMISSION LAYER
    // ==========================================

    const log = useCallback((action, details = '') => {
        if (!DEBUG) return;
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console.log(`[CALL SOCKET] [${timestamp}] ${action}`, details ? details : '');
    }, []);

    const safeEmit = useCallback((event, payload, ackCallback = null) => {
        const socket = socketService.getSocket();

        if (!socket || !socket.connected) {
            log("Emit Failed", event);
            return;
        }

        log(`Emitting ${event}`, payload);

        if (ackCallback) {
            socket.emit(event, payload, ackCallback);
        } else {
            socket.emit(event, payload);
        }
    }, [log]);

    // PHASE 3: Intercept all outbound WebRTC signals and inject the session_id
    // This allows the backend to strictly verify "Last-In Wins" tab ownership.
    const emitCallEvent = useCallback((eventName, payload = {}) => {
        safeEmit(eventName, {
            ...payload, // Preserves `callee_id` and other dynamic args
            session_id: stateRef.current.sessionId,
            call_id: payload.call_id || stateRef.current.callId
        });
    }, [safeEmit]);


    const emitStartCall = useCallback((p) => emitCallEvent('call:start', p), [emitCallEvent]);
    const emitAcceptCall = useCallback((p) => emitCallEvent('call:accept', p), [emitCallEvent]);
    const emitRejectCall = useCallback((p) => emitCallEvent('call:reject', p), [emitCallEvent]);
    const emitCancelCall = useCallback((p) => emitCallEvent('call:cancel', p), [emitCallEvent]);
    const emitEndCall = useCallback((p) => emitCallEvent('call:end', p), [emitCallEvent]);
    const emitOffer = useCallback((p) => emitCallEvent('call:offer', p), [emitCallEvent]);
    const emitAnswer = useCallback((p) => emitCallEvent('call:answer', p), [emitCallEvent]);
    const emitIceCandidate = useCallback((p) => emitCallEvent('call:ice-candidate', p), [emitCallEvent]);

    // Register wrapped emitters with CallContext so UI components can trigger them blindly
    useEffect(() => {
        _registerEmitters({
            emitStartCall, emitAcceptCall, emitRejectCall, emitCancelCall, emitEndCall,
            emitOffer, emitAnswer, emitIceCandidate
        });
    }, [_registerEmitters, emitStartCall, emitAcceptCall, emitRejectCall, emitCancelCall, emitEndCall, emitOffer, emitAnswer, emitIceCandidate]);

    // ==========================================
    // PHASE 3: DETERMINISTIC RECONCILIATION
    // ==========================================

    const reconcileSession = useCallback(() => {
        log('Attempting session reconciliation...', { sessionId: stateRef.current.sessionId });
        safeEmit('call:reconcile', {
            session_id: stateRef.current.sessionId,
            call_state: stateRef.current.callState,
            active_call_id: stateRef.current.callId || null
        }, (ack) => {
            if (ack && ack.success) {
                log('Reconciliation acknowledged by backend.', ack);
            } else {
                log('Reconciliation completed (no explicit success ACK).', ack);
            }
        });
    }, [safeEmit, log]);

    // ==========================================
    // LISTENER LIFECYCLE
    // ==========================================

    useEffect(() => {
        let mounted = true;
        let activeSocket = null;

        const setupListeners = async () => {
            activeSocket = await socketService.connect();

            if (!mounted || !activeSocket) return;

            log('Initializing Socket Listeners');

            // TEMP DEBUG
            activeSocket.onAny((event, ...args) => {
                console.log("[SOCKET EVENT]", event, args);
            });// TEMP DEBUG
            activeSocket.onAny((event, ...args) => {
                console.log("[SOCKET EVENT]", event, args);
            });
            const onConnect = () => {
                log('Socket Connected');
                // PHASE 3: Fire reconciliation immediately upon connection AND reconnection
                // This replaces the legacy timeout heuristic.
                reconcileSession();
            };

            const onDisconnect = (reason) => log('Socket Disconnected', reason);

            // Inbound Signal Handlers
            const onCallStart = (p) => isValidPayload(p) && handlersRef.current.handleIncomingCall(p);
            const onCallAccept = (p) => isValidPayload(p) && handlersRef.current.handleCallAccepted(p);

            // Teardown multiplexer (Handles reject, cancel, busy, end, failed)
            const onCallTeardown = (event, p) => {
                if (!isValidPayload(p)) return;
                log(`Received: ${event}`, p);
                handlersRef.current.handleRemoteTeardown();
            };

            const onCallReject = (p) => onCallTeardown('call:reject', p);
            const onCallCancel = (p) => onCallTeardown('call:cancel', p);
            const onCallBusy = (p) => onCallTeardown('call:busy', p);
            const onCallEnd = (p) => onCallTeardown('call:end', p);
            const onCallFailed = (p) => onCallTeardown('call:failed', p);

            // WebRTC Negotiation
            const onCallOffer = (p) => isValidPayload(p) && handlersRef.current.handleOfferReceived(p);
            const onCallAnswer = (p) => isValidPayload(p) && handlersRef.current.handleAnswerReceived(p);
            const onCallIceCandidate = (p) => isValidPayload(p) && handlersRef.current.handleIceCandidate(p);

            // Binding
            activeSocket.on('connect', onConnect);
            activeSocket.on('disconnect', onDisconnect);
            activeSocket.on('call:start', onCallStart);
            activeSocket.on('call:accept', onCallAccept);
            activeSocket.on('call:reject', onCallReject);
            activeSocket.on('call:cancel', onCallCancel);
            activeSocket.on('call:busy', onCallBusy);
            activeSocket.on('call:end', onCallEnd);
            activeSocket.on('call:failed', onCallFailed);
            activeSocket.on('call:offer', onCallOffer);
            activeSocket.on('call:answer', onCallAnswer);
            activeSocket.on('call:ice-candidate', onCallIceCandidate);

            // Store cleanup function in WeakMap to handle StrictMode double-mounts smoothly
            socketCleanups.set(activeSocket, () => {
                activeSocket.offAny();
                activeSocket.off('connect', onConnect);
                activeSocket.off('disconnect', onDisconnect);
                activeSocket.off('call:start', onCallStart);
                activeSocket.off('call:accept', onCallAccept);
                activeSocket.off('call:reject', onCallReject);
                activeSocket.off('call:cancel', onCallCancel);
                activeSocket.off('call:busy', onCallBusy);
                activeSocket.off('call:end', onCallEnd);
                activeSocket.off('call:failed', onCallFailed);
                activeSocket.off('call:offer', onCallOffer);
                activeSocket.off('call:answer', onCallAnswer);
                activeSocket.off('call:ice-candidate', onCallIceCandidate);
            });
        };

        setupListeners();

        return () => {
            mounted = false;
            if (!activeSocket) return;

            log('Removing Socket Listeners');
            const cleanup = socketCleanups.get(activeSocket);
            if (cleanup) {
                cleanup();
                socketCleanups.delete(activeSocket);
            }
        };
    }, [log, safeEmit, reconcileSession]);

    // Return the high-level API methods specifically needed by top-level components,
    // though the FSM interacts with these mostly through the Context reference.
    return {
        emitStartCall, emitAcceptCall, emitRejectCall, emitCancelCall, emitEndCall
    };
};