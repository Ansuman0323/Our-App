import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { EmojiPickerPopover } from './EmojiPickerPopover';
const QUICK_EMOJIS = ['❤️', '😂', '🥰', '😭', '👍', '✨'];

export const MessageContextMenu = ({ anchorRect, isMine, message, onClose, onAction, onToggleReaction }) => {
    const menuRef = useRef(null);
    const [style, setStyle] = useState({ opacity: 0, top: 0, left: 0 });

    const [showPicker, setShowPicker] = useState(false);
    const [poppedEmoji, setPoppedEmoji] = useState(null);

    // The shared ChatOverlayBackdrop already handles outside-tap-to-close
    // and background dim/lock. We still listen for Escape here since the
    // backdrop has no keyboard affordance of its own.
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

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

        left = Math.min(Math.max(left, PADDING), Math.max(PADDING, window.innerWidth - menuRect.width - PADDING));

        let top = anchorRect.top;
        if (top + menuRect.height > window.innerHeight - PADDING) {
            top = anchorRect.bottom - menuRect.height;
        }
        top = Math.min(Math.max(top, PADDING), Math.max(PADDING, window.innerHeight - menuRect.height - PADDING));

        setStyle({ top, left, opacity: 1 });
    }, [anchorRect, isMine]);

    const handleReaction = (emoji) => {
        onToggleReaction(message, emoji);
        setPoppedEmoji(emoji);
        setTimeout(() => {
            // Close after letting the reaction animation register.
            onClose();
        }, 160);
    };

    const menu = (
        <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed w-[310px] rounded-2xl overflow-visible animate-in fade-in zoom-in-95 duration-150 transition-opacity"
            style={{
                ...style,
                zIndex: 10010,
                background: 'var(--surface-glass-strong)',
                backdropFilter: 'blur(var(--blur-lg)) saturate(160%)',
                WebkitBackdropFilter: 'blur(var(--blur-lg)) saturate(160%)',
                border: '1px solid var(--surface-border)',
                boxShadow: 'var(--shadow-floating)',
            }}
        >
            {/* QUICK REACTIONS SECTION - Hidden if message is already deleted */}
            {message.status !== 'DELETED' && (
                <div
                    className="relative flex items-center justify-between gap-1 px-3 py-2.5"
                    style={{ borderBottom: '1px solid var(--surface-border)' }}
                >
                    {QUICK_EMOJIS.map(emoji => (
                        <motion.button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.14 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                            className={`chat-reaction-btn relative w-9 h-9 text-lg focus:outline-none ${poppedEmoji === emoji ? 'reaction-pop' : ''}`}
                        >
                            {emoji}
                            {poppedEmoji === emoji && (
                                <span className="chat-floating-heart text-xs">❤</span>
                            )}
                        </motion.button>
                    ))}
                    <motion.button
                        onClick={() => setShowPicker((v) => !v)}
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.14 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                        className="chat-reaction-btn w-9 h-9 focus:outline-none"
                        style={{
                            background: showPicker ? 'var(--color-primary-soft)' : undefined,
                            color: showPicker ? 'var(--dream-lavender)' : 'var(--text-secondary)',
                            borderColor: showPicker ? 'var(--dream-lavender)' : undefined,
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </motion.button>

                    {showPicker && (
                        <EmojiPickerPopover
                            onSelect={handleReaction}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[10020]"
                        />
                    )}
                </div>
            )}

            {/* ACTION ITEMS */}
            <div className="flex flex-col py-1">
                {onAction('renderItems')}
            </div>
        </div>
    );

    return createPortal(menu, document.body);
};