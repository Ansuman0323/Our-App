import { useCallback, useRef } from 'react';

const LONG_PRESS_MS = 500;
const DOUBLE_TAP_WINDOW_MS = 300;
const VIDEO_SELECTOR = '.splash-video';

/**
 * Detects a long-press (hold) or a double-tap anywhere within the
 * handlers' host element, and reports whether the gesture originated
 * on the hero video (`source: 'video'`) or elsewhere (`source: 'screen'`).
 *
 * All "am I enabled / what should I call" state is read via refs so
 * the pointer handlers never need to be recreated when the parent
 * re-renders — only one set of listeners is ever attached, for the
 * lifetime of the component.
 */
export function useSplashSkipGesture({ enabled, allowHold, allowDoubleTap, onSkip }) {
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;

    const allowHoldRef = useRef(allowHold);
    allowHoldRef.current = allowHold;

    const allowDoubleTapRef = useRef(allowDoubleTap);
    allowDoubleTapRef.current = allowDoubleTap;

    const onSkipRef = useRef(onSkip);
    onSkipRef.current = onSkip;

    const longPressTimerRef = useRef(null);
    const longPressFiredRef = useRef(false);
    const lastTapAtRef = useRef(0);

    const resolveSource = useCallback((event) => {
        const target = event.target;
        if (target?.closest && target.closest(VIDEO_SELECTOR)) return 'video';
        return 'screen';
    }, []);

    const clearLongPressTimer = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const onPointerDown = useCallback((event) => {
        if (!enabledRef.current) return;
        longPressFiredRef.current = false;

        if (allowHoldRef.current) {
            const source = resolveSource(event);
            longPressTimerRef.current = setTimeout(() => {
                longPressFiredRef.current = true;
                onSkipRef.current?.(source);
            }, LONG_PRESS_MS);
        }
    }, [resolveSource]);

    const onPointerUp = useCallback((event) => {
        if (!enabledRef.current) {
            clearLongPressTimer();
            return;
        }

        clearLongPressTimer();

        // The long-press already fired and triggered the skip — this
        // pointerup is just its tail end, not a new tap.
        if (longPressFiredRef.current) {
            longPressFiredRef.current = false;
            return;
        }

        if (!allowDoubleTapRef.current) return;

        const now = Date.now();
        const source = resolveSource(event);
        if (now - lastTapAtRef.current <= DOUBLE_TAP_WINDOW_MS) {
            lastTapAtRef.current = 0;
            onSkipRef.current?.(source);
        } else {
            lastTapAtRef.current = now;
        }
    }, [clearLongPressTimer, resolveSource]);

    const onPointerCancel = useCallback(() => {
        clearLongPressTimer();
        longPressFiredRef.current = false;
    }, [clearLongPressTimer]);

    return {
        onPointerDown,
        onPointerUp,
        onPointerLeave: onPointerCancel,
        onPointerCancel,
    };
}