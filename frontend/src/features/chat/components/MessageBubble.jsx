import React from 'react';

export const MessageBubble = React.memo(({ message, isMine, isConsecutive, onRetry }) => {
    const isPending = message.status === 'pending';
    const isError = message.status === 'error';
    const isDeleted = message.status === 'DELETED';
    const isRead = message.status === 'read';
    const isDelivered = message.status === 'delivered';

    // Formatting the timestamp HH:MM AM/PM
    const timeString = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return (
        <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mb-1' : 'mb-3 mt-2'} group animate-in slide-in-from-bottom-2 fade-in duration-300`}>
            <div className={`flex flex-col items-end max-w-[85%] md:max-w-[65%]`}>
                <div
                    className={`
                        px-3.5 py-2 md:px-4 md:py-2.5 relative shadow-sm
                        ${isMine
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-800 border border-slate-100'
                        } 
                        ${isPending ? 'opacity-70' : ''} 
                        ${isError ? 'bg-red-500 text-white border-red-600' : ''}
                        
                        /* Grouping Border Radiuses */
                        rounded-2xl
                        ${isMine ? (isConsecutive ? 'rounded-tr-md' : 'rounded-br-sm') : ''}
                        ${!isMine ? (isConsecutive ? 'rounded-tl-md' : 'rounded-bl-sm') : ''}
                    `}
                >
                    <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${isDeleted ? 'italic text-opacity-70' : ''}`}>
                        {isDeleted ? '🚫 This message was deleted' : message.content}

                        {/* Inline Floated Timestamp & Ticks */}
                        <span className={`float-right inline-flex items-center gap-1 ml-3 mt-2 text-[10px] md:text-[11px] font-medium ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {timeString}

                            {isMine && !isPending && !isError && (isRead || isDelivered) && (
                                <svg
                                    className={`w-4 h-4 ${isRead ? 'text-sky-300' : 'text-indigo-200'}`}
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <polyline points="18 6 8.5 17 4 12.5"></polyline>
                                    <polyline points="22 6 12.5 17 11 15.3"></polyline>
                                </svg>
                            )}
                            {isMine && !isPending && !isError && !isRead && !isDelivered && (
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            )}
                            {isMine && isPending && (
                                <svg className="w-3.5 h-3.5 animate-spin opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
                                </svg>
                            )}
                        </span>
                    </p>
                </div>

                {isError && (
                    <button onClick={onRetry} className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1 hover:underline">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Failed to send. Tap to retry.
                    </button>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.message.status === nextProps.message.status &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.isConsecutive === nextProps.isConsecutive;
});

MessageBubble.displayName = 'MessageBubble';