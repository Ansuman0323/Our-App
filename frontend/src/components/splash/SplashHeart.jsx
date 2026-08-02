import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SPLASH_EASE, SPLASH_CLOCK_S } from './motionConstants';

// Two ambient sparkles stays restrained; the burst is the reward for
// the heart tap. Nothing else orbits.
const SPARKLE_COUNT = 2;
const FLOURISH_SPARKLE_COUNT = 3;

const CLOCK_S = SPLASH_CLOCK_S;

function generateSparkles(count) {
    return Array.from({ length: count }, (_, id) => {
        const angle = (id / count) * Math.PI * 2;
        return {
            id,
            angle,
            radius: 46 + Math.random() * 10,
            size: 2 + Math.random() * 1.5,
            // Phase-locked to the clock rather than randomly offset.
            delay: (id / count) * CLOCK_S,
            duration: CLOCK_S,
        };
    });
}

export default function SplashHeart({ charged = false, flourish = false }) {
    const reduceMotion = useReducedMotion();
    const sparkles = useMemo(() => generateSparkles(SPARKLE_COUNT), []);
    const burstSparkles = useMemo(() => generateSparkles(FLOURISH_SPARKLE_COUNT), []);

    return (
        <div className={`splash-heart${charged ? ' splash-heart--charged' : ''}`}>
            {/* Bloom breathes on the shared clock. Scale + opacity only —
                the blur is a static CSS value and is never animated. */}
            <motion.div
                className="splash-heart__bloom"
                animate={
                    reduceMotion
                        ? { opacity: 0.26, scale: 1 }
                        : charged
                            ? { opacity: 0.44, scale: 1.08 }
                            : { opacity: [0.18, 0.3, 0.18], scale: [1, 1.05, 1] }
                }
                transition={
                    reduceMotion
                        ? { duration: 0 }
                        : charged
                            ? { duration: 0.32, ease: SPLASH_EASE }
                            : { duration: CLOCK_S, repeat: Infinity, ease: SPLASH_EASE }
                }
            />

            {!reduceMotion && sparkles.map((s) => {
                const x = Math.cos(s.angle) * s.radius;
                const y = Math.sin(s.angle) * s.radius;
                return (
                    <motion.span
                        key={s.id}
                        className="splash-heart__sparkle"
                        style={{ width: s.size, height: s.size, left: '50%', top: '50%' }}
                        animate={{
                            x: [0, x, x * 1.12],
                            y: [0, y, y * 1.12],
                            opacity: [0, 0.55, 0],
                            scale: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: s.duration,
                            delay: s.delay,
                            repeat: Infinity,
                            ease: SPLASH_EASE,
                        }}
                    />
                );
            })}

            {flourish && !reduceMotion &&
                burstSparkles.map((s) => {
                    const x = Math.cos(s.angle) * s.radius * 2.2;
                    const y = Math.sin(s.angle) * s.radius * 2.2;
                    return (
                        <motion.span
                            key={`burst-${s.id}`}
                            className="splash-heart__sparkle splash-heart__sparkle--burst"
                            style={{ width: s.size, height: s.size, left: '50%', top: '50%' }}
                            initial={{ x: 0, y: 0, opacity: 0.7, scale: 1 }}
                            animate={{ x, y, opacity: 0, scale: 0.3 }}
                            transition={{ duration: 0.4, ease: SPLASH_EASE }}
                        />
                    );
                })}

            {/* The existing mark, unchanged in geometry. Single hue via
                currentColor so occasion theming tints it with one token;
                the glow is a static CSS drop-shadow on the element. */}
            <motion.svg
                className="splash-heart__icon"
                viewBox="0 0 64 58"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                initial={{ scale: reduceMotion ? 1 : 0.9, opacity: reduceMotion ? 1 : 0 }}
                animate={
                    reduceMotion
                        ? { scale: 1, opacity: 1 }
                        : charged
                            ? { scale: flourish ? [1, 1.2, 1.08] : 1.08, opacity: 1 }
                            : { scale: [1, 1.03, 1], opacity: 1 }
                }
                transition={
                    reduceMotion
                        ? { duration: 0 }
                        : charged
                            ? { duration: 0.32, ease: SPLASH_EASE }
                            : {
                                opacity: { duration: 0.9, ease: SPLASH_EASE },
                                // One slow beat per clock cycle, locked to
                                // the CSS echo ring so they read as one.
                                scale: {
                                    duration: CLOCK_S,
                                    repeat: Infinity,
                                    ease: SPLASH_EASE,
                                },
                            }
                }
            >
                <path
                    d="M32 57C32 57 2 38.2 2 17.9C2 7.9 9.7 2 18 2C24.2 2 29.2 5.7 32 10.7C34.8 5.7 39.8 2 46 2C54.3 2 62 7.9 62 17.9C62 38.2 32 57 32 57Z"
                    fill="currentColor"
                />
            </motion.svg>
        </div>
    );
}
