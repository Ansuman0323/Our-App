import React from 'react';

/** Divider — soft gradient hairline, fades at both ends instead of a
 * hard-edged rule. */
export const Divider = ({ className = '' }) => (
    <hr className={`glass-divider ${className}`.trim()} />
);

export default Divider;