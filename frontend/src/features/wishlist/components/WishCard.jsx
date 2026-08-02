import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HeartIcon = ({ filled }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 21s-6.7-4.35-9.33-8.6C1.02 9.7 1.9 6.2 4.9 5.02 7 4.2 9.2 5 10.5 6.75L12 8.6l1.5-1.85C14.8 5 17 4.2 19.1 5.02c3 1.18 3.88 4.68 2.23 7.38C18.7 16.65 12 21 12 21z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * WishCard — a single dream-board entry. Bookmark ribbon marks it as
 * saved, the heart toggles locally (UI-only, no persistence), and a
 * soft progress bar stands in for "how close we are" to this wish.
 */
export const WishCard = ({ wish, index = 0 }) => {
    const [saved, setSaved] = useState(wish.saved);
    const [justSaved, setJustSaved] = useState(false);

    const toggleSaved = () => {
        setSaved((v) => !v);
        if (!saved) {
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 600);
        }
    };

    return (
        <motion.figure
            className="wish-card"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
        >
            {saved && <span className="wish-card__ribbon" aria-hidden="true" />}

            <div className="wish-card__frame">
                <img className="wish-card__photo" src={wish.image} alt={wish.title} loading="lazy" />
                <span className="wish-card__scrim" aria-hidden="true" />

                <button
                    type="button"
                    className={`wish-card__heart${saved ? ' wish-card__heart--active' : ''}`}
                    onClick={toggleSaved}
                    aria-pressed={saved}
                    aria-label={saved ? `Remove ${wish.title} from saved` : `Save ${wish.title}`}
                >
                    <HeartIcon filled={saved} />
                    <AnimatePresence>
                        {justSaved && (
                            <motion.span
                                className="wish-card__heart-burst"
                                initial={{ opacity: 0.9, scale: 0.6 }}
                                animate={{ opacity: 0, scale: 1.8 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                                aria-hidden="true"
                            />
                        )}
                    </AnimatePresence>
                </button>

                <figcaption className="wish-card__caption">
                    <span className="wish-card__title">{wish.title}</span>
                    <span className="wish-card__note">{wish.note}</span>
                </figcaption>
            </div>

            <div className="wish-card__progress-track" aria-hidden="true">
                <motion.div
                    className="wish-card__progress-fill"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${wish.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                />
            </div>
            <span className="wish-card__progress-label">
                {wish.progress >= 100 ? 'Wish fulfilled' : `${wish.progress}% of the way there`}
            </span>
        </motion.figure>
    );
};

export default WishCard;
