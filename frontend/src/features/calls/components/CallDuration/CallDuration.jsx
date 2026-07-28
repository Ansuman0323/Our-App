import React, { useEffect, useRef, useState } from 'react';

/**
 * Self-ticking presentational component. Owns its own 1s interval,
 * deriving elapsed time from `callStartedAt` (a Date.now() timestamp,
 * or null when there is no active call). No other part of the app
 * re-renders when the second hand ticks — this component's local
 * state is the only thing that changes every second.
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

function CallDuration({ callStartedAt }) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        // No active call (idle, or just reset) — stop ticking and snap back to 00:00.
        if (!callStartedAt) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setElapsedSeconds(0);
            return;
        }

        // Compute immediately so the display doesn't sit at 00:00 for a full second
        // before the first interval tick fires.
        const tick = () => {
            setElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
        };
        tick();

        intervalRef.current = setInterval(tick, 1000);

        // Cleanup on unmount AND whenever callStartedAt changes (new call, or reset to null)
        // — this is what prevents interval leaks across repeated calls.
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [callStartedAt]);

    const label = formatDuration(elapsedSeconds);

    return (
        <span className="cd-duration" role="timer" aria-label={`Call duration ${label}`}>
            {label}
        </span>
    );
}

export default React.memo(CallDuration);