import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { EmojiPickerPopover } from './EmojiPickerPopover';

const QUICK_EMOJIS = ['❤️', '😂', '🥰', '😭', '👍', '✨'];

export const MessageBottomSheet = ({ message, isMine, onClose, onAction, onToggleReaction }) => {

    const [showPicker, setShowPicker] = useState(false);
    const [poppedEmoji, setPoppedEmoji] = useState(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleReaction = (emoji) => {
        onToggleReaction(message, emoji);
        setPoppedEmoji(emoji);
        setTimeout(() => onClose(), 160);
    };

    const sheet = (
        // The shared ChatOverlayBackdrop (rendered by ChatOverlayProvider)
        // already dims the background and closes on outside tap. This
        // wrapper just centers/bottom-anchors the sheet content above it.
        <div
            className="fixed inset-0 flex items-end sm:items-center sm:justify-center"
            style={{ zIndex: 10010 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.9 }}
                className="chat-action-sheet relative w-full sm:max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--surface-border)' }} />
                </div>

                {/* Conditional Rendering: Show Picker OR Actions */}
                {showPicker ? (
                    <div className="w-full px-3 pb-4">
                        <EmojiPickerPopover
                            onSelect={handleReaction}
                            isMobile={true}
                        />
                    </div>
                ) : (
                    <>
                        {/* QUICK REACTIONS SECTION - Hidden if message is already deleted */}
                        {message.status !== 'DELETED' && (
                            <div
                                className="flex items-center justify-between gap-1.5 px-4 py-3.5 mb-2"
                                style={{ borderBottom: '1px solid var(--surface-border)' }}
                            >
                                {QUICK_EMOJIS.map(emoji => (
                                    <motion.button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        whileTap={{ scale: 0.85 }}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                        className={`chat-reaction-btn relative w-11 h-11 text-xl focus:outline-none ${poppedEmoji === emoji ? 'reaction-pop' : ''}`}
                                    >
                                        {emoji}
                                        {poppedEmoji === emoji && (
                                            <span className="chat-floating-heart text-sm">❤</span>
                                        )}
                                    </motion.button>
                                ))}
                                <motion.button
                                    onClick={() => setShowPicker(true)}
                                    whileTap={{ scale: 0.85 }}
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                    className="chat-reaction-btn w-11 h-11 focus:outline-none"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                </motion.button>
                            </div>
                        )}

                        {/* ACTION ITEMS */}
                        <div className="flex flex-col pb-4 px-2">
                            {onAction('renderItems')}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );

    return createPortal(sheet, document.body);
};