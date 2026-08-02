import React from 'react';

/** SectionHeader — title + optional trailing action, used above every
 * card group (Quick actions, Today, Recent memories, ...). */
export const SectionHeader = ({ title, action, className = '' }) => (
    <div className={`section-header ${className}`.trim()}>
        <h3 className="section-header__title">{title}</h3>
        {action && <span className="section-header__action">{action}</span>}
    </div>
);

export default SectionHeader;