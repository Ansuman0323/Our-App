import React, { useEffect, useRef, useState } from 'react';
import './RemoteVideo.css';

/**
 * Fills the entire screen with the remote participant's video.
 * Receives ONLY `remoteStream`. Connection-loss detection is derived
 * from the stream's own track state (not an external prop), since the
 * component isn't allowed to know about sockets/peer connections.
 */
function RemoteVideo({ remoteStream }) {
    const videoRef = useRef(null);
    const [isTrackLive, setIsTrackLive] = useState(true);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return undefined;

        if (remoteStream) {
            videoEl.srcObject = remoteStream;
        } else {
            videoEl.srcObject = null;
        }

        return () => {
            videoEl.srcObject = null;
        };
    }, [remoteStream]);

    useEffect(() => {
        if (!remoteStream) {
            setIsTrackLive(false);
            return undefined;
        }

        const videoTrack = remoteStream.getVideoTracks()[0];
        if (!videoTrack) {
            setIsTrackLive(false);
            return undefined;
        }

        setIsTrackLive(videoTrack.readyState === 'live' && !videoTrack.muted);

        const handleEnded = () => setIsTrackLive(false);
        const handleMute = () => setIsTrackLive(false);
        const handleUnmute = () => setIsTrackLive(true);

        videoTrack.addEventListener('ended', handleEnded);
        videoTrack.addEventListener('mute', handleMute);
        videoTrack.addEventListener('unmute', handleUnmute);

        return () => {
            videoTrack.removeEventListener('ended', handleEnded);
            videoTrack.removeEventListener('mute', handleMute);
            videoTrack.removeEventListener('unmute', handleUnmute);
        };
    }, [remoteStream]);

    const showPlaceholder = !remoteStream;
    const showReconnecting = Boolean(remoteStream) && !isTrackLive;

    return (
        <div className="rv-container">
            <video
                ref={videoRef}
                className="rv-video"
                autoPlay
                playsInline
                aria-hidden={showPlaceholder}
            />

            {showPlaceholder && (
                <div className="rv-placeholder" role="status">
                    <div className="rv-placeholder-avatar" aria-hidden="true" />
                    <p className="rv-placeholder-text">Waiting for video…</p>
                </div>
            )}

            {showReconnecting && (
                <div className="rv-reconnecting" role="status" aria-live="polite">
                    <span className="rv-reconnecting-spinner" aria-hidden="true" />
                    <p className="rv-reconnecting-text">Reconnecting…</p>
                </div>
            )}
        </div>
    );
}

export default React.memo(RemoteVideo);