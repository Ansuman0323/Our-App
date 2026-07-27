import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { toast } from 'react-hot-toast'; // 1. IMPORT TOAST
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { AttachmentPreview } from './MediaRenderers';
import { EmojiGifPicker } from './EmojiGifPicker';

const MAX_TEXTAREA_HEIGHT = 128; // px, ~6 lines before internal scroll
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
    const [showPicker, setShowPicker] = useState(false);
    const [file, setFile] = useState(null);

    const textareaRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const isEditing = !!editingMessage;
    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') setShowPicker(false);
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

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
        setShowPicker(false);
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

        console.log("===== MESSAGE INPUT =====");
        console.log("file:", file);
        console.log("instanceof File:", file instanceof File);
        console.log("type:", type);

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

    return (
        <div
            ref={containerRef}
            className="bg-white/85 backdrop-blur-md backdrop-saturate-150 px-4 py-3 md:px-6 md:py-4 border-t border-slate-200/70 z-10 shrink-0 relative"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
        >
            {isEditing && (
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="flex items-center gap-2 text-indigo-700 min-w-0">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="text-sm font-semibold truncate">Editing message</span>
                    </div>
                    <button onClick={handleCancelEdit} type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors shrink-0">
                        Cancel
                    </button>
                </div>
            )}

            {replyingToMessage && !isEditing && (
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-200 shadow-sm">
                    <div className="flex flex-col min-w-0 flex-1 border-l-4 border-indigo-500 pl-2.5">
                        <span className="text-xs font-bold text-indigo-600 truncate">
                            Replying to {replyingToMessage.sender_name || 'User'}
                        </span>
                        <span className="text-sm text-slate-600 truncate line-clamp-1">
                            {replyingToMessage.type === 'IMAGE' ? '🖼 Photo' :
                                replyingToMessage.type === 'VIDEO' ? '🎥 Video' :
                                    replyingToMessage.type === 'DOCUMENT' ? '📄 Document' :
                                        replyingToMessage.content}
                        </span>
                    </div>
                    <button onClick={onCancelReply} type="button" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0 focus:outline-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}

            {showPicker && (
                <EmojiGifPicker
                    isMobile={isMobile}
                    className="absolute bottom-[calc(100%-8px)] mb-2 left-2 md:left-6"

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
            )}

            {/* ATTACHMENT PREVIEW */}
            {file && <AttachmentPreview file={file} onRemove={() => setFile(null)} />}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                <div className="flex-1 flex items-end bg-slate-100 rounded-[1.75rem] px-1.5 py-1.5 border border-transparent focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">

                    <div className="flex items-center gap-0.5 pl-0.5 mb-0.5">
                        <button
                            type="button"
                            onClick={() => setShowPicker(!showPicker)}
                            className={`p-2.5 rounded-full flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${showPicker ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
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
                            className="p-2.5 rounded-full flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                            aria-label="Attach file"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        </button>
                    </div>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isEditing ? 'Edit message...' : replyingToMessage ? 'Reply...' : 'Message...'}
                        className="w-full bg-transparent border-none resize-none focus:ring-0 px-2.5 py-2.5 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none max-h-32 overflow-y-auto"
                        autoComplete="off"
                        aria-label={isEditing ? 'Edit message' : replyingToMessage ? 'Reply to message' : 'Message'}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!text.trim() && !file}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-90 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isEditing
                        ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700 disabled:hover:bg-emerald-600 focus:ring-emerald-500/50'
                        : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700 disabled:hover:bg-indigo-600 focus:ring-indigo-500/50'
                        }`}
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