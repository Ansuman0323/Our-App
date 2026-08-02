import React from 'react';

/** EmptyState — a warm invitation rather than a bare "no data" line.
 * icon accepts an emoji or any node. */
export const EmptyState = ({ icon = '✨', title, subtitle, className = '' }) => (
    <div className={`empty-state ${className}`.trim()}>
        <span className="empty-state__icon" aria-hidden="true">{icon}</span>
        {title && <p className="empty-state__title">{title}</p>}
        {subtitle && <p className="empty-state__subtitle">{subtitle}</p>}
    </div>
);

export default EmptyState;