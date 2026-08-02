import React from 'react';

/** GlassBadge — small pill chip, optionally with a glowing status dot
 * (pass `dot`). Used for things like "Together Forever", "Live", etc. */
export const GlassBadge = ({ children, dot = false, className = '' }) => (
    <span className={`glass-badge ${className}`.trim()}>
        {dot && <span className="glass-badge__dot" aria-hidden="true" />}
        {children}
    </span>
);

export default GlassBadge;