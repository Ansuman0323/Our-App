import React from 'react';

/**
 * PremiumAvatar — the reserved profile/couple-photo slot used in
 * headers (DashboardHeader, ChatHeader, etc). Renders as a soft
 * gradient glass disc with a small decorative heart glyph — never
 * initials or invented imagery, so a future photo can drop in without
 * any layout rework. `size` controls both the disc and the glyph
 * scale proportionally.
 */
export const PremiumAvatar = ({ size = 44, className = '' }) => (
    <span
        className={`premium-avatar ${className}`.trim()}
        style={{ width: size, height: size }}
    >
        <svg
            width={size * 0.42}
            height={size * 0.42}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M12 21s-6.7-4.35-9.33-8.6C1.02 9.7 1.9 6.2 4.9 5.02 7 4.2 9.2 5 10.5 6.75L12 8.6l1.5-1.85C14.8 5 17 4.2 19.1 5.02c3 1.18 3.88 4.68 2.23 7.38C18.7 16.65 12 21 12 21z"
                fill="currentColor"
            />
        </svg>
    </span>
);

export default PremiumAvatar;