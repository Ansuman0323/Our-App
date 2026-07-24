export const normalizeEngineError = (errorObj, fallbackType = 'unknown_error') => {
    return {
        code: errorObj?.code || 'ERR_UNKNOWN',
        type: errorObj?.type || fallbackType,
        message: errorObj?.message || errorObj?.originalError?.message || 'An unexpected communication error occurred.',
        recoverable: errorObj?.recoverable || false
    };
};