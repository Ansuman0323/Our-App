import { AnimatePresence, motion } from 'framer-motion';
import { SPLASH_EASE } from './motionConstants';

const COPY = {
    connecting: ['Connecting securely…'],
    'cold-start': [
        'Waking the server',
        'This can take up to a minute.',
    ],
};

export default function SplashLoader({ statusMessage }) {
    // Reserve the space even with nothing to say, so the layout never
    // jumps when a message appears.
    if (!statusMessage) {
        return <div className="splash-loader splash-loader--placeholder" aria-hidden="true" />;
    }

    const lines = COPY[statusMessage] ?? [];

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={statusMessage}
                className="splash-loader"
                role="status"
                /* aria-live was firing mid-cinematic on every status
                   change. The role alone still exposes the text; we no
                   longer interrupt the user to read a transient state. */
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: SPLASH_EASE }}
            >
                {lines.map((line, i) => (
                    <p
                        key={line}
                        className={
                            i === 0
                                ? 'splash-loader__line'
                                : 'splash-loader__line splash-loader__line--muted'
                        }
                    >
                        {line}
                    </p>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}
