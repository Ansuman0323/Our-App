/**
 * frontend/src/features/calls/utils/validation.js
 */

export const isValidPayload = (payload) => {
    // Ensures the payload is an object and contains a valid call_id string
    // Matches the backend's `validate_base_payload` strictness
    return (
        payload !== null &&
        typeof payload === 'object' &&
        typeof payload.call_id === 'string' &&
        payload.call_id.trim() !== ''
    );
};