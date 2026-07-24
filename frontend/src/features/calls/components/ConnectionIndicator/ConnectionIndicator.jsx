import React from 'react';

const QUALITY_CONFIG = {
    excellent: { label: 'Excellent', className: 'ci-excellent' },
    good: { label: 'Good', className: 'ci-good' },
    fair: { label: 'Fair', className: 'ci-fair' },
    poor: { label: 'Poor', className: 'ci-poor' },
    disconnected: { label: 'Disconnected', className: 'ci-disconnected' },
};

/**
 * Pure presentational component. Consumes `connectionQuality` and
 * renders a subtle color-coded pill. Does not measure or poll anything.
 */
function ConnectionIndicator({ quality }) {
    const config = QUALITY_CONFIG[quality] || QUALITY_CONFIG.disconnected;

    return (
        <span
            className={`ci-indicator ${config.className}`}
            role="status"
            aria-label={`Connection quality: ${config.label}`}
        >
            <span className="ci-dot" aria-hidden="true" />
            <span className="ci-label">{config.label}</span>
        </span>
    );
}

export default React.memo(ConnectionIndicator);