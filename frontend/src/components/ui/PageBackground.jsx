import React, { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * AmbientGlow — three slow-breathing radial glows behind the glass
 * surfaces. Pure CSS animation (see design-system.css) so it never
 * touches the JS thread on a WebView.
 */
export const AmbientGlow = () => (
    <>
        <span className="ambient-glow ambient-glow--one" aria-hidden="true" />
        <span className="ambient-glow ambient-glow--two" aria-hidden="true" />
        <span className="ambient-glow ambient-glow--three" aria-hidden="true" />
        {/* A fourth, quieter bloom near center — gives the backdrop a
            sense of depth (near/far light) instead of three glows all
            reading as the same distance from the viewer. */}
        <span className="ambient-glow ambient-glow--four" aria-hidden="true" />
    </>
);

/**
 * FloatingParticles — a small, fixed set of drifting dots. Count is
 * deliberately low and positions/timings are randomized once via
 * useMemo (not per-render) to stay cheap on a mobile WebView.
 */
export const FloatingParticles = ({ count = 14 }) => {
    const prefersReducedMotion = useReducedMotion();

    const dots = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                id: i,
                left: Math.round(Math.random() * 100),
                size: 1 + Math.random() * 2,
                duration: 14 + Math.random() * 12,
                delay: Math.random() * -20,
                opacity: 0.3 + Math.random() * 0.4,
            })),
        [count]
    );

    if (prefersReducedMotion) return null;

    return (
        <div className="floating-particles" aria-hidden="true">
            {dots.map((d) => (
                <span
                    key={d.id}
                    className="floating-particles__dot"
                    style={{
                        left: `${d.left}%`,
                        width: d.size,
                        height: d.size,
                        animationDuration: `${d.duration}s`,
                        animationDelay: `${d.delay}s`,
                        opacity: d.opacity,
                    }}
                />
            ))}
        </div>
    );
};

/**
 * PageBackground — drop once near the root of a page/app-shell. Fixed
 * position, z-index 0, ignores pointer events, so page content simply
 * stacks on top of it in normal flow.
 */
export const PageBackground = ({ particles = true }) => (
    <div className="page-background">
        <AmbientGlow />
        {particles && <FloatingParticles />}
    </div>
);

export default PageBackground;