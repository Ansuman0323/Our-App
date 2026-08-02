import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast'; // 1. IMPORT TOAST
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { AttachmentPreview } from './MediaRenderers';
import { EmojiGifPicker } from './EmojiGifPicker';
import { useChatOverlay } from '../contexts/ChatOverlayContext';

const MAX_TEXTAREA_HEIGHT = 128; // px, ~6 lines before internal scroll
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ROMANTIC_PLACEHOLDERS = [
    "Tell them something sweet…",
    "What's on your heart today?",
    "Plan your next date…",
    "Send a little love note…",
    "Say something only they'd understand…",
];

export const MessageInput = ({
    onSend,
    emitTypingStart,
    emitTypingStop,
    editingMessage,
    onSaveEdit,
    onCancelEdit,
    replyingToMessage,
    onCancelReply
}) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [pickerAnchor, setPickerAnchor] = useState(null);

    const textareaRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const isEditing = !!editingMessage;
    const isMobile = window.innerWidth < 768;

    const { activeOverlay, openOverlay, closeOverlay } = useChatOverlay();
    const showPicker = activeOverlay === 'emojiPicker';

    // Gently rotate the romantic placeholder prompts while the composer is
    // idle (empty, not focused, not mid-edit/reply) — purely cosmetic, never
    // interferes with typing.
    useEffect(() => {
        if (text || isFocused || isEditing || replyingToMessage) return;
        const timer = setInterval(() => {
            setPlaceholderIndex((i) => (i + 1) % ROMANTIC_PLACEHOLDERS.length);
        }, 3400);
        return () => clearInterval(timer);
    }, [text, isFocused, isEditing, replyingToMessage]);

    // The shared ChatOverlayBackdrop handles outside-tap-to-close for us
    // now that the picker is portaled to <body>. We still want Escape to
    // close it, and only while it's actually the active overlay.
    useEffect(() => {
        if (!showPicker) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') closeOverlay();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showPicker, closeOverlay]);

    // Keep the portaled picker anchored just above the composer, clamped
    // so it can never overflow the viewport, and re-measure on resize
    // (e.g. the on-screen keyboard opening/closing).
    useLayoutEffect(() => {
        if (!showPicker) return;
        const updateAnchor = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setPickerAnchor({ bottom: window.innerHeight - rect.top + 8 });
        };
        updateAnchor();
        window.addEventListener('resize', updateAnchor);
        return () => window.removeEventListener('resize', updateAnchor);
    }, [showPicker]);

    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }, [text]);

    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.content || '');
            textareaRef.current?.focus();
        } else if (replyingToMessage) {
            textareaRef.current?.focus();
        }
    }, [editingMessage, replyingToMessage]);

    const handleEmojiSelect = (emoji) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;

            const newText = text.substring(0, start) + emoji + text.substring(end);
            setText(newText);
            emitTypingStart();

            // On mobile, calling .focus() here reopens the on-screen keyboard on
            // every emoji tap (since the picker click already blurred the
            // textarea), causing the keyboard to flicker open/closed while
            // picking multiple emojis. We still update the caret position so
            // the next emoji inserts in the right place, but we only restore
            // focus on desktop, where there's no soft keyboard to fight and
            // refocusing lets the user keep typing immediately.
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
                    if (!isMobile) {
                        textareaRef.current.focus();
                    }
                }
            }, 0);
        } else {
            setText(prev => prev + emoji);
            emitTypingStart();
        }
    };

    const resetCompose = () => {
        setText('');
        setFile(null);
        emitTypingStop();
        closeOverlay();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed && !file) return;

        if (file && file.size > MAX_FILE_SIZE) {
            toast.error("Maximum upload size is 50 MB.");
            return;
        }

        if (isEditing) {
            if (trimmed !== editingMessage.content) {
                onSaveEdit(editingMessage, trimmed);
            } else {
                onCancelEdit();
            }
            resetCompose();
            return;
        }

        let type = 'TEXT';
        if (file) {
            if (file.type.startsWith('image/')) type = 'IMAGE';
            else if (file.type.startsWith('video/')) type = 'VIDEO';
            else type = 'FILE';
        }

        onSend(trimmed, null, replyingToMessage, file, type);
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

    const handleFileSelect = (e) => {
        const selected = e.target.files?.[0];

        if (!selected) return;

        if (selected.size > MAX_FILE_SIZE) {
            toast.error("Maximum upload size is 50 MB.");
            e.target.value = "";
            return;
        }

        setFile(selected);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (isEditing) handleCancelEdit();
            if (replyingToMessage) onCancelReply();
        }
    };

    const activePlaceholder = isEditing
        ? 'Edit message...'
        : replyingToMessage
            ? 'Reply...'
            : ROMANTIC_PLACEHOLDERS[placeholderIndex];

    return (
        <div
            ref={containerRef}
            className="px-4 py-3 md:px-6 md:py-4 z-10 shrink-0 relative"
            style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)',
                background: 'var(--surface-glass-strong)',
                backdropFilter: 'blur(var(--blur-md)) saturate(160%)',
                WebkitBackdropFilter: 'blur(var(--blur-md)) saturate(160%)',
                borderTop: '1px solid var(--surface-border)',
            }}
        >
            {isEditing && (
                <div
                    className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-200"
                    style={{ background: 'var(--color-success-soft)', border: '1px solid rgba(159, 214, 194, 0.35)' }}
                >
                    <div className="flex items-center gap-2 min-w-0" style={{ color: 'var(--color-success)' }}>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="text-sm font-semibold truncate">Editing message</span>
                    </div>
                    <button onClick={handleCancelEdit} type="button" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0" style={{ color: 'var(--color-success)' }}>
                        Cancel
                    </button>
                </div>
            )}

            {replyingToMessage && !isEditing && (
                <div
                    className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-200"
                    style={{ background: 'var(--surface-glass)', border: '1px solid var(--surface-border)' }}
                >
                    <div className="flex flex-col min-w-0 flex-1 pl-2.5" style={{ borderLeft: '3px solid var(--dream-pink)' }}>
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--dream-pink)', fontFamily: 'var(--font-quote)' }}>
                            Replying to {replyingToMessage.sender_name || 'User'}
                        </span>
                        <span className="text-sm truncate line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                            {replyingToMessage.type === 'IMAGE' ? '🖼 Photo' :
                                replyingToMessage.type === 'VIDEO' ? '🎥 Video' :
                                    replyingToMessage.type === 'DOCUMENT' ? '📄 Document' :
                                        replyingToMessage.content}
                        </span>
                    </div>
                    <button onClick={onCancelReply} type="button" className="w-9 h-9 flex items-center justify-center rounded-full transition-colors shrink-0 focus:outline-none" style={{ color: 'var(--text-muted)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}

            {showPicker && pickerAnchor && createPortal(
                <div
                    className="chat-emoji-popover-anchor"
                    style={{ bottom: pickerAnchor.bottom }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <EmojiGifPicker
                        isMobile={isMobile}

                        // 1. Existing Emoji Handler
                        onEmojiSelect={handleEmojiSelect}

                        // 2. NEW: Immediate send handlers for Media
                        onGifSelect={(gifData) => {
                            onSend('', null, replyingToMessage, null, 'GIF', gifData);
                            resetCompose();
                        }}
                        onStickerSelect={(stickerData) => {
                            onSend('', null, replyingToMessage, null, 'STICKER', stickerData);
                            resetCompose();
                        }}
                    />
                </div>,
                document.body
            )}

            {/* ATTACHMENT PREVIEW */}
            {file && <AttachmentPreview file={file} onRemove={() => setFile(null)} />}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                <div
                    className="chat-composer-glow flex-1 flex items-end rounded-[1.75rem] px-1.5 py-1.5 transition-all duration-200"
                    style={{ background: 'var(--surface-glass)' }}
                >

                    <div className="flex items-center gap-0.5 pl-0.5 mb-0.5">
                        <button
                            type="button"
                            onClick={() => (showPicker ? closeOverlay() : openOverlay('emojiPicker'))}
                            className="p-2.5 rounded-full flex-shrink-0 transition-colors focus:outline-none"
                            style={showPicker
                                ? { background: 'var(--color-primary-soft)', color: 'var(--dream-lavender)' }
                                : { color: 'var(--text-muted)' }}
                            aria-label="Insert emoji"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 rounded-full flex-shrink-0 transition-colors focus:outline-none"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label="Attach file"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        </button>
                    </div>

                    <div className="relative flex-1 min-w-0">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={text}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder=" "
                            className="w-full bg-transparent border-none resize-none focus:ring-0 px-2.5 py-2.5 text-[15px] leading-relaxed outline-none max-h-32 overflow-y-auto relative z-10"
                            style={{ color: 'var(--text-primary)' }}
                            autoComplete="off"
                            aria-label={isEditing ? 'Edit message' : replyingToMessage ? 'Reply to message' : 'Message'}
                        />
                        {!text && (
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={activePlaceholder}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.35 }}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none truncate max-w-[calc(100%-1.25rem)]"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {activePlaceholder}
                                </motion.span>
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                <motion.button
                    type="submit"
                    disabled={!text.trim() && !file}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 disabled:opacity-45 transition-all duration-200 focus:outline-none"
                    style={{
                        background: isEditing ? 'var(--gradient-mint-emerald)' : 'var(--gradient-rose-lavender)',
                        color: 'var(--color-on-color)',
                        boxShadow: isEditing ? '0 4px 16px rgba(111, 194, 163, 0.35)' : 'var(--shadow-glow-accent)',
                    }}
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
                </motion.button>
            </form>
        </div>
    );
};