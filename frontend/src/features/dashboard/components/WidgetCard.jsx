import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Each variant styles both the icon chip and the card's own background
// wash, so colour carries across the whole tile the way it does in the
// reference — while staying within the app's pastel "-soft" glass
// tokens (all rgba-based) rather than mixing with white/black, which
// keeps every chip legible against the dark glass surface.
const VARIANT_STYLES = {
    neutral: {
        iconBg: 'var(--accent-soft)',
        iconColor: 'var(--color-primary)',
        cardBg: 'linear-gradient(165deg, var(--surface-glass), var(--surface-card))',
    },
    indigo: {
        iconBg: 'var(--color-primary-soft)',
        iconColor: 'var(--color-primary)',
        cardBg: 'linear-gradient(165deg, var(--color-primary-soft), var(--surface-card))',
    },
    lavender: {
        iconBg: 'var(--color-secondary-soft)',
        iconColor: 'var(--color-secondary)',
        cardBg: 'linear-gradient(165deg, var(--color-secondary-soft), var(--surface-card))',
    },
    rose: {
        iconBg: 'var(--color-pink-soft)',
        iconColor: 'var(--color-accent)',
        cardBg: 'linear-gradient(165deg, var(--color-pink-soft), var(--surface-card))',
    },
    emerald: {
        iconBg: 'var(--color-success-soft)',
        iconColor: 'var(--color-success)',
        cardBg: 'linear-gradient(165deg, var(--color-success-soft), var(--surface-card))',
    },
    pink: {
        iconBg: 'var(--color-pink-soft)',
        iconColor: 'var(--color-pink)',
        cardBg: 'linear-gradient(165deg, var(--color-pink-soft), var(--surface-card))',
    },
    mint: {
        iconBg: 'var(--color-mint-soft)',
        iconColor: 'var(--color-mint)',
        cardBg: 'linear-gradient(165deg, var(--color-mint-soft), var(--surface-card))',
    },
    peach: {
        iconBg: 'var(--color-peach-soft)',
        iconColor: 'var(--color-peach)',
        cardBg: 'linear-gradient(165deg, var(--color-peach-soft), var(--surface-card))',
    },
    blue: {
        iconBg: 'var(--color-blue-soft)',
        iconColor: 'var(--color-blue)',
        cardBg: 'linear-gradient(165deg, var(--color-blue-soft), var(--surface-card))',
    },
    // Reserved for the single featured/hero tile — a solid warm wash
    // rather than a white-to-tint gradient, since it carries on-color text.
    gradient: {
        iconBg: 'rgba(255, 255, 255, 0.22)',
        iconColor: 'var(--color-on-color)',
        cardBg: 'var(--gradient-sunset)',
    },
};

// Variants are shared across the card and its children below. Because
// the children are motion components with `variants` but no explicit
// initial/animate/whileTap of their own, they automatically inherit
// whichever state the card is in ("hidden" → "visible" → "pressed"),
// so one tap drives the squish, the icon pop, the chevron nudge and
// the glow pulse together instead of only the card's own shadow.
const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
    }),
    pressed: {
        scale: 0.95,
        y: 1,
        transition: { type: 'spring', stiffness: 500, damping: 22, mass: 0.6 },
    },
};

// Icon idles with a slow, staggered float once settled ("visible"),
// separate from the tap-press pop below. `custom` carries both the
// stagger index and the reduced-motion flag so this can stay a plain
// module-level object instead of being rebuilt on every render.
const iconVariants = {
    hidden: { scale: 1, rotate: 0, y: 0 },
    visible: ({ index, reducedMotion }) => ({
        scale: 1,
        rotate: 0,
        y: reducedMotion ? 0 : [0, -3, 0],
        transition: reducedMotion
            ? { duration: 0 }
            : {
                y: {
                    duration: 3 + (index % 3) * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.15,
                },
            },
    }),
    pressed: {
        scale: 1.16,
        rotate: -8,
        y: 0,
        transition: { type: 'spring', stiffness: 600, damping: 13 },
    },
};

const chevronVariants = {
    hidden: { x: 0 },
    visible: { x: 0 },
    pressed: { x: 4, transition: { type: 'spring', stiffness: 500, damping: 18 } },
};

const glowVariants = {
    hidden: { opacity: 0, scale: 0.4 },
    visible: { opacity: 0, scale: 0.4 },
    pressed: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

export const WidgetCard = ({ title, icon, image, children, footer, variant = 'neutral', index = 0, layout = 'default' }) => {
    const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
    const isHero = layout === 'hero';
    // 'wide' = the memory-first, full-width photo tile (polaroid framing
    // when an image exists, a graceful "waiting for a photo" wash when
    // it doesn't). 'quote' = a full-width tile styled like the header's
    // quote strip instead of a normal card, for anything message-like.
    const isWide = layout === 'wide';
    const isQuote = layout === 'quote';
    const reducedMotion = useReducedMotion();

    const layoutClass = isHero
        ? ' widget-card--hero'
        : isWide
            ? ' widget-card--wide'
            : isQuote
                ? ' widget-card--quote'
                : '';

    return (
        <motion.button
            type="button"
            className={`widget-card${layoutClass}`}
            style={isQuote || isWide ? undefined : { background: styles.cardBg }}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap="pressed"
        >
            {/* Tinted glow that flashes in on press, in the icon's own
                color — gives the tap a bit of color/light instead of
                just a shadow moving. */}
            <motion.span
                className="widget-card__glow"
                variants={glowVariants}
                style={{ background: `radial-gradient(circle, ${styles.iconColor} 0%, transparent 72%)` }}
                aria-hidden="true"
            />

            {isWide ? (
                <span className={`widget-card__frame${image ? '' : ' widget-card__frame--empty'}`}>
                    {image ? (
                        <img className="widget-card__photo" src={image} alt="" loading="lazy" />
                    ) : (
                        <span className="widget-card__frame-glyph" aria-hidden="true">{icon}</span>
                    )}
                    <span className="widget-card__frame-caption">
                        <span className="widget-card__title">{title}</span>
                        <span className="widget-card__content">{children}</span>
                    </span>
                </span>
            ) : (
                <>
                    <motion.span
                        className={`widget-card__icon${image ? ' widget-card__icon--photo' : ''}`}
                        custom={{ index, reducedMotion }}
                        variants={iconVariants}
                        style={image ? undefined : { background: styles.iconBg, color: styles.iconColor }}
                        aria-hidden="true"
                    >
                        {image ? <img src={image} alt="" loading="lazy" /> : icon}
                    </motion.span>
                    <span className="widget-card__body">
                        {isQuote && (
                            <span className="widget-card__quote-mark" aria-hidden="true">&ldquo;</span>
                        )}
                        <span className="widget-card__title">{title}</span>
                        <span className="widget-card__content">{children}</span>
                        {footer && <span className="widget-card__footer">{footer}</span>}
                    </span>
                </>
            )}

            {!isWide && (
                <motion.span className="widget-card__chevron" variants={chevronVariants} aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.span>
            )}
        </motion.button>
    );
};