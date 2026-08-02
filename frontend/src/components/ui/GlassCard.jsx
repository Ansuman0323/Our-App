import React from 'react';
import { motion } from 'framer-motion';

// Cache of motion-wrapped custom components, keyed by the component
// reference itself, so passing `as={Link}` doesn't create a brand new
// component type (and remount) on every render.
const motionComponentCache = new WeakMap();

const resolveMotionComponent = (as) => {
    if (typeof as === 'string') {
        return motion[as] || motion.div;
    }
    if (!motionComponentCache.has(as)) {
        motionComponentCache.set(as, motion.create(as));
    }
    return motionComponentCache.get(as);
};

// One shared entrance across every glass surface in the app: fade,
// rise, slight scale. Delay is index-driven so lists cascade gently
// instead of animating in sync.
const cardMotion = {
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: (i = 0) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 },
    }),
};

/**
 * GlassCard — the base translucent, blurred panel used everywhere
 * a "card" is needed. Renders as a plain <div> by default, or a
 * <button> when `as="button"` (with `onClick`) for interactive tiles.
 */
export const GlassCard = ({
    children,
    className = '',
    tight = false,
    interactive = false,
    index = 0,
    as = 'div',
    onClick,
    ...rest
}) => {
    const Component = resolveMotionComponent(as);
    const classes = [
        'glass-surface',
        tight ? 'glass-card--tight' : 'glass-card',
        interactive ? 'glass-card--interactive' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Component
            className={classes}
            custom={index}
            variants={cardMotion}
            initial="initial"
            animate="animate"
            whileTap={interactive ? { scale: 0.97 } : undefined}
            onClick={onClick}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default GlassCard;