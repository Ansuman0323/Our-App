import { useEffect, useState } from 'react';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
// Derive the bare backend origin from VITE_API_URL: http://host:5000/api/v1 -> http://host:5000
const API_ORIGIN = RAW_API_URL.replace(/\/api\/v1\/?$/, '');
const HEALTH_ENDPOINT = `${API_ORIGIN}/health`;

const POLL_INTERVAL_MS = 2000;
const REQUEST_TIMEOUT_MS = 4000;
const CONNECTING_THRESHOLD_MS = 5000;
const COLD_START_THRESHOLD_MS = 15000;

/**
 * Pings GET /health immediately, then retries every 2s until the
 * backend responds. Stops forever after the first HTTP 200.
 *
 * IMPORTANT: all "am I cancelled / is a request in flight" state is
 * kept as local variables INSIDE the effect body (not refs). Refs
 * persist across React StrictMode's dev-only double-invoke of
 * effects (mount -> cleanup -> mount again on the same instance),
 * which previously left a stale "cancelled" flag stuck true forever
 * after the first mount, silently preventing any polling from ever
 * happening on the real mount. Plain `let` locals are fresh on every
 * effect invocation, so that stale-flag bug can't happen here.
 */
export function useBackendHealth() {
    const [isReady, setIsReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); // null | 'connecting' | 'cold-start'

    useEffect(() => {
        let cancelled = false;
        let inFlight = false;
        let timeoutId;
        const startedAt = Date.now();

        const tick = async () => {
            if (cancelled || inFlight) return;
            inFlight = true;

            try {
                const controller = new AbortController();
                const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

                const res = await fetch(HEALTH_ENDPOINT, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal,
                });

                clearTimeout(abortTimer);

                if (res.ok) {
                    if (!cancelled) setIsReady(true);
                    return; // success — stop polling for good, no further setTimeout
                }
            } catch {
                // Network error, timeout, or backend still asleep.
                // Swallow and keep retrying — expected during cold start.
            } finally {
                inFlight = false;
            }

            if (cancelled) return;

            const elapsed = Date.now() - startedAt;
            if (elapsed >= COLD_START_THRESHOLD_MS) {
                setStatusMessage('cold-start');
            } else if (elapsed >= CONNECTING_THRESHOLD_MS) {
                setStatusMessage('connecting');
            }

            timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
        };

        tick(); // fire immediately on mount

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, []); // empty deps: this effect's own logic never needs to restart

    return { isReady, statusMessage };
}