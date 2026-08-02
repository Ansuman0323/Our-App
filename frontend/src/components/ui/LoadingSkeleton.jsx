import React from 'react';

/** ShimmerPlaceholder — a single shimmering block. Compose these to
 * build any skeleton shape (lines, avatars, cards). */
export const ShimmerPlaceholder = ({ width = '100%', height = 16, radius, className = '' }) => (
    <span
        className={`loading-skeleton ${className}`.trim()}
        style={{ display: 'block', width, height, borderRadius: radius }}
        aria-hidden="true"
    />
);

/** LoadingSkeleton — a ready-made dashboard-shaped skeleton: a hero
 * block plus a grid of tiles, matching the real layout so there's no
 * layout shift once data arrives. */
export const LoadingSkeleton = ({ tiles = 6 }) => (
    <div className="dashboard-page" role="status" aria-label="Loading">
        <div className="glass-surface glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ShimmerPlaceholder width="40%" height={14} radius={8} />
            <ShimmerPlaceholder width="65%" height={30} radius={8} />
            <ShimmerPlaceholder width="80%" height={16} radius={8} />
        </div>
        <div className="widget-grid">
            {Array.from({ length: tiles }, (_, i) => (
                <div key={i} className="glass-surface glass-card" style={{ height: 120, display: 'flex', flexDirection: 'column', gap: 10, gridColumn: i === 0 ? '1 / -1' : undefined }}>
                    <ShimmerPlaceholder width={44} height={44} radius={16} />
                    <ShimmerPlaceholder width="70%" height={12} radius={6} />
                    <ShimmerPlaceholder width="50%" height={12} radius={6} />
                </div>
            ))}
        </div>
    </div>
);

export default LoadingSkeleton;