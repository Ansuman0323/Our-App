export const CallState = {
    IDLE: 'IDLE',
    OUTGOING: 'OUTGOING',
    INCOMING: 'INCOMING',
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    ENDING: 'ENDING',
    ENDED: 'ENDED',
    FAILED: 'FAILED'
};

const VALID_TRANSITIONS = {
    [CallState.IDLE]: [CallState.OUTGOING, CallState.INCOMING],
    [CallState.OUTGOING]: [CallState.CONNECTING, CallState.ENDING, CallState.FAILED],
    [CallState.INCOMING]: [CallState.CONNECTING, CallState.ENDING, CallState.FAILED],
    [CallState.CONNECTING]: [CallState.CONNECTED, CallState.ENDING, CallState.FAILED],
    [CallState.CONNECTED]: [CallState.ENDING, CallState.FAILED],
    [CallState.ENDING]: [CallState.ENDED, CallState.FAILED],
    [CallState.ENDED]: [CallState.IDLE],
    [CallState.FAILED]: [CallState.IDLE]
};

export const canTransition = (currentState, newState) => {
    return VALID_TRANSITIONS[currentState]?.includes(newState) || false;
};