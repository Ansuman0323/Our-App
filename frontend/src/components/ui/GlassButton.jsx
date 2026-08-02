import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlassButton — pill button in either 'primary' (gradient glow) or
 * 'secondary' (glass) styling. Purely presentational; behavior stays
 * whatever the caller wires up via onClick/type.
 *
 * `loading` is optional and off by default, so every existing call
 * site is unaffected — when a caller does pass it (auth submit
 * buttons in particular), the label is swapped for a small spinner
 * and the button is disabled for the duration, instead of the button
 * just going quiet with no feedback.
 */
export const GlassButton = ({
    children,
    variant = 'secondary',
    className = '',
    type = 'button',
    loading = false,
    disabled = false,
    ...rest
}) => (
    <motion.button
        type={type}
        whileTap={loading ? undefined : { scale: 0.96 }}
        whileHover={loading ? undefined : { y: -1 }}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`glass-button glass-button--${variant}${loading ? ' glass-button--loading' : ''} ${className}`.trim()}
        {...rest}
    >
        {loading ? (
            <span className="glass-button__spinner" aria-hidden="true" />
        ) : (
            children
        )}
    </motion.button>
);

/**
 * GlassIconButton — circular glass button for icon-only actions
 * (logout, close, back, etc.).
 */
export const GlassIconButton = ({ children, className = '', label, ...rest }) => (
    <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        className={`glass-icon-button ${className}`.trim()}
        aria-label={label}
        {...rest}
    >
        {children}
    </motion.button>
);

export default GlassButton;