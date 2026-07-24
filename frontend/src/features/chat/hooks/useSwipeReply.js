import { useRef, useCallback } from 'react';

export const useSwipeReply = (onReply) => {
    const bubbleRef = useRef(null);
    const iconRef = useRef(null);

    // Use a mutable ref to track drag state to completely avoid React re-renders during 60fps dragging
    const state = useRef({
        startX: 0,
        startY: 0,
        dragX: 0,
        active: false,
        isHorizontal: null,
        thresholdCrossed: false
    });

    const THRESHOLD = 60; // Pixels required to trigger the reply
    const MAX_DRAG = 85;  // Maximum pixel distance the bubble can be pulled

    const updateDOM = (x) => {
        if (bubbleRef.current) {
            bubbleRef.current.style.transform = `translateX(${x}px)`;
        }
        if (iconRef.current) {
            const progress = Math.min(x / THRESHOLD, 1);

            // Fade and scale the curved arrow icon simultaneously
            iconRef.current.style.opacity = progress;
            iconRef.current.style.transform = `translateY(-50%) scale(${0.5 + (progress * 0.5)})`;

            const crossed = x >= THRESHOLD;
            if (crossed !== state.current.thresholdCrossed) {
                state.current.thresholdCrossed = crossed;

                // Trigger haptic feedback when crossing the threshold
                if (crossed && window.navigator?.vibrate) {
                    window.navigator.vibrate(15);
                }

                // Highlight the icon background
                if (crossed) {
                    iconRef.current.classList.add('bg-black/10');
                } else {
                    iconRef.current.classList.remove('bg-black/10');
                }
            }
        }
    };

    const handleTouchStart = useCallback((e) => {
        // Only allow single-touch gestures
        if (!e.touches || e.touches.length > 1) return;
        const touch = e.touches[0];

        state.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            active: true,
            isHorizontal: null,
            dragX: 0,
            thresholdCrossed: false
        };

        if (bubbleRef.current) {
            bubbleRef.current.style.transition = 'none'; // Disable transition for 1:1 finger tracking
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!state.current.active || !e.touches) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - state.current.startX;
        const deltaY = touch.clientY - state.current.startY;

        // Axis Locking: Determine if the user is scrolling vertically or swiping horizontally
        if (state.current.isHorizontal === null) {
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
                state.current.isHorizontal = true;
            } else if (Math.abs(deltaY) > 8) {
                state.current.isHorizontal = false;
                state.current.active = false; // Cancel gesture, let browser scroll vertically
                return;
            } else {
                return; // Wait for more movement to determine intention
            }
        }

        if (state.current.isHorizontal) {
            if (deltaX < 0) return; // Only allow swiping to the right

            // Apply rubber-band resistance physics
            let dragX = deltaX * 0.55;
            if (dragX > MAX_DRAG) {
                dragX = MAX_DRAG + (dragX - MAX_DRAG) * 0.15;
            }

            state.current.dragX = dragX;
            // Use requestAnimationFrame for buttery smooth tracking
            requestAnimationFrame(() => updateDOM(dragX));
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!state.current.active) return;
        state.current.active = false;

        // Re-enable CSS transitions for the snap-back animation
        if (bubbleRef.current) {
            bubbleRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            bubbleRef.current.style.transform = 'translateX(0px)';
        }

        if (iconRef.current) {
            iconRef.current.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            iconRef.current.style.opacity = '0';
            iconRef.current.style.transform = 'translateY(-50%) scale(0.5)';
            iconRef.current.classList.remove('bg-black/10');
        }

        // Trigger the reply if pulled far enough
        if (state.current.dragX >= THRESHOLD && onReply) {
            onReply();
        }

        state.current.dragX = 0;
        state.current.thresholdCrossed = false;
    }, [onReply]);

    return {
        bubbleRef,
        iconRef,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchEnd
        }
    };
};