import { AnimatePresence, motion } from 'framer-motion';

const COPY = {
    connecting: ['Connecting securely...'],
    'cold-start': [
        'Starting server...',
        'This can take up to a minute on the free server.',
    ],
};

export default function SplashLoader({ statusMessage }) {
    // Reserve the space even with nothing to say, so the layout
    // doesn't jump when a message appears.
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
                aria-live="polite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
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