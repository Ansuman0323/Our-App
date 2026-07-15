import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const MAX_TEXTAREA_HEIGHT = 128; // px, ~6 lines before internal scroll

// editingMessage: the message object currently being edited, or null for
// normal compose mode. onSaveEdit(message, newContent) / onCancelEdit() are
// only relevant while editingMessage is set.
export const MessageInput = ({ onSend, emitTypingStart, emitTypingStop, editingMessage, onSaveEdit, onCancelEdit }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);
    const isEditing = !!editingMessage;

    // Auto-grow the textarea to fit content, capped at MAX_TEXTAREA_HEIGHT
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }, [text]);

    // Entering edit mode: prefill the compose bar with the message's current
    // text and focus it, exactly like WhatsApp/Telegram's inline edit.
    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.content);
            textareaRef.current?.focus();
        }
    }, [editingMessage]);

    const resetCompose = () => {
        setText('');
        emitTypingStop();
    };

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed) return;

        if (isEditing) {
            if (trimmed !== editingMessage.content) {
                onSaveEdit(editingMessage, trimmed);
            } else {
                // Nothing actually changed - just leave edit mode quietly.
                onCancelEdit();
            }
            resetCompose();
            return;
        }

        onSend(trimmed);
        resetCompose();
    };

    const handleCancelEdit = () => {
        onCancelEdit();
        resetCompose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submit();
    };

    const handleChange = (e) => {
        setText(e.target.value);
        if (e.target.value.trim() === '') emitTypingStop();
        else emitTypingStart();
    };

    // Enter sends/saves, Shift+Enter inserts a newline, Escape cancels an edit
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
        if (e.key === 'Escape' && isEditing) {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    return (
        <div
            className="bg-white/80 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 z-10 shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
        >
            {isEditing && (
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-3.5 py-2 mb-2 bg-indigo-50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="flex items-center gap-2 text-indigo-700 min-w-0">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="text-sm font-semibold truncate">Editing message</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors shrink-0"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                <div className="flex-1 flex items-end bg-slate-100 rounded-[1.75rem] px-2 py-1.5 border border-transparent focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200 shadow-inner">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isEditing ? 'Edit message...' : 'Message...'}
                        className="w-full bg-transparent border-none resize-none focus:ring-0 px-3 py-2 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none max-h-32 overflow-y-auto"
                        autoComplete="off"
                        aria-label={isEditing ? 'Edit message' : 'Message'}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!text.trim()}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-90 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 ${isEditing
                        ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700 disabled:hover:bg-emerald-600'
                        : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700 disabled:hover:bg-indigo-600'
                        }`}
                    aria-label={isEditing ? 'Save edited message' : 'Send message'}
                >
                    {isEditing ? (
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 md:w-6 md:h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
};