// motionConstants.js
// Single shared easing curve for every animated layer of the splash —
// Framer Motion transitions and CSS transitions alike — so the whole
// screen reads as one choreography instead of independently-tuned
// parts. This is Apple's own standard easing curve, and several
// components already used it ad hoc; this just makes that consistent
// and intentional everywhere.
export const SPLASH_EASE = [0.4, 0, 0.2, 1];