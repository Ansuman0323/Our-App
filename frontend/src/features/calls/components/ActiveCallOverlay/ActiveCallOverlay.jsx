import React, { useMemo } from 'react';
import { useCall } from '../../contexts/CallContext';
import RemoteVideo from '../RemoteVideo/RemoteVideo';
import LocalVideo from '../LocalVideo/LocalVideo';
import RemoteAudio from '../RemoteAudio/RemoteAudio';
import CallControls from '../CallControls/CallControls';
import ConnectionIndicator from '../ConnectionIndicator/ConnectionIndicator';
import CallDuration from '../CallDuration/CallDuration';
import './ActiveCallOverlay.css';

const VISIBLE_STATES = new Set(['CONNECTING', 'CONNECTED', 'ENDING']);

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function ActiveCallOverlay() {
    const {
        callState,
        localStream,
        remoteStream,
        cameraEnabled,
        micEnabled,
        connectionQuality,
        callStartedAt,
        partnerName,
        partnerProfile,
        callType,
        toggleMute,
        toggleCamera,
        switchCamera,
        endCall,
    } = useCall();

    // Hooks must run unconditionally on every render, so this is computed
    // before the visibility early-return below (previously this useMemo
    // was called after the return, which is a conditional hook call).
    const initials = useMemo(() => getInitials(partnerName), [partnerName]);

    if (!VISIBLE_STATES.has(callState)) {
        return null;
    }

    const isVoice = callType === 'voice';
    const hasAvatar = Boolean(partnerProfile?.avatarUrl);

    return (
        <div className="aco-overlay" data-call-state={callState.toLowerCase()} data-call-type={callType}>

            {/* Dynamic Rendering based on Call Type */}
            {isVoice ? (
                <>
                    {/* Voice calls have no <RemoteVideo>, so remote audio has
                        nothing to attach to unless we mount a dedicated,
                        invisible audio sink here. */}
                    <RemoteAudio remoteStream={remoteStream} />

                    <div className="aco-voice-layout">
                        <div className="aco-voice-status">
                            <ConnectionIndicator quality={connectionQuality} />
                        </div>

                        <div className="aco-voice-center">
                            <div className="aco-voice-avatar-wrapper">
                                {hasAvatar ? (
                                    <img src={partnerProfile.avatarUrl} alt="" className="aco-voice-avatar" />
                                ) : (
                                    <div className="aco-voice-avatar aco-voice-fallback">{initials}</div>
                                )}
                                <div className="aco-voice-ripple"></div>
                                <div className="aco-voice-ripple delay"></div>
                            </div>

                            <h2 className="aco-voice-name">{partnerName || 'Unknown Caller'}</h2>
                            <span className="aco-voice-subtitle">Voice Call</span>
                            <div className="aco-voice-timer">
                                <CallDuration callStartedAt={callStartedAt} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <RemoteVideo remoteStream={remoteStream} />
                    <div className="aco-top-bar">
                        <div className="aco-top-left">
                            <ConnectionIndicator quality={connectionQuality} />
                            <CallDuration callStartedAt={callStartedAt} />
                        </div>
                        <span className="aco-partner-name">{partnerName}</span>
                    </div>
                    <LocalVideo localStream={localStream} cameraEnabled={cameraEnabled} />
                </>
            )}

            <CallControls
                callType={callType}
                micEnabled={micEnabled}
                cameraEnabled={cameraEnabled}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
                onSwitchCamera={switchCamera}
                onEndCall={endCall}
            />
        </div>
    );
}

export default React.memo(ActiveCallOverlay);