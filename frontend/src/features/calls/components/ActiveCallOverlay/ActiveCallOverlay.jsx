import React from 'react';
import { useCall } from '../../contexts/CallContext'; // frozen — do not modify
import RemoteVideo from '../RemoteVideo/RemoteVideo';
import LocalVideo from '../LocalVideo/LocalVideo';
import CallControls from '../CallControls/CallControls';
import ConnectionIndicator from '../ConnectionIndicator/ConnectionIndicator';
import CallDuration from '../CallDuration/CallDuration';
import './ActiveCallOverlay.css';

const VISIBLE_STATES = new Set(['CONNECTING', 'CONNECTED', 'ENDING']);

/**
 * Composes the in-call UI from presentational children. Owns layout,
 * responsive shell, and overlay visibility only. All call logic lives
 * in CallContext — this component only reads from it and forwards
 * action callbacks down to children.
 */
function ActiveCallOverlay() {
    const {
        callState,
        localStream,
        remoteStream,
        cameraEnabled,
        micEnabled,
        connectionQuality,
        duration,
        partnerName,
        toggleMute,
        toggleCamera,
        switchCamera,
        endCall,
    } = useCall();

    if (!VISIBLE_STATES.has(callState)) {
        return null;
    }

    return (
        <div className="aco-overlay" data-call-state={callState.toLowerCase()}>
            <RemoteVideo remoteStream={remoteStream} />

            <div className="aco-top-bar">
                <div className="aco-top-left">
                    <ConnectionIndicator quality={connectionQuality} />
                    <CallDuration duration={duration} />
                </div>
                <span className="aco-partner-name">{partnerName}</span>
            </div>

            <LocalVideo localStream={localStream} cameraEnabled={cameraEnabled} />

            <CallControls
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