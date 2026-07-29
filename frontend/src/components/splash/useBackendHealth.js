import { useEffect, useRef, useState } from 'react';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
// Derive the bare backend origin from VITE_API_URL so we don't need
// a second env var: http://host:5000/api/v1 -> http://host:5000
const API_ORIGIN = RAW_API_URL.replace(/\/api\/v1\/?$/, '');
const HEALTH_ENDPOINT = `${API_ORIGIN}/health`;

const POLL_INTERVAL_MS = 2000;
const REQUEST_TIMEOUT_MS = 4000;
const CONNECTING_THRESHOLD_MS = 5000;
const COLD_START_THRESHOLD_MS = 15000;

/**
 * Pings GET /health immediately, then retries every 2s until the
 * backend responds. Never gives up (no timeout ceiling) and never
 * overlaps requests. Surfaces a `statusMessage` key so the UI can
 * show progressively more reassuring copy the longer a Render free
 * instance takes to wake up.
 */
export function useBackendHealth() {
    const [isReady, setIsReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); // null | 'connecting' | 'cold-start'

    const startedAtRef = useRef(Date.now());
    const inFlightRef = useRef(false);
    const cancelledRef = useRef(false);

    useEffect(() => {
        let timeoutId;

        const tick = async () => {
            if (cancelledRef.current || inFlightRef.current) return;
            inFlightRef.current = true;

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
                    if (!cancelledRef.current) setIsReady(true);
                    return; // stop polling — we're done
                }
            } catch {
                // Network error, timeout, or backend still asleep.
                // Swallow and keep retrying — this is expected during cold start.
            } finally {
                inFlightRef.current = false;
            }

            if (cancelledRef.current) return;

            const elapsed = Date.now() - startedAtRef.current;
            if (elapsed >= COLD_START_THRESHOLD_MS) {
                setStatusMessage('cold-start');
            } else if (elapsed >= CONNECTING_THRESHOLD_MS) {
                setStatusMessage('connecting');
            }

            timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
        };

        tick(); // fire immediately on mount — wake the backend right away

        return () => {
            cancelledRef.current = true;
            clearTimeout(timeoutId);
        };
    }, []);

    return { isReady, statusMessage };
}