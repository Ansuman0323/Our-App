import { motion } from 'framer-motion';

export default function SplashHeart() {
    return (
        <div className="splash-heart">
            <motion.div
                className="splash-heart__bloom"
                animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.18, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.svg
                className="splash-heart__icon"
                viewBox="0 0 32 29"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                    scale: [0.5, 1, 0.94, 1, 0.94, 1],
                    opacity: 1,
                }}
                transition={{
                    opacity: { duration: 0.6 },
                    scale: {
                        duration: 1.6,
                        times: [0, 0.22, 0.38, 0.55, 0.75, 1],
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        ease: 'easeInOut',
                        delay: 0.15,
                    },
                }}
            >
                <path
                    d="M16 28.5C16 28.5 1 19.2 1 8.9C1 3.9 4.9 1 9 1C12.1 1 14.6 2.9 16 5.4C17.4 2.9 19.9 1 23 1C27.1 1 31 3.9 31 8.9C31 19.2 16 28.5 16 28.5Z"
                    fill="url(#splashHeartGradient)"
                />
                <defs>
                    <linearGradient
                        id="splashHeartGradient"
                        x1="1" y1="1" x2="31" y2="28.5"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="var(--splash-heart-from)" />
                        <stop offset="1" stopColor="var(--splash-heart-to)" />
                    </linearGradient>
                </defs>
            </motion.svg>
        </div>
    );
}