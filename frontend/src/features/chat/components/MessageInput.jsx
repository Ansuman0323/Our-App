import React, { useState, useRef, useLayoutEffect } from 'react';

const MAX_TEXTAREA_HEIGHT = 128; // px, ~6 lines before internal scroll

export const MessageInput = ({ onSend, emitTypingStart, emitTypingStop }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);

    // Auto-grow the textarea to fit content, capped at MAX_TEXTAREA_HEIGHT
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }, [text]);

    const submit = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
            emitTypingStop();
        }
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

    // Enter sends the message, Shift+Enter inserts a newline
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    return (
        <div
            className="bg-white/80 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 z-10 shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
        >
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                <div className="flex-1 flex items-end bg-slate-100 rounded-[1.75rem] px-2 py-1.5 border border-transparent focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200 shadow-inner">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        className="w-full bg-transparent border-none resize-none focus:ring-0 px-3 py-2 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none max-h-32 overflow-y-auto"
                        autoComplete="off"
                        aria-label="Message"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 active:scale-90 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-indigo-600 transition-all duration-200"
                    aria-label="Send message"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
};