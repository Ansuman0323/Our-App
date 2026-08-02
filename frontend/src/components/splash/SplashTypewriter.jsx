import { useEffect, useRef, useState } from 'react';

const DEFAULT_CHAR_INTERVAL_MS = 45;

/**
 * Types `text` out one character at a time, then leaves the line in
 * place. Purely decorative — no effect on health polling — but reports
 * completion so the splash's state machine reacts to real timing.
 *
 * Accessibility fix: the typing DOM is now aria-hidden and the full
 * quote is exposed once, in a visually-hidden sibling. Previously
 * VoiceOver re-announced the partial string on every character.
 *
 * The blinking cursor is gone. A terminal caret on an emotional
 * one-line quote signals "code is running", and it was the only
 * element in the scene animating off the shared clock (0.9s steps).
 */
export default function SplashTypewriter({
    text,
    startDelay = 0,
    charIntervalMs = DEFAULT_CHAR_INTERVAL_MS,
    onComplete,
}) {
    // charIntervalMs === 0 means reduced motion: render whole, at once.
    const instant = charIntervalMs === 0;
    const [visibleChars, setVisibleChars] = useState(() => (instant ? text.length : 0));
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        hasCompletedRef.current = false;

        if (instant) {
            setVisibleChars(text.length);
            hasCompletedRef.current = true;
            onComplete?.();
            return undefined;
        }

        let charIndex = 0;
        let intervalId;

        const startTimer = setTimeout(() => {
            intervalId = setInterval(() => {
                charIndex += 1;
                setVisibleChars(charIndex);
                if (charIndex >= text.length) {
                    clearInterval(intervalId);
                    if (!hasCompletedRef.current) {
                        hasCompletedRef.current = true;
                        onComplete?.();
                    }
                }
            }, charIntervalMs);
        }, startDelay);

        return () => {
            clearTimeout(startTimer);
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, startDelay, charIntervalMs, instant]);

    return (
        <p className="splash__tagline">
            <span aria-hidden="true">{text.slice(0, visibleChars)}</span>
            <span
                style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    clip: 'rect(0 0 0 0)',
                    whiteSpace: 'nowrap',
                }}
            >
                {text.replace('\n', ' ')}
            </span>
        </p>
    );
}
