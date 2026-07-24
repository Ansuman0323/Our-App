import React from 'react';

/**
 * Pure presentational component. Formats a duration in seconds.
 * Does NOT run a timer itself — `duration` must tick from CallContext.
 */
function formatDuration(totalSeconds) {
    const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
}

function CallDuration({ duration }) {
    const label = formatDuration(duration);

    return (
        <span className="cd-duration" role="timer" aria-label={`Call duration ${label}`}>
            {label}
        </span>
    );
}

export default React.memo(CallDuration);