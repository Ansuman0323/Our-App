/**
 * Global Configuration for WebRTC Video Calling
 * 
 * This module is completely immutable and environment-aware.
 * It acts as the single source of truth for all WebRTC constraints, 
 * timeouts, features, and browser capabilities.
 */

// Utility to ensure deep immutability of nested configuration objects
const deepFreeze = (obj) => {
    Object.keys(obj).forEach(prop => {
        if (typeof obj[prop] === 'object' && obj[prop] !== null && !Object.isFrozen(obj[prop])) {
            deepFreeze(obj[prop]);
        }
    });
    return Object.freeze(obj);
};

// ==========================================
// BROWSER CAPABILITY DETECTION
// ==========================================
// Evaluated once at parse-time. Prevents the callEngine from crashing 
// if executing in environments lacking specific WebRTC APIs.
const hasWindow = typeof window !== 'undefined';
const hasNavigator = hasWindow && typeof window.navigator !== 'undefined';
const hasMediaDevices = hasNavigator && !!window.navigator.mediaDevices;

export const BROWSER_CAPABILITIES = deepFreeze({
    supportsMediaDevices: hasMediaDevices,
    supportsScreenShare: hasMediaDevices && typeof window.navigator.mediaDevices.getDisplayMedia === 'function',
    supportsPictureInPicture: hasWindow && 'pictureInPictureEnabled' in document,
    supportsInsertableStreams: hasWindow && typeof window.RTCRtpSender !== 'undefined' && !!window.RTCRtpSender.prototype.createEncodedStreams
});

// ==========================================
// ENVIRONMENT VARIABLES & TURN PLACEHOLDERS
// ==========================================
/* 
 * SECURITY WARNING: 
 * Hardcoding TURN credentials in client-side bundles via environment variables 
 * (VITE_TURN_CREDENTIAL) is acceptable ONLY for local development or heavily 
 * restricted private applications. 
 * 
 * For large-scale production, do NOT use these. Instead, the `callEngine` 
 * should fetch ephemeral, time-limited TURN credentials from the backend 
 * (e.g., via Twilio Network Traversal API or a Coturn REST API) right before 
 * initializing the RTCPeerConnection.
 */
const TURN_URL = import.meta.env.VITE_TURN_URL || null;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || null;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || null;

const TURN_URLS = [
    import.meta.env.VITE_STUN_URL,
    import.meta.env.VITE_TURN_URL_UDP,
    import.meta.env.VITE_TURN_URL_TCP,
    import.meta.env.VITE_TURN_URL_443,
    import.meta.env.VITE_TURN_URL_TLS,
].filter(Boolean);

// ==========================================
// ICE & RTC CONFIGURATION
// ==========================================
/**
 * Controls how the RTCPeerConnection behaves and traverses NATs.
 * Used exclusively by the `callEngine` during `new RTCPeerConnection(RTC_CONFIGURATION)`.
 */
const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
];

if (TURN_URLS.length && TURN_USERNAME && TURN_CREDENTIAL) {

    // First STUN
    iceServers.push({
        urls: TURN_URLS[0]
    });

    // Remaining TURN servers
    TURN_URLS.slice(1).forEach(url => {
        iceServers.push({
            urls: url,
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL
        });
    });
}

export const RTC_CONFIGURATION = deepFreeze({
    iceServers: iceServers,

    // Gathers a pool of ICE candidates before createOffer is even called, reducing connection latency.
    iceCandidatePoolSize: 2,

    // Multiplexes all media (audio/video) over a single DTLS transport, saving bandwidth and ports.
    bundlePolicy: 'max-bundle',

    // Enforces the modern SDP format (legacy Plan B is deprecated by all modern browsers).
    sdpSemantics: 'unified-plan'
});

// ==========================================
// TIMEOUTS
// ==========================================
/**
 * Controls the temporal boundaries of the Finite State Machine (FSM).
 * Consumed by `CallContext` to automatically transition states on failure.
 */
export const TIMEOUTS = deepFreeze({
    RINGING_TIMEOUT: 30000,        // 30s: Auto-cancel outgoing calls if unanswered
    DISCONNECT_GRACE: 5000,        // 5s: Allow socket to reconnect before killing WebRTC
    CALL_TIMEOUT: 3600000,         // 1h: Failsafe to terminate zombie/orphaned calls
    HEARTBEAT_INTERVAL: 10000      // 10s: Interval for pinging peer health (if needed)
});

// ==========================================
// RECONNECT STRATEGY
// ==========================================
/**
 * Exponential backoff parameters for network recovery.
 * Used by `callEngine` during ICE restarts or socket disconnections.
 */
export const RECONNECT = deepFreeze({
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 1.5
});

// ==========================================
// MEDIA PRESETS
// ==========================================
/**
 * Standardized media constraint sets.
 * Used by `callEngine` to request hardware devices via `getUserMedia`.
 * Changing presets allows for future adaptive bitrate downgrading.
 */
export const MEDIA_PRESETS = deepFreeze({
    LOW_BANDWIDTH: {
        video: { width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 15, max: 20 } },
        audio: { echoCancellation: true, noiseSuppression: true }
    },
    MOBILE: {
        video: { facingMode: 'user', width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    DESKTOP: {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    HIGH_QUALITY: {
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    VOICE_ONLY: {
        video: false,
        audio: { echoCancellation: true, noiseSuppression: true }
    }
});

// Mobile-first default selection for standard initialization
export const DEFAULT_MEDIA_CONSTRAINTS = MEDIA_PRESETS.MOBILE;

// ==========================================
// FEATURE FLAGS
// ==========================================
/**
 * Toggles for UI elements.
 * Consumed by React components (e.g., `CallControls`) to determine what buttons to render.
 */
export const FEATURE_FLAGS = deepFreeze({
    screenShare: false,
    pictureInPicture: true,
    voiceOnly: true,
    cameraSwitch: true,
    backgroundBlur: false,
    virtualBackground: false
});