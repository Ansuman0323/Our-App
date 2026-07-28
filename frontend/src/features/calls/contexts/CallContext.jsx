import React, { createContext, useContext, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import { CallEngine } from '../services/callEngine';
import { TIMEOUTS } from '../config/calls';
import { CallState } from '../utils/fsm';
import { TimerManager } from '../utils/timerManager';
import { normalizeEngineError } from '../utils/errorModel';
import { callReducer, initialCallState } from './callReducer';
import { chatApi } from '../../chat/api';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
    const [state, dispatch] = useReducer(callReducer, initialCallState);
    const sessionId = useRef(crypto.randomUUID()).current;

    const engineRef = useRef(null);
    const timersRef = useRef(new TimerManager());
    const socketEmittersRef = useRef({});

    const callIdRef = useRef(state.callId);
    useEffect(() => { callIdRef.current = state.callId; }, [state.callId]);

    const unbindEngineEvents = useCallback((engine) => {
        if (engine) engine.clearListeners();
    }, []);

    const resetContext = useCallback(() => {
        timersRef.current.clearAll();
        if (engineRef.current) {
            unbindEngineEvents(engineRef.current);
            engineRef.current.destroy();
            engineRef.current = null;
        }
        dispatch({ type: 'RESET' });
    }, [unbindEngineEvents]);

    const handleOrchestrationFailure = useCallback(() => {
        dispatch({ type: 'TRANSITION', payload: CallState.FAILED });
        timersRef.current.start('reset', resetContext, 3000);
    }, [resetContext]);

    const bindEngineEvents = useCallback((engine) => {
        engine.on('media:localstream', stream => dispatch({ type: 'SET_LOCAL_STREAM', payload: stream }));
        engine.on('media:remotestream', stream => dispatch({ type: 'SET_REMOTE_STREAM', payload: stream }));

        engine.on('track:removed', ({ stream }) => {
            if (stream === 'local') dispatch({ type: 'SET_LOCAL_STREAM', payload: engine.localStream });
            if (stream === 'remote') dispatch({ type: 'SET_REMOTE_STREAM', payload: engine.remoteStream });
        });

        engine.on('ice:candidate', candidate => {
            if (callIdRef.current && socketEmittersRef.current.emitIceCandidate) {
                socketEmittersRef.current.emitIceCandidate({ call_id: callIdRef.current, candidate });
            }
        });

        engine.on('connection:statechange', connState => {
            if (connState === 'connected') {
                dispatch({ type: 'TRANSITION', payload: CallState.CONNECTED });
                dispatch({ type: 'SET_STARTED_AT', payload: Date.now() });
                dispatch({ type: 'SET_QUALITY', payload: 'excellent' });
            } else if (['disconnected', 'failed', 'closed'].includes(connState)) {
                dispatch({ type: 'SET_QUALITY', payload: 'disconnected' });
            }
        });

        engine.on('engine:error', err => {
            dispatch({ type: 'SET_ERROR', payload: normalizeEngineError(err) });
            handleOrchestrationFailure();
        });
    }, [handleOrchestrationFailure]);

    const getEngine = useCallback(() => {
        if (!engineRef.current) {
            engineRef.current = new CallEngine(true);
            bindEngineEvents(engineRef.current);
        }
        return engineRef.current;
    }, [bindEngineEvents]);

    const startCall = useCallback(async (targetPartnerId, callType = 'video') => {
        if (state.callState !== CallState.IDLE) return;

        const callId = crypto.randomUUID();
        dispatch({ type: 'INITIATE_OUTGOING', payload: { callId, partnerId: targetPartnerId, callType } });

        try {
            await getEngine().startLocalMedia(callType);

            socketEmittersRef.current.emitStartCall?.({
                call_id: callId,
                callee_id: targetPartnerId,
                call_type: callType
            });

            timersRef.current.start('ring', handleOrchestrationFailure, TIMEOUTS.RINGING_TIMEOUT);
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: normalizeEngineError(err, 'media_denied') });
            handleOrchestrationFailure();
        }
    }, [state.callState, getEngine, handleOrchestrationFailure]);

    const acceptCall = useCallback(async () => {
        if (state.callState !== CallState.INCOMING) return;
        timersRef.current.clearAll();
        dispatch({ type: 'TRANSITION', payload: CallState.CONNECTING });

        try {
            await getEngine().startLocalMedia(state.callType);
            socketEmittersRef.current.emitAcceptCall?.({ call_id: state.callId });
        } catch (err) {
            dispatch({ type: "SET_ERROR", payload: err.message });
            socketEmittersRef.current.emitFailedCall?.({ call_id: state.callId, reason: "media_unavailable" });
            handleOrchestrationFailure();
        }
    }, [state.callState, state.callId, state.callType, getEngine, handleOrchestrationFailure]);

    const rejectCall = useCallback(() => {
        if (state.callState !== CallState.INCOMING) return;
        socketEmittersRef.current.emitRejectCall?.({ call_id: state.callId });
        resetContext();
    }, [state.callState, state.callId, resetContext]);

    const cancelCall = useCallback(() => {
        if (state.callState !== CallState.OUTGOING) return;
        socketEmittersRef.current.emitCancelCall?.({ call_id: state.callId });
        resetContext();
    }, [state.callState, state.callId, resetContext]);

    const endCall = useCallback(() => {
        if (![CallState.CONNECTING, CallState.CONNECTED].includes(state.callState)) return;
        dispatch({ type: 'TRANSITION', payload: CallState.ENDING });
        socketEmittersRef.current.emitEndCall?.({ call_id: state.callId });
        resetContext();
    }, [state.callState, state.callId, resetContext]);

    const toggleMute = useCallback(() => {
        if (!engineRef.current) return;
        const newMutedState = !state.isMuted;
        engineRef.current.toggleMicrophone(!newMutedState);
        dispatch({ type: 'SET_MEDIA_STATE', payload: { isMuted: newMutedState } });
    }, [state.isMuted]);

    const toggleCamera = useCallback(() => {
        if (!engineRef.current) return;
        const newCameraState = !state.cameraEnabled;
        engineRef.current.toggleCamera(newCameraState);
        dispatch({ type: 'SET_MEDIA_STATE', payload: { cameraEnabled: newCameraState } });
    }, [state.cameraEnabled]);

    const switchCamera = useCallback(async () => {
        if (!engineRef.current) return;
        try {
            await engineRef.current.switchCamera();
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: normalizeEngineError(err, 'camera_switch') });
        }
    }, []);

    const handleIncomingCall = useCallback((payload) => {
        if (state.callState !== CallState.IDLE) return false;

        dispatch({
            type: 'RECEIVE_INCOMING',
            payload: {
                callId: payload.call_id || payload.callId,
                partnerId: payload.caller_id || payload.callerId,
                // Fix 1: Construct the profile from the backend payload so it doesn't default to Unknown Caller
                partnerProfile: {
                    displayName: payload.caller_name || payload.callerName,
                    avatarUrl: payload.caller_avatar || payload.callerAvatar
                },
                // Fix 2: Safely check both snake_case and camelCase to prevent the 'video' fallback
                callType: payload.call_type || payload.callType || 'video'
            }
        });

        timersRef.current.start('ring', resetContext, TIMEOUTS.RINGING_TIMEOUT);
        // ... (rest remains unchanged)

        chatApi.getPartner()
            .then((partner) => {
                if (callIdRef.current === payload.call_id) {
                    dispatch({ type: 'SET_PARTNER_PROFILE', payload: partner });
                }
            })
            .catch((err) => {
                console.error("Failed to fetch partner profile for incoming call", err);
            });

        return true;
    }, [state.callState, resetContext]);

    const handleCallAccepted = useCallback(async (payload) => {
        if (state.callState !== CallState.OUTGOING || payload.call_id !== state.callId) return;
        timersRef.current.clearAll();
        dispatch({ type: 'TRANSITION', payload: CallState.CONNECTING });

        try {
            const engine = getEngine();
            engine.createPeerConnection();
            const offer = await engine.createOffer();
            socketEmittersRef.current.emitOffer?.({ call_id: state.callId, sdp: offer });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: normalizeEngineError(err, 'negotiation_error') });
            handleOrchestrationFailure();
        }
    }, [state.callState, state.callId, getEngine, handleOrchestrationFailure]);

    const handleOfferReceived = useCallback(async (payload) => {
        if (payload.call_id !== state.callId || state.isInitiator) return;
        try {
            const engine = getEngine();
            engine.createPeerConnection();
            await engine.setRemoteDescription(payload.sdp);
            const answer = await engine.createAnswer();
            socketEmittersRef.current.emitAnswer?.({ call_id: state.callId, sdp: answer });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: normalizeEngineError(err, 'sdp_error') });
            handleOrchestrationFailure();
        }
    }, [state.callId, state.isInitiator, getEngine, handleOrchestrationFailure]);

    const handleAnswerReceived = useCallback(async (payload) => {
        if (payload.call_id !== state.callId || !state.isInitiator) return;
        try {
            await getEngine().setRemoteDescription(payload.sdp);
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: normalizeEngineError(err, 'sdp_error') });
            handleOrchestrationFailure();
        }
    }, [state.callId, state.isInitiator, getEngine, handleOrchestrationFailure]);

    const handleIceCandidate = useCallback(async (payload) => {
        if (payload.call_id !== state.callId) return;
        if (engineRef.current) await engineRef.current.addIceCandidate(payload.candidate);
    }, [state.callId]);

    const handleRemoteTeardown = useCallback(() => {
        if (state.callState === CallState.IDLE) return;
        dispatch({ type: 'FORCE_TRANSITION', payload: CallState.ENDED });
        resetContext();
    }, [state.callState, resetContext]);

    const _registerEmitters = useCallback((emitters) => {
        socketEmittersRef.current = emitters;
    }, []);

    useEffect(() => {
        return () => resetContext();
    }, [resetContext]);

    const contextValue = useMemo(() => ({
        ...state,
        sessionId,
        startCall, acceptCall, rejectCall, cancelCall, endCall,
        toggleMute, toggleCamera, switchCamera,
        handleIncomingCall, handleCallAccepted, handleRemoteTeardown,
        handleOfferReceived, handleAnswerReceived, handleIceCandidate,
        _registerEmitters
    }), [
        state, sessionId,
        startCall, acceptCall, rejectCall, cancelCall, endCall,
        toggleMute, toggleCamera, switchCamera,
        handleIncomingCall, handleCallAccepted, handleRemoteTeardown,
        handleOfferReceived, handleAnswerReceived, handleIceCandidate,
        _registerEmitters
    ]);

    return (
        <CallContext.Provider value={contextValue}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used within a CallProvider");
    return context;
};