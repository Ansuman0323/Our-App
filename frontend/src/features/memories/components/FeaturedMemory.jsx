import React from 'react';
import { motion } from 'framer-motion';
import { GlassBadge } from '../../../components/ui';

/**
 * FeaturedMemory — the scrapbook's cover page. A full-bleed photo,
 * a handwritten-style date, and a caption line — the "open the book"
 * moment before the rest of the page unfolds.
 */
export const FeaturedMemory = ({ memory }) => (
    <motion.figure
        className="featured-memory"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
        <img className="featured-memory__photo" src={memory.image} alt={memory.title} />
        <span className="featured-memory__scrim" aria-hidden="true" />
        <span className="featured-memory__petal featured-memory__petal--one" aria-hidden="true">🌸</span>
        <span className="featured-memory__petal featured-memory__petal--two" aria-hidden="true">🌸</span>
        <figcaption className="featured-memory__caption">
            <GlassBadge dot>Featured Memory</GlassBadge>
            <h2 className="featured-memory__title">{memory.title}</h2>
            <p className="featured-memory__text">{memory.caption}</p>
            <span className="featured-memory__date">{memory.date}</span>
        </figcaption>
    </motion.figure>
);

export default FeaturedMemory;
