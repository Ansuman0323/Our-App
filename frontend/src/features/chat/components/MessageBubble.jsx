import React from 'react';

// FIX: React.memo prevents the entire list from re-rendering when 1 message is added
export const MessageBubble = React.memo(({ message, isMine, onRetry }) => {
    const isPending = message.status === 'pending';
    const isError = message.status === 'error';
    const isDeleted = message.status === 'DELETED';

    return (
        <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className="flex flex-col items-end">
                <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl relative shadow-sm ${isMine
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                        } ${isPending ? 'opacity-60' : ''} ${isError ? 'bg-red-500 text-white' : ''}`}
                >
                    <p className={`text-[15px] leading-relaxed break-words ${isDeleted ? 'italic opacity-70' : ''}`}>
                        {isDeleted ? 'This message was deleted.' : message.content}
                    </p>

                    <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isMine ? (isError ? 'text-red-200' : 'text-indigo-200') : 'text-slate-400'}`}>
                        <span>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && !isPending && !isError && <span>✓</span>}
                    </div>
                </div>

                {isError && (
                    <button
                        onClick={onRetry}
                        className="text-xs text-red-500 mt-1 font-medium hover:underline focus:outline-none"
                    >
                        Failed to send. Tap to retry.
                    </button>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: only re-render if the message status or content changes
    return prevProps.message.status === nextProps.message.status &&
        prevProps.message.content === nextProps.message.content;
});

MessageBubble.displayName = 'MessageBubble';