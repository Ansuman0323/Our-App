import React, { useState, useRef, useEffect } from 'react';

export const MessageInput = ({ onSend, emitTypingStart, emitTypingStop, isSending }) => {
    const [message, setMessage] = useState('');
    const typingTimeoutRef = useRef(null);
    const textareaRef = useRef(null);

    // FIX: Memory leak cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const handleInput = (e) => {
        setMessage(e.target.value);

        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;

        emitTypingStart();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop();
        }, 1500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (message.trim() && !isSending) {
                onSend(message);
                setMessage('');
                textareaRef.current.style.height = 'auto';
                emitTypingStop();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    return (
        <div className="p-4 bg-white border-t border-slate-100 flex items-end gap-2 shrink-0">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                placeholder="Message..."
                className="flex-1 max-h-32 min-h-[44px] bg-slate-100 rounded-2xl py-3 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                aria-label="Message input"
                rows={1}
            />
            <button
                onClick={() => handleKeyDown({ key: 'Enter' })}
                disabled={!message.trim() || isSending}
                className="h-11 w-11 flex-shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                aria-label="Send message"
            >
                <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>
        </div>
    );
};