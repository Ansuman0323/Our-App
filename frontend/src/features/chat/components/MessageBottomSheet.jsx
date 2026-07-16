import React, { useState } from 'react';
import { EmojiPickerPopover } from './EmojiPickerPopover';

const QUICK_EMOJIS = ['❤️', '😂', '🥰', '😭', '👍', '✨'];

export const MessageBottomSheet = ({ message, isMine, onClose, onAction, onToggleReaction }) => {

    const [showPicker, setShowPicker] = useState(false);

    const handleReaction = (emoji) => {
        onToggleReaction(message, emoji);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl pb-safe shadow-2xl animate-in slide-in-from-bottom-full duration-300 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Conditional Rendering: Show Picker OR Actions */}
                {showPicker ? (
                    <div className="w-full px-2 pb-4">
                        <EmojiPickerPopover
                            onSelect={handleReaction}
                            isMobile={true}
                        />
                    </div>
                ) : (
                    <>
                        {/* QUICK REACTIONS SECTION - Hidden if message is already deleted */}
                        {message.status !== 'DELETED' && (
                            <div className="flex items-center justify-between gap-1 px-4 py-3 mb-2 border-b border-slate-100">
                                {QUICK_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm hover:scale-110 active:scale-95 transition-all text-xl focus:outline-none"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowPicker(true)}
                                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-500 focus:outline-none"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        )}

                        {/* ACTION ITEMS */}
                        <div className="flex flex-col pb-4 px-2">
                            {onAction('renderItems')}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};