import React, { useEffect, useRef } from 'react';
import './RemoteAudio.css';

/**
 * Headless audio sink for the remote participant's stream.
 * Used for voice calls, where there is no <RemoteVideo> mounted to
 * carry the <video> element that would otherwise play remote audio.
 *
 * Renders a single hidden <audio> element and keeps it in sync with
 * whatever `remoteStream` currently is. No visual output, no layout
 * impact.
 */
function RemoteAudio({ remoteStream }) {
    const audioRef = useRef(null);

    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return undefined;

        audioEl.srcObject = remoteStream || null;

        const hasAudioTrack = Boolean(remoteStream) && remoteStream.getAudioTracks().length > 0;

        if (hasAudioTrack) {
            const playPromise = audioEl.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((err) => {
                    // AbortError fires routinely when srcObject changes or the
                    // component unmounts mid-play(); it's not an actual failure.
                    if (err?.name === 'AbortError') return;
                    console.error('RemoteAudio: playback failed', err);
                });
            }
        }

        return () => {
            audioEl.srcObject = null;
        };
    }, [remoteStream]);

    return (
        <audio
            ref={audioRef}
            className="ra-audio"
            autoPlay
            playsInline
            hidden
        />
    );
}

export default React.memo(RemoteAudio);