import React, { useEffect, useRef, useState } from 'react';
import './LocalVideo.css';

/**
 * Floating picture-in-picture preview of the local camera.
 * Receives ONLY `localStream` and `cameraEnabled`.
 *
 * Position is kept in local state so a future drag interaction only
 * needs to update `position` on pointer move — no other change
 * required elsewhere in the tree. Dragging itself is intentionally
 * NOT implemented, per spec.
 */
function LocalVideo({ localStream, cameraEnabled }) {
    const videoRef = useRef(null);
    // Default corner placement. A future drag handler would setPosition()
    // in response to pointer events on `.lv-container`.
    const [position] = useState({ corner: 'bottom-right' });

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return undefined;

        videoEl.srcObject = localStream || null;

        return () => {
            videoEl.srcObject = null;
        };
    }, [localStream]);

    const showVideo = Boolean(localStream) && cameraEnabled;

    return (
        <div
            className="lv-container"
            data-corner={position.corner}
        // draggable={false} today; a drag hook would toggle this and
        // attach onPointerDown/onPointerMove handlers here.
        >
            <video
                ref={videoRef}
                className="lv-video"
                autoPlay
                muted
                playsInline
                aria-hidden={!showVideo}
                style={{ visibility: showVideo ? 'visible' : 'hidden' }}
            />

            {!showVideo && (
                <div className="lv-placeholder" role="status" aria-label="Camera is off">
                    <span className="lv-placeholder-icon" aria-hidden="true">
                        &#128248;
                    </span>
                </div>
            )}
        </div>
    );
}

export default React.memo(LocalVideo);