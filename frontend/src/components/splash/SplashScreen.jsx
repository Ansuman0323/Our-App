import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SplashParticles from './SplashParticles';
import SplashVideo from './SplashVideo';
import SplashLoader from './SplashLoader';
import HeartGlyph from './HeartGlyph';
import { getRandomQuote } from './splashQuotes';
import { getSplashOccasion } from './splashOccasion';
import { SPLASH_EASE } from './motionConstants';
import { useSceneProfile } from './useSceneProfile';
import { useSplashSkipGesture } from './useSplashSkipGesture';
import './SplashScreen.css';

// The wordmark now lives inside the video itself (baked into the
// footage), so this screen no longer renders a text title. What it
// renders instead is a rotating line from splashQuotes.js — the
// emotional beat that used to be typed out letter by letter.

// --- Pacing ---
// The old build floored the sequence at 2600ms and then held a further
// 2400ms after the backend was ready — ~5s of deliberate waiting on a
// screen the user sees every launch. The floor now only protects the
// entrance from being cut mid-frame; once ready, we leave promptly.
const MIN_READY_WAIT_MS = 1400;
const AUTO_EXIT_DELAY_MS = 900;

// The affordance appears as soon as skipping is possible — no delay.
// A control the user cannot see is a control that does not exist.
const HINT_DELAY_MS = 0;
const EXIT_DURATION_MS = 420;

export const SPLASH_PHASE = {
    INTRO: 'INTRO',
    HEART_FORMING: 'HEART_FORMING',
    TITLE: 'TITLE',
    TYPEWRITER: 'TYPEWRITER',
    READY_WAIT: 'READY_WAIT',
    EXITING: 'EXITING',
    FINISHED: 'FINISHED',
};

// Same shape as before, so any settings feature already written against
// this contract keeps working. `allowTapToSkip` is the new primary
// affordance; hold / double-tap remain as accelerators for users who
// learned them.
export const DEFAULT_SPLASH_SETTINGS = {
    // 'always-play'        — full sequence every time, manual skip disabled
    // 'auto' (default)     — full sequence, skip once armed & ready
    // 'skip-automatically' — leave the instant the backend is ready
    openingSequence: 'auto',
    allowTapToSkip: true,
    allowHoldToSkip: true,
    allowDoubleTapToSkip: true,
};

export default function SplashScreen({
    ready,
    statusMessage,
    onExitComplete,
    settings,
    // Point this at your actual bundled asset, e.g.
    // `import splashVideoSrc from '../../assets/splash/splash-intro.mp4'`
    // and pass it in as videoSrc={splashVideoSrc}.
    videoSrc = "/splash/Together2.mp4"
}) {
    const mergedSettings = useMemo(
        () => ({ ...DEFAULT_SPLASH_SETTINGS, ...settings }),
        [settings]
    );

    const [phase, setPhase] = useState(SPLASH_PHASE.INTRO);
    const [exitSource, setExitSource] = useState(null); // 'video' | 'screen' | 'auto' | null
    const [showHint, setShowHint] = useState(false);

    const tagline = useMemo(getRandomQuote, []);
    const occasion = useMemo(() => getSplashOccasion(), []);

    // Honour the OS setting in JS as well as CSS. Previously the media
    // query silenced the stylesheet while every Framer Motion transition
    // kept playing — the letter stagger, the exit scale, the bloom, and
    // all particle motion. Now one flag governs both halves.
    const reduceMotion = useReducedMotion();

    const sceneProfile = useSceneProfile();
    // typewriterStartMs is reused as the video's start delay — same
    // choreography slot the tagline used to occupy, just driving a
    // different element now. charIntervalMs was typewriter-only and
    // is no longer read.
    const { titleStartMs, typewriterStartMs } = sceneProfile.timing;

    // With reduced motion the scene is a static poster: no entrance
    // staggers, no video playback — everything is simply present.
    const t = useCallback((ms) => (reduceMotion ? 0 : ms), [reduceMotion]);

    const styleVars = useMemo(() => ({
        ...occasion.vars,
        '--splash-title-size': sceneProfile.typography.titleSize,
        '--splash-title-tracking': sceneProfile.typography.titleLetterSpacing,
        '--splash-tagline-size': sceneProfile.typography.taglineSize,
        '--splash-tagline-lh': sceneProfile.typography.taglineLineHeight,
        '--splash-content-gap': `${sceneProfile.spacing.contentGap}px`,
        '--splash-content-max-w': typeof sceneProfile.spacing.contentMaxWidth === 'number'
            ? `${sceneProfile.spacing.contentMaxWidth}px`
            : sceneProfile.spacing.contentMaxWidth,
        '--splash-content-padding': `${sceneProfile.spacing.contentPadding}px`,
    }), [occasion.vars, sceneProfile]);

    // Every timer is tracked so unmount (or StrictMode's double-invoke)
    // can never leave one running.
    const timersRef = useRef([]);
    const setManagedTimeout = useCallback((fn, delay) => {
        const id = setTimeout(fn, delay);
        timersRef.current.push(id);
        return id;
    }, []);
    useEffect(() => () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);

    useEffect(() => {
        setManagedTimeout(() => setPhase(SPLASH_PHASE.HEART_FORMING), 0);
        setManagedTimeout(() => setPhase(SPLASH_PHASE.TITLE), t(titleStartMs));
        setManagedTimeout(() => setPhase(SPLASH_PHASE.TYPEWRITER), t(typewriterStartMs));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setManagedTimeout]);

    // Same "how long has the hero moment actually been playing" math
    // the typewriter used — now measuring the video's start-to-end
    // window instead of the character-typing window.
    const videoStartedAtRef = useRef(null);
    if (videoStartedAtRef.current === null) {
        videoStartedAtRef.current = Date.now() + t(typewriterStartMs);
    }
    const handleVideoComplete = useCallback(() => {
        const elapsed = Date.now() - videoStartedAtRef.current;
        const remaining = Math.max(0, MIN_READY_WAIT_MS - elapsed);
        setManagedTimeout(() => setPhase(SPLASH_PHASE.READY_WAIT), remaining);
    }, [setManagedTimeout]);

    // --- Exit: the single, idempotent entry point. ---
    const exitTriggeredRef = useRef(false);
    const triggerExit = useCallback((source) => {
        if (exitTriggeredRef.current) return;
        if (!ready) return;

        const bypassArmGate = mergedSettings.openingSequence === 'skip-automatically';
        if (!bypassArmGate && phase !== SPLASH_PHASE.READY_WAIT) return;

        exitTriggeredRef.current = true;
        setExitSource(source);
        setPhase(SPLASH_PHASE.EXITING);

        setManagedTimeout(() => {
            onExitComplete?.();
        }, reduceMotion ? 0 : EXIT_DURATION_MS);
    }, [ready, phase, mergedSettings.openingSequence, onExitComplete, setManagedTimeout, reduceMotion]);

    useEffect(() => {
        if (mergedSettings.openingSequence !== 'skip-automatically') return;
        if (!ready) return;
        triggerExit('auto');
    }, [mergedSettings.openingSequence, ready, triggerExit]);

    const skipArmed =
        phase === SPLASH_PHASE.READY_WAIT &&
        ready &&
        mergedSettings.openingSequence !== 'always-play';

    useEffect(() => {
        if (!skipArmed) return;
        const timer = setTimeout(() => triggerExit('auto'), AUTO_EXIT_DELAY_MS);
        timersRef.current.push(timer);
        return () => clearTimeout(timer);
    }, [skipArmed, triggerExit]);

    useEffect(() => {
        if (!skipArmed) {
            setShowHint(false);
            return;
        }
        if (HINT_DELAY_MS === 0) {
            setShowHint(true);
            return;
        }
        const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
        timersRef.current.push(timer);
        return () => clearTimeout(timer);
    }, [skipArmed]);

    const gestureHandlers = useSplashSkipGesture({
        enabled: skipArmed,
        allowHold: mergedSettings.allowHoldToSkip,
        allowDoubleTap: mergedSettings.allowDoubleTapToSkip,
        onSkip: triggerExit,
    });

    // Plain tap anywhere — the gesture users actually have. Gated by the
    // same arm condition, so it can never race the sequence.
    const handleSurfaceClick = useCallback((event) => {
        if (!mergedSettings.allowTapToSkip) return;
        if (!skipArmed) return;
        const source = event.target?.closest?.('.splash-video') ? 'video' : 'screen';
        triggerExit(source);
    }, [mergedSettings.allowTapToSkip, skipArmed, triggerExit]);

    const isExiting = phase === SPLASH_PHASE.EXITING;
    const titleVisible = phase !== SPLASH_PHASE.INTRO && phase !== SPLASH_PHASE.HEART_FORMING;

    const exitDuration = reduceMotion ? 0 : EXIT_DURATION_MS / 1000;

    return (
        <motion.div
            className="splash"
            style={styleVars}
            role="presentation"
            initial={{ opacity: 1 }}
            /* Exit is a single gesture now: the scene recedes and fades,
               handing the frame to the app underneath. No white flash,
               no counter-scaling content, no bloom overlay. */
            animate={isExiting ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
            transition={{ duration: exitDuration, ease: SPLASH_EASE }}
            onClick={handleSurfaceClick}
            {...gestureHandlers}
        >
            <SplashParticles
                weather={occasion.weather}
                accelerate={isExiting}
                profile={sceneProfile}
            />

            <div className="splash__content">
                {/* Cinematic hero: plays once, freezes on its last frame
                    if the backend isn't ready yet, and reports natural
                    completion the same way the typewriter used to. The
                    frame around it breathes gently on the shared clock —
                    the one piece of ambient "life" the old heart gave
                    the scene, now given to the video instead. */}
                <div className="splash-video-frame">
                    <SplashVideo
                        src={videoSrc}
                        startDelay={t(typewriterStartMs)}
                        reduceMotion={reduceMotion}
                        onComplete={handleVideoComplete}
                    />
                </div>

                {/* Hairline — heart — hairline, then the line of feeling.
                    One unit, one transform, faded/lifted in together so
                    nothing tears apart mid-entrance. */}
                <motion.div
                    className="splash__subtitle-slot"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                    animate={titleVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : 8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.6, ease: SPLASH_EASE }}
                >
                    <div className="splash__divider" aria-hidden="true">
                        <span className="splash__divider-rule" />
                        <HeartGlyph className="splash__divider-mark" />
                        <span className="splash__divider-rule" />
                    </div>
                    <p className="splash__tagline">{tagline}</p>
                </motion.div>

                <SplashLoader statusMessage={statusMessage} />
            </div>

            {/* A real control: 44pt, focusable, labelled, and only
                present when pressing it will actually do something. */}
            <button
                type="button"
                className="splash__enter"
                hidden={!showHint || isExiting}
                style={{ opacity: showHint && !isExiting ? 1 : 0 }}
                onClick={(event) => {
                    event.stopPropagation();
                    triggerExit('screen');
                }}
            >
                <HeartGlyph className="splash__enter-mark" />
                <span className="splash__enter-label">Step Inside</span>
            </button>
        </motion.div>
    );
}