import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SplashHeart from './SplashHeart';
import SplashParticles from './SplashParticles';
import SplashLoader from './SplashLoader';
import './SplashScreen.css';

const EXIT_DURATION = 0.7;
const TITLE = 'Together';

export default function SplashScreen({ ready, statusMessage, onExitComplete }) {
    const [exiting, setExiting] = useState(false);

    // Phase 5: once the backend responds, fade + scale the whole
    // splash away instead of hard-cutting to the app.
    useEffect(() => {
        if (!ready) return;
        setExiting(true);
        const timer = setTimeout(() => onExitComplete?.(), EXIT_DURATION * 1000);
        return () => clearTimeout(timer);
    }, [ready, onExitComplete]);

    return (
        <motion.div
            className="splash"
            initial={{ opacity: 1 }}
            animate={exiting ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
            transition={{ duration: EXIT_DURATION, ease: [0.4, 0, 0.2, 1] }}
        >
            {/* Phase 3: ambient background — particles + glass blur */}
            <SplashParticles />
            <div className="splash__glass" />

            <div className="splash__content">
                {/* Phase 1: glowing heart, heartbeat + bloom */}
                <SplashHeart />

                {/* Phase 2: "Together" fades in letter by letter */}
                <motion.h1 className="splash__title" aria-label={TITLE}>
                    {TITLE.split('').map((char, i) => (
                        <motion.span
                            key={i}
                            className="splash__letter"
                            aria-hidden="true"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.6 + i * 0.045,
                                duration: 0.55,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.h1>

                {/* Phase 4: cold-start status copy, driven by useBackendHealth */}
                <SplashLoader statusMessage={statusMessage} />
            </div>
        </motion.div>
    );
}