import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SPLASH_EASE } from './motionConstants';

// Fallback only, matching the desktop profile — normal operation
// reads star/firefly/accent counts from profile.particles.
const DEFAULT_PARTICLE_COUNTS = { starCount: 18, fireflyCount: 4, petalCount: 3 };
const ACCELERATE_FACTOR = 0.3; // shortens transitions during exit, doesn't change layout

function rand(min, max) {
    return min + Math.random() * (max - min);
}

// Ambient layers shared by every weather: a soft starfield and a
// handful of fireflies.
function generateAmbient({ starCount, fireflyCount }) {
    const stars = Array.from({ length: starCount }, (_, id) => ({
        id,
        left: rand(0, 100),
        top: rand(0, 70),
        size: rand(1, 2.5),
        duration: rand(2.5, 5),
        delay: rand(0, 4),
    }));

    const fireflies = Array.from({ length: fireflyCount }, (_, id) => ({
        id,
        left: rand(5, 95),
        top: rand(20, 85),
        size: rand(2, 3.5),
        duration: rand(10, 16),
        delay: rand(0, 6),
        drift: rand(14, 28),
    }));

    return { stars, fireflies };
}

// The "weather" layer is the one accent that actually changes look
// depending on the occasion (see splashOccasion.js): falling petals,
// falling snow, or the odd shooting star.
function generatePetals(count) {
    return Array.from({ length: count }, (_, id) => ({
        id,
        left: rand(0, 100),
        size: rand(6, 11),
        duration: rand(14, 22),
        delay: rand(0, 10),
        rotate: rand(-40, 40),
    }));
}

function generateSnow(count) {
    return Array.from({ length: count }, (_, id) => ({
        id,
        left: rand(0, 100),
        size: rand(3, 6),
        duration: rand(9, 16),
        delay: rand(0, 10),
        drift: rand(-18, 18),
    }));
}

function generateShootingStars(count) {
    return Array.from({ length: count }, (_, id) => ({
        id,
        top: rand(5, 45),
        left: rand(10, 90),
        duration: rand(3, 5.5),
        delay: rand(0, 12),
        travel: rand(140, 220),
    }));
}

export default function SplashParticles({ weather = 'petals', accelerate = false, profile }) {
    const counts = profile?.particles ?? DEFAULT_PARTICLE_COUNTS;
    const { starCount, fireflyCount, petalCount } = counts;

    const { stars, fireflies } = useMemo(
        () => generateAmbient({ starCount, fireflyCount }),
        [starCount, fireflyCount]
    );

    const accentItems = useMemo(() => {
        if (weather === 'snow') return generateSnow(petalCount);
        if (weather === 'stars') return generateShootingStars(petalCount);
        return generatePetals(petalCount);
    }, [weather, petalCount]);

    const scaleDuration = (d) => (accelerate ? d * ACCELERATE_FACTOR : d);

    return (
        <div className="splash-particles" aria-hidden="true">
            {stars.map((s) => (
                <motion.span
                    key={`star-${s.id}`}
                    className="splash-particles__star"
                    style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
                    animate={{ opacity: [0.15, 0.9, 0.15] }}
                    transition={{ duration: scaleDuration(s.duration), delay: accelerate ? 0 : s.delay, repeat: Infinity, ease: SPLASH_EASE }}
                />
            ))}

            {fireflies.map((f) => (
                <motion.span
                    key={`firefly-${f.id}`}
                    className="splash-particles__firefly"
                    style={{ left: `${f.left}%`, top: `${f.top}%`, width: f.size, height: f.size }}
                    animate={{
                        x: [0, f.drift, -f.drift * 0.6, 0],
                        y: [0, -f.drift * 0.5, f.drift * 0.3, 0],
                        opacity: [0.2, 0.9, 0.4, 0.2],
                    }}
                    transition={{ duration: scaleDuration(f.duration), delay: accelerate ? 0 : f.delay, repeat: Infinity, ease: SPLASH_EASE }}
                />
            ))}

            {weather === 'snow' &&
                accentItems.map((s) => (
                    <motion.span
                        key={`snow-${s.id}`}
                        className="splash-particles__snow"
                        style={{ left: `${s.left}%`, top: '-5%', width: s.size, height: s.size }}
                        animate={{
                            y: ['0vh', '110vh'],
                            x: [0, s.drift, -s.drift * 0.5, s.drift * 0.3],
                            opacity: [0, 0.85, 0.85, 0],
                        }}
                        transition={{ duration: scaleDuration(s.duration), delay: accelerate ? 0 : s.delay, repeat: Infinity, ease: 'linear' }}
                    />
                ))}

            {weather === 'stars' &&
                accentItems.map((s) => (
                    <motion.span
                        key={`shooting-${s.id}`}
                        className="splash-particles__shooting-star"
                        style={{ left: `${s.left}%`, top: `${s.top}%` }}
                        animate={{
                            x: [0, s.travel],
                            y: [0, s.travel * 0.55],
                            opacity: [0, 1, 0],
                        }}
                        transition={{ duration: scaleDuration(s.duration), delay: accelerate ? 0 : s.delay, repeat: Infinity, ease: SPLASH_EASE }}
                    />
                ))}

            {weather !== 'snow' &&
                weather !== 'stars' &&
                accentItems.map((p) => (
                    <motion.span
                        key={`petal-${p.id}`}
                        className="splash-particles__petal"
                        style={{ left: `${p.left}%`, top: '-5%', width: p.size, height: p.size * 0.8 }}
                        animate={{
                            y: ['0vh', '110vh'],
                            x: [0, 30, -20, 10],
                            rotate: [0, p.rotate, p.rotate * 1.5],
                            opacity: [0, 0.7, 0.7, 0],
                        }}
                        transition={{ duration: scaleDuration(p.duration), delay: accelerate ? 0 : p.delay, repeat: Infinity, ease: 'linear' }}
                    />
                ))}
        </div>
    );
}