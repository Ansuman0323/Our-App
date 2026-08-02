import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../../../components/ui';

const TILTS = [-3, 2, -2, 3];
const HUES = ['peach', 'pink', 'lavender', 'mint'];

/**
 * StickyNoteBoard — "Weekend Ideas" as a little corkboard of sticky
 * notes instead of a plain card grid.
 */
export const StickyNoteBoard = ({ items }) => (
    <section className="sticky-board">
        <SectionHeader title="Weekend Ideas" />
        <div className="sticky-board__grid">
            {items.map((item, i) => (
                <motion.div
                    key={item.id}
                    className={`sticky-note sticky-note--${HUES[i % HUES.length]}`}
                    style={{ transform: `rotate(${TILTS[i % TILTS.length]}deg)` }}
                    initial={{ opacity: 0, y: 14, rotate: TILTS[i % TILTS.length] - 6 }}
                    whileInView={{ opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ rotate: 0, y: -3 }}
                >
                    <span className="sticky-note__icon" aria-hidden="true">{item.icon}</span>
                    <span className="sticky-note__title">{item.title}</span>
                </motion.div>
            ))}
        </div>
    </section>
);

export default StickyNoteBoard;
