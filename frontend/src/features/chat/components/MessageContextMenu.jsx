import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Anchors the menu beside the clicked message bubble (anchorRect = bubble's
// getBoundingClientRect()) instead of raw cursor coordinates, and flips
// horizontally/vertically if there isn't room on the preferred side.
export const MessageContextMenu = ({ anchorRect, isMine, message, onClose, onAction }) => {
    const menuRef = useRef(null);
    // Start hidden (opacity 0) until we've measured the menu's real size and
    // can position it without an initial "flash" in the wrong spot.
    const [style, setStyle] = useState({ opacity: 0, top: 0, left: 0 });

    // Close on click outside or escape key
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Measure the rendered menu, then position it flush against the bubble:
    // to the right of partner bubbles / to the left of my own bubbles by
    // default, flipping to whichever side actually has room. Vertically it
    // aligns with the top of the bubble, flipping upward if it would overflow
    // the bottom of the viewport.
    useLayoutEffect(() => {
        if (!menuRef.current || !anchorRect) return;

        const menuRect = menuRef.current.getBoundingClientRect();
        const GAP = 8;
        const PADDING = 8;

        const preferRight = !isMine;
        let left = preferRight ? anchorRect.right + GAP : anchorRect.left - menuRect.width - GAP;

        const fitsPreferred = preferRight
            ? left + menuRect.width <= window.innerWidth - PADDING
            : left >= PADDING;

        if (!fitsPreferred) {
            left = preferRight ? anchorRect.left - menuRect.width - GAP : anchorRect.right + GAP;
        }

        // Final safety clamp in case neither side fully fits (narrow viewports)
        left = Math.min(Math.max(left, PADDING), Math.max(PADDING, window.innerWidth - menuRect.width - PADDING));

        let top = anchorRect.top;
        if (top + menuRect.height > window.innerHeight - PADDING) {
            top = anchorRect.bottom - menuRect.height;
        }
        top = Math.min(Math.max(top, PADDING), Math.max(PADDING, window.innerHeight - menuRect.height - PADDING));

        setStyle({ top, left, opacity: 1 });
    }, [anchorRect, isMine]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-opacity"
            style={style}
        >
            <div className="flex flex-col py-1">
                {onAction('renderItems')}
            </div>
        </div>
    );
};