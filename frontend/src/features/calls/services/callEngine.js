import { RTC_CONFIGURATION, DEFAULT_MEDIA_CONSTRAINTS } from '../config/calls';

const EngineState = {
    UNINITIALIZED: 'UNINITIALIZED',
    MEDIA_READY: 'MEDIA_READY',
    PEER_READY: 'PEER_READY',
    NEGOTIATING: 'NEGOTIATING',
    CONNECTED: 'CONNECTED',
    RECONNECTING: 'RECONNECTING',
    DESTROYING: 'DESTROYING',
    DESTROYED: 'DESTROYED'
};

const MAX_ICE_BUFFER = 100; // Protection against malicious or malformed signaling

/**
 * Lightweight Event Emitter to decouple the engine from UI frameworks.
 */
class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }
    clearListeners() {
        this.listeners = {};
    }
}

/**
 * CallEngine
 * A self-contained, React-agnostic WebRTC communication engine.
 */
export class CallEngine extends EventEmitter {
    constructor(debugMode = false) {
        super();

        // --- Core State ---
        this._state = EngineState.UNINITIALIZED;
        this.pc = null;
        this.localStream = null;
        this.remoteStream = new MediaStream();

        // --- Perfect Negotiation Readiness (Architectural Placeholders) ---
        this._pn = {
            polite: false,
            makingOffer: false,
            ignoreOffer: false,
            isSettingRemoteAnswerPending: false
        };

        // --- Internal Buffers & Caches ---
        this.iceCandidateBuffer = [];
        this._lastStats = null;
        this._lastStatsTimestamp = 0;
        this.debugMode = debugMode;
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    _log(action, details = '') {
        if (!this.debugMode) return;
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console.log(`[CALL ENGINE] [${timestamp}] [${this._state}] ${action}`, details ? details : '');
    }

    _transitionState(newState) {
        if (this._state === EngineState.DESTROYED) return;
        this._log(`State Transition: ${this._state} -> ${newState}`);
        this._state = newState;
        this.emit('engine:statechange', this._state);
    }

    _assertState(allowedStates, methodName) {
        if (!allowedStates.includes(this._state)) {
            const err = new Error(`Cannot execute ${methodName} in state: ${this._state}`);
            this.emit('engine:error', { type: 'invalid_lifecycle_operation', originalError: err });
            throw err;
        }
    }

    // ==========================================
    // MEDIA MANAGER
    // ==========================================

    async startLocalMedia(customConstraints = null) {
        this._assertState([EngineState.UNINITIALIZED], 'startLocalMedia');
        this._log('Requesting local media...');

        try {
            const constraints = customConstraints || DEFAULT_MEDIA_CONSTRAINTS;
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            this.localStream.getTracks().forEach(track => {
                this.emit('track:added', { stream: 'local', track });
            });

            this._transitionState(EngineState.MEDIA_READY);
            this.emit('media:localstream', this.localStream);
            return this.localStream;
        } catch (error) {
            this.emit('engine:error', { type: 'media_permission_denied', originalError: error });
            throw error;
        }
    }

    stopLocalMedia() {
        if (this.localStream) {
            this._log('Stopping local media tracks');
            this.localStream.getTracks().forEach(track => {
                track.stop();
                this.emit('track:removed', { stream: 'local', track });
            });
            this.localStream = null;
        }
        if (this._state === EngineState.MEDIA_READY) {
            this._transitionState(EngineState.UNINITIALIZED);
        }
    }

    toggleCamera(enabled) {
        if (!this.localStream) return;
        const videoTracks = this.localStream.getVideoTracks();
        videoTracks.forEach(track => { track.enabled = enabled; });
        this._log(`Camera toggled: ${enabled}`);
    }

    toggleMicrophone(enabled) {
        if (!this.localStream) return;
        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach(track => { track.enabled = enabled; });
        this._log(`Microphone toggled: ${enabled}`);
    }

    async switchCamera() {
        if (!this.localStream) return;
        try {
            const currentVideoTrack = this.localStream.getVideoTracks()[0];
            const currentSettings = currentVideoTrack.getSettings();
            const newFacingMode = currentSettings.facingMode === 'user' ? 'environment' : 'user';

            currentVideoTrack.stop();
            this.emit('track:removed', { stream: 'local', track: currentVideoTrack });

            const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacingMode } });
            const newVideoTrack = newStream.getVideoTracks()[0];

            this.localStream.removeTrack(currentVideoTrack);
            this.localStream.addTrack(newVideoTrack);
            this.emit('track:added', { stream: 'local', track: newVideoTrack });

            await this.replaceTrack(newVideoTrack, 'video');
            this.emit('media:localstream', this.localStream);
        } catch (error) {
            this.emit('engine:error', { type: 'camera_switch_failed', originalError: error });
            throw error;
        }
    }

    async replaceTrack(newTrack, kind = 'video') {
        this._log(`Replacing ${kind} track`);
        if (!this.pc) return;

        const senders = this.pc.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === kind);

        if (sender) {
            await sender.replaceTrack(newTrack);
            this.emit('track:replaced', { kind, track: newTrack });
        }
    }

    async enumerateDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return { audioInputs: [], videoInputs: [], audioOutputs: [] };
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
            audioInputs: devices.filter(d => d.kind === 'audioinput').map(d => ({ id: d.deviceId, label: d.label || 'Microphone' })),
            videoInputs: devices.filter(d => d.kind === 'videoinput').map(d => ({ id: d.deviceId, label: d.label || 'Camera' })),
            audioOutputs: devices.filter(d => d.kind === 'audiooutput').map(d => ({ id: d.deviceId, label: d.label || 'Speaker' }))
        };
    }

    // ==========================================
    // PEER CONNECTION MANAGER
    // ==========================================

    createPeerConnection() {
        this._assertState([EngineState.MEDIA_READY, EngineState.UNINITIALIZED], 'createPeerConnection');
        if (this.pc) return;

        this._log('Creating RTCPeerConnection', RTC_CONFIGURATION);
        this.pc = new RTCPeerConnection(RTC_CONFIGURATION);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });
        }

        this._bindPeerConnectionListeners();
        this._transitionState(EngineState.PEER_READY);
    }

    _bindPeerConnectionListeners() {
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this._log('Generated local ICE candidate');
                this.emit('ice:candidate', event.candidate);
            }
        };

        this.pc.ontrack = (event) => {
            this._log('Received remote track', event.track.kind);
            event.streams[0].getTracks().forEach(track => {
                if (!this.remoteStream.getTracks().includes(track)) {
                    this.remoteStream.addTrack(track);
                    this.emit('track:added', { stream: 'remote', track });
                }
            });
            this.emit('media:remotestream', this.remoteStream);
        };

        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            this._log(`RTCPeerConnection state changed: ${state}`);

            if (state === 'connected') this._transitionState(EngineState.CONNECTED);
            if (state === 'failed' || state === 'closed') {
                this.emit('engine:error', { type: 'connection_failed', state });
            }
            this.emit('connection:statechange', state);
        };

        this.pc.oniceconnectionstatechange = () => {
            this.emit('ice:connectionstatechange', this.pc.iceConnectionState);
        };
    }

    // ==========================================
    // NEGOTIATION MANAGER
    // ==========================================

    async createOffer() {
        this._assertState([EngineState.PEER_READY, EngineState.CONNECTED], 'createOffer');
        this._transitionState(EngineState.NEGOTIATING);

        try {
            this._pn.makingOffer = true;
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this._log('Created and set local SDP Offer');
            return this.pc.localDescription;
        } catch (error) {
            this.emit('engine:error', { type: 'offer_creation_failed', originalError: error });
            throw error;
        } finally {
            this._pn.makingOffer = false;
        }
    }

    async createAnswer() {
        this._assertState([EngineState.NEGOTIATING], 'createAnswer');
        try {
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            this._log('Created and set local SDP Answer');
            return this.pc.localDescription;
        } catch (error) {
            this.emit('engine:error', { type: 'answer_creation_failed', originalError: error });
            throw error;
        }
    }

    async setRemoteDescription(sdp) {
        this._assertState([EngineState.PEER_READY, EngineState.NEGOTIATING, EngineState.CONNECTED], 'setRemoteDescription');
        if (this._state === EngineState.PEER_READY) this._transitionState(EngineState.NEGOTIATING);

        try {
            const rtcSdp = new RTCSessionDescription(sdp);
            await this.pc.setRemoteDescription(rtcSdp);
            this._log(`Set remote description: ${sdp.type}`);
            await this._flushIceCandidateBuffer();
        } catch (error) {
            this.emit('engine:error', { type: 'invalid_remote_sdp', originalError: error });
            throw error;
        }
    }

    async addIceCandidate(candidateData) {
        if (!this.pc) return;

        try {
            const candidate = new RTCIceCandidate(candidateData);

            if (!this.pc.remoteDescription || !this.pc.remoteDescription.type) {
                if (this.iceCandidateBuffer.length >= MAX_ICE_BUFFER) {
                    this._log('ICE Buffer Overflow. Discarding candidate.');
                    return;
                }
                this.iceCandidateBuffer.push(candidate);
                this._log('Buffered remote ICE candidate');
                return;
            }

            await this.pc.addIceCandidate(candidate);
            this._log('Added remote ICE candidate');
        } catch (error) {
            this.emit('engine:error', { type: 'invalid_remote_ice', originalError: error });
        }
    }

    async _flushIceCandidateBuffer() {
        if (this.iceCandidateBuffer.length === 0) return;
        this._log(`Flushing ${this.iceCandidateBuffer.length} buffered ICE candidates`);

        while (this.iceCandidateBuffer.length > 0) {
            const candidate = this.iceCandidateBuffer.shift();
            try {
                await this.pc.addIceCandidate(candidate);
            } catch (error) {
                this._log('Failed to add buffered ICE candidate', error.message);
            }
        }
    }

    restartIce() {
        if (!this.pc) return;
        this._log('Triggering ICE Restart');
        this.pc.restartIce();
    }

    // ==========================================
    // STATS MANAGER
    // ==========================================

    async getConnectionStats() {
        if (!this.pc) return null;
        try {
            const stats = await this.pc.getStats();
            const now = performance.now();

            let normalized = {
                bitrate: 0,
                latency: 0,
                jitter: 0,
                fps: 0,
                resolution: 'Unknown',
                packetsLost: 0,
                connectionType: 'unknown'
            };

            let bytesReceived = 0;

            stats.forEach(stat => {
                if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                    normalized.jitter = stat.jitter || 0;
                    normalized.packetsLost = stat.packetsLost || 0;
                    normalized.fps = stat.framesPerSecond || 0;
                    normalized.resolution = `${stat.frameWidth || 0}x${stat.frameHeight || 0}`;
                    bytesReceived = stat.bytesReceived || 0;
                }
                if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                    normalized.latency = stat.currentRoundTripTime * 1000 || 0;

                    const localCandidate = stats.get(stat.localCandidateId);
                    if (localCandidate) {
                        normalized.connectionType = localCandidate.candidateType || 'unknown'; // 'host', 'srflx', 'relay'
                    }
                }
            });

            // Calculate Bitrate (kbps)
            if (this._lastStats && this._lastStatsTimestamp) {
                const deltaBytes = bytesReceived - this._lastStats.bytesReceived;
                const deltaTime = (now - this._lastStatsTimestamp) / 1000;
                if (deltaTime > 0 && deltaBytes > 0) {
                    normalized.bitrate = Math.round((deltaBytes * 8) / deltaTime / 1000);
                }
            }

            this._lastStats = { bytesReceived };
            this._lastStatsTimestamp = now;

            return normalized;
        } catch (error) {
            this._log('Failed to gather stats', error);
            return null;
        }
    }

    // ==========================================
    // CLEANUP MANAGER
    // ==========================================

    destroy() {
        if (this._state === EngineState.DESTROYED || this._state === EngineState.DESTROYING) return;
        this._transitionState(EngineState.DESTROYING);
        this._log('Initiating engine teardown...');

        // 1. Release local hardware explicitly
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                this.emit('track:removed', { stream: 'local', track });
            });
            this.localStream = null;
        }

        // 2. Release remote tracks
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => {
                track.stop();
                this.emit('track:removed', { stream: 'remote', track });
            });
            this.remoteStream = null;
        }

        // 3. Teardown PeerConnection safely
        if (this.pc) {
            this.pc.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop();
            });

            this.pc.onicecandidate = null;
            this.pc.ontrack = null;
            this.pc.onconnectionstatechange = null;
            this.pc.oniceconnectionstatechange = null;

            this.pc.close();
            this.pc = null;
        }

        // 4. Clear internal buffers
        this.iceCandidateBuffer = [];
        this._lastStats = null;

        // 5. Emit final event BEFORE clearing listeners
        this._transitionState(EngineState.DESTROYED);
        this.emit('engine:destroyed', null);

        // 6. Complete Isolation
        this.clearListeners();
    }
}