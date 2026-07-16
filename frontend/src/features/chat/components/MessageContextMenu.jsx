import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EmojiPickerPopover } from './EmojiPickerPopover';

const QUICK_EMOJIS = ['❤️', '😂', '🥰', '😭', '👍', '✨'];

export const MessageContextMenu = ({ anchorRect, isMine, message, onClose, onAction, onToggleReaction }) => {
    const menuRef = useRef(null);
    const [style, setStyle] = useState({ opacity: 0, top: 0, left: 0 });

    const [showPicker, setShowPicker] = useState(false);

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
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 w-[310px] bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 overflow-visible animate-in fade-in zoom-in-95 duration-150 transition-opacity`}
            style={style}
        >
            {/* QUICK REACTIONS SECTION - Hidden if message is already deleted */}
            {message.status !== 'DELETED' && (
                <div className="relative flex items-center justify-between gap-1 px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
                    {QUICK_EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm hover:scale-110 hover:bg-slate-50 transition-all text-lg focus:outline-none"
                        >
                            {emoji}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 shadow-sm transition-all focus:outline-none ${showPicker ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-white hover:scale-110 hover:bg-slate-50 text-slate-500'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </button>

                    {showPicker && (
                        <EmojiPickerPopover
                            onSelect={handleReaction}
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
};