import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Rotates by day-of-year, same pattern as DashboardHeader's tagline, so
// it's stable for a session but varies day to day — no timers/hooks
// beyond what already exists elsewhere in this codebase.
const FALLBACK_QUOTES = [
    'Every day with you writes another page.',
    'Home isn\u2019t a place. It\u2019s a person.',
    'Little moments, held onto forever.',
    'Some stories are worth reading twice.',
    'Still my favorite hello, every time.',
];

const getFallbackQuote = () => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - start;
    const dayOfYear = Math.floor(diff / 86400000);
    return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
};

/**
 * FloatingQuote — an emotional anchor between sections, set directly on
 * the page background rather than inside a glass card. Purely
 * presentational: pass `quote` when real shared-quote data exists,
 * otherwise it falls back to a rotating line of its own.
 */
export const FloatingQuote = ({ quote }) => {
    const prefersReducedMotion = useReducedMotion();
    const text = quote || getFallbackQuote();

    return (
        <motion.figure
            className="floating-quote"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <span className="floating-quote__mark" aria-hidden="true">&ldquo;</span>
            <blockquote className="floating-quote__text">{text}</blockquote>
            <span className="floating-quote__ornament" aria-hidden="true" />
        </motion.figure>
    );
};

export default FloatingQuote;