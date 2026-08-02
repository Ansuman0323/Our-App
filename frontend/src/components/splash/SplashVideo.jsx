import { useEffect, useRef, useState } from 'react';

/**
 * Cinematic replacement for SplashHeart + SplashTypewriter.
 *
 * Plays a short MP4 once, muted and inline, then reports completion so
 * the existing splash state machine (SplashScreen.jsx) can apply the
 * same MIN_READY_WAIT_MS / READY_WAIT logic it already had for the
 * typewriter — nothing about that machine changes here, this is just a
 * different "when is the hero moment done" signal.
 *
 * The video is never looped and never seeked back to 0 after it ends,
 * so if the backend isn't ready yet it simply sits frozen on its final
 * frame — like a paused film reel — while SplashLoader keeps talking
 * underneath it. We never call .play() again after the first start, so
 * it can't be accidentally restarted while waiting.
 */
export default function SplashVideo({ src, startDelay = 0, reduceMotion = false, onComplete }) {
    const videoRef = useRef(null);
    const hasCompletedRef = useRef(false);
    const [visible, setVisible] = useState(reduceMotion);

    useEffect(() => {
        hasCompletedRef.current = false;

        if (reduceMotion) {
            // Static frame only: no autoplay, no motion. Report
            // completion immediately, mirroring the old instant (0ms)
            // typewriter behaviour, so pacing downstream is unaffected.
            setVisible(true);
            videoRef.current?.pause();
            if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onComplete?.();
            }
            return undefined;
        }

        setVisible(false);
        const startTimer = setTimeout(() => {
            setVisible(true);
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = 0;
            const playPromise = video.play();
            // Some WebViews reject autoplay without a prior gesture;
            // swallow it rather than throw — the frame still renders.
            if (playPromise?.catch) playPromise.catch(() => { });
        }, startDelay);

        return () => clearTimeout(startTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, startDelay, reduceMotion]);

    const handleEnded = () => {
        // Deliberately empty of any seek/loop logic — the browser
        // leaves the element painted on its last frame on its own,
        // which is exactly the "freeze while waiting" behaviour we want.
        if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete?.();
        }
    };

    return (
        <video
            ref={videoRef}
            className="splash-video"
            style={{ opacity: visible ? 1 : 0 }}
            src={src}
            autoPlay={!reduceMotion}
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            aria-hidden="true"
            onEnded={handleEnded}
        />
    );
}