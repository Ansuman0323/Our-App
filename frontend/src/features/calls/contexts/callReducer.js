import { CallState, canTransition } from '../utils/fsm';

export const initialCallState = {
    callState: CallState.IDLE,
    callId: null,
    partnerId: null,
    isInitiator: false,

    localStream: null,
    remoteStream: null,
    isMuted: false,
    cameraEnabled: true,

    callStartedAt: null, // Avoids setInterval drift
    connectionQuality: 'disconnected', // excellent, good, poor, disconnected
    error: null
};

export const callReducer = (state, action) => {
    switch (action.type) {
        case 'INITIATE_OUTGOING':
            return {
                ...state,
                callState: CallState.OUTGOING,
                callId: action.payload.callId,
                partnerId: action.payload.partnerId,
                isInitiator: true
            };

        case 'RECEIVE_INCOMING':
            return {
                ...state,
                callState: CallState.INCOMING,
                callId: action.payload.callId,
                partnerId: action.payload.partnerId,
                isInitiator: false
            };

        case 'TRANSITION':
            if (!canTransition(state.callState, action.payload)) {
                console.warn(`[FSM] Invalid transition blocked: ${state.callState} -> ${action.payload}`);
                return state;
            }
            return { ...state, callState: action.payload };

        case 'FORCE_TRANSITION': // Used strictly for cleanup/resets
            return { ...state, callState: action.payload };

        case 'SET_LOCAL_STREAM':
            return { ...state, localStream: action.payload };

        case 'SET_REMOTE_STREAM':
            return { ...state, remoteStream: action.payload };

        case 'SET_STARTED_AT':
            return { ...state, callStartedAt: action.payload };

        case 'SET_QUALITY':
            return { ...state, connectionQuality: action.payload };

        case 'SET_MEDIA_STATE':
            return {
                ...state,
                isMuted: action.payload.isMuted ?? state.isMuted,
                cameraEnabled: action.payload.cameraEnabled ?? state.cameraEnabled
            };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'RESET':
            return { ...initialCallState };

        default:
            return state;
    }
};