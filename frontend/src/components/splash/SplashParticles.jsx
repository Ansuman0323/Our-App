import { useMemo } from 'react';
import { motion } from 'framer-motion';

const PARTICLE_COUNT = 16;

function generateParticles() {
    return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
        id,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        duration: 9 + Math.random() * 9,
        delay: Math.random() * 6,
    }));
}

export default function SplashParticles() {
    // Computed once per mount, not on every render.
    const particles = useMemo(generateParticles, []);

    return (
        <div className="splash-particles" aria-hidden="true">
            {particles.map((p) => (
                <motion.span
                    key={p.id}
                    className="splash-particles__dot"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{ y: [0, -18, 0], opacity: [0.12, 0.55, 0.12] }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}