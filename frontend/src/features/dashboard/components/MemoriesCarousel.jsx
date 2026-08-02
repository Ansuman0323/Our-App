import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '../../../components/ui';

// Small fixed set of alternating tilt angles so consecutive polaroids
// never lean the same way — deterministic (keyed off index, not
// Math.random) so this doesn't re-shuffle on every re-render.
const TILTS = [-3, 2, -2, 3, -1.5, 2.5];

const cardMotion = {
    hidden: { opacity: 0, x: 24, rotate: 0 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        rotate: TILTS[i % TILTS.length],
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
    }),
};

/**
 * MemoriesCarousel — the memory-first, scrapbook-page moment of the
 * dashboard: horizontally scrolling polaroids with a slight tilt, a
 * tape accent, and a handwritten-style date. No memory data model
 * exists yet, so this stays presentational: pass `memories` (array of
 * { id, image, caption, date }) when it's available; until then it
 * renders one warm, honest empty state instead of fabricated photos.
 */
export const MemoriesCarousel = ({ memories }) => {
    const prefersReducedMotion = useReducedMotion();
    const items = memories && memories.length > 0 ? memories : null;

    return (
        <div className="memories-carousel">
            <SectionHeader title="Captured Moments" className="memories-carousel__header" />

            {items ? (
                <div className="memories-carousel__track">
                    {items.map((m, i) => (
                        <motion.figure
                            key={m.id}
                            className="polaroid"
                            custom={i}
                            variants={cardMotion}
                            initial={prefersReducedMotion ? undefined : 'hidden'}
                            whileInView={prefersReducedMotion ? undefined : 'visible'}
                            viewport={{ once: true, margin: '-20px' }}
                            style={prefersReducedMotion ? { rotate: TILTS[i % TILTS.length] } : undefined}
                        >
                            <span className="polaroid__tape" aria-hidden="true" />
                            <span className="polaroid__photo">
                                <img src={m.image} alt="" loading="lazy" />
                            </span>
                            <figcaption className="polaroid__caption">
                                {m.caption}
                                {m.date && <span className="polaroid__date">{m.date}</span>}
                            </figcaption>
                        </motion.figure>
                    ))}
                </div>
            ) : (
                <div className="memories-carousel__empty">
                    <span className="polaroid polaroid--empty" aria-hidden="true">
                        <span className="polaroid__tape" />
                        <span className="polaroid__photo polaroid__photo--empty">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                                <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                        </span>
                    </span>
                    <p className="memories-carousel__empty-text">
                        Our next memory is waiting to be created.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MemoriesCarousel;