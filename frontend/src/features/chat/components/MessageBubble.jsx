import React, { useRef } from 'react';
import { MediaRenderer, MediaMetaOverlay } from './MediaRenderers';

const groupReactions = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    const groups = {};
    reactions.forEach(r => {
        if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
        groups[r.emoji].count += 1;
        groups[r.emoji].users.push(r);
    });
    return Object.values(groups).sort((a, b) => b.count - a.count);
};

// Small shared renderer for the delivery/read-receipt tick icon so both the
// inline (in-text) and overlay (on-media) timestamp rows stay in sync.
// Shape (single vs double tick) is keyed so React remounts + animates in on
// sent->delivered; delivered->read reuses the same double-tick shape and only
// transitions color (grey -> blue), avoiding an unnecessary remount there.
const StatusTicks = ({ deliveryState, colorClass }) => {
    const isDoubleTick = deliveryState === 'delivered' || deliveryState === 'read';
    const tickColorClass = deliveryState === 'read' ? 'text-sky-300' : colorClass;

    // Keyed on deliveryState itself (not just shape) so every state change —
    // including the color-only delivered->read step — replays the same subtle
    // scale-in + fade, instead of only the shape-changing sent->delivered step.
    if (isDoubleTick) {
        return (
            <svg
                key={deliveryState}
                className={`w-4 h-4 ${tickColorClass} animate-in fade-in zoom-in-90 duration-250 ease-out`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
                <polyline points="18 6 8.5 17 4 12.5"></polyline>
                <polyline points="22 6 12.5 17 11 15.3"></polyline>
            </svg>
        );
    }
    return (
        <svg
            key={deliveryState}
            className={`w-3.5 h-3.5 ${colorClass} animate-in fade-in zoom-in-90 duration-250 ease-out`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
};

export const MessageBubble = React.memo(({ message, isMine, isConsecutive, deliveryState, onRetry, onOpenActions, onQuoteClick, user, onToggleReaction }) => {

    const isPending = message.status === 'pending';
    const isError = message.status === 'error';
    const isDeleted = message.status === 'DELETED';
    const isEdited = !!message.is_edited && !isDeleted;
    const groupedReactions = groupReactions(message.reactions);
    const timeString = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Media (image/video) fills the bubble edge-to-edge, while documents stay as an
    // inset card and plain text keeps its normal padded layout.
    const isMediaAttachment = !isDeleted && !!message.attachment && (message.type === 'IMAGE' || message.type === 'VIDEO');
    const isDocAttachment = !isDeleted && !!message.attachment && (message.type === 'FILE' || message.type === 'DOCUMENT');
    const hasCaption = !isDeleted && !!(message.content && message.content.trim().length > 0);
    // When a media message has no caption, the timestamp/ticks float on top of the media itself
    // (WhatsApp/Telegram-style) instead of taking up their own text row.
    const showOverlayMeta = isMediaAttachment && !hasCaption && !isPending && !isError;
    const showTextRow = isDeleted || hasCaption || (!isMediaAttachment && !isDocAttachment);

    const bubbleContainerRef = useRef(null);
    const touchTimer = useRef(null);

    const handleTouchStart = () => {
        touchTimer.current = setTimeout(() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(50);
            onOpenActions(message, { isTouch: true, isMine });
        }, 500);
    };

    const clearTouch = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        const anchorRect = bubbleContainerRef.current?.getBoundingClientRect();
        onOpenActions(message, { anchorRect, isMine });
    };

    const bubbleStyle = isDeleted
        ? (isMine ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-500')
        : (isMine ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-800 border border-slate-100 shadow-sm');

    const tickColorClass = isMine ? 'text-indigo-200' : 'text-slate-400';

    return (
        <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mb-1' : 'mb-3 mt-2'} group animate-in slide-in-from-bottom-2 fade-in duration-300 relative`}>

            <div
                ref={bubbleContainerRef}
                className={`flex flex-col items-end max-w-[85%] md:max-w-[65%] select-none md:select-auto ${!isDeleted ? 'cursor-pointer' : 'cursor-default'}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={clearTouch}
                onTouchMove={clearTouch}
                onTouchCancel={clearTouch}
                onContextMenu={handleContextMenu}
            >
                <div
                    data-bubble-content="true"
                    className={`
                        relative transition-all duration-300 overflow-hidden
                        ${bubbleStyle}
                        ${isPending ? 'opacity-90' : ''} 
                        ${isError ? 'bg-red-500 text-white border-red-600' : ''}
                        rounded-2xl
                        ${isMine ? (isConsecutive ? 'rounded-tr-md' : 'rounded-br-sm') : ''}
                        ${!isMine ? (isConsecutive ? 'rounded-tl-md' : 'rounded-bl-sm') : ''}
                        ${isMediaAttachment ? '' : 'px-3.5 py-2 md:px-4 md:py-2.5'}
                    `}
                >
                    {message.reply && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onQuoteClick) onQuoteClick(message.reply.id);
                            }}
                            role="button"
                            tabIndex={0}
                            className={`rounded-lg p-2 border-l-4 text-left flex flex-col justify-center transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 ${isMediaAttachment ? 'mx-2.5 mt-2.5 mb-1.5' : 'mb-1.5'} ${isDeleted
                                ? 'bg-black/5 border-slate-300 hover:bg-black/10'
                                : (isMine ? 'bg-black/10 border-indigo-300 hover:bg-black/20' : 'bg-slate-100 border-indigo-500 hover:bg-slate-200')
                                }`}
                        >
                            <div className={`text-[11.5px] font-bold mb-0.5 truncate transition-colors duration-300 ${isDeleted ? 'text-slate-500' : (isMine ? 'text-indigo-200' : 'text-indigo-600')}`}>
                                {message.reply.sender_name || 'User'}
                            </div>
                            <div className={`text-[13px] truncate transition-colors duration-300 flex items-center gap-1 ${isDeleted ? 'text-slate-400' : (isMine ? 'text-indigo-50' : 'text-slate-600')} ${message.reply.status === 'DELETED' ? 'italic opacity-80' : ''}`}>
                                {message.reply.status === 'DELETED' ? (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Deleted message
                                    </>
                                ) : (
                                    <>
                                        {message.reply.type === 'IMAGE' ? '🖼 Photo' :
                                            message.reply.type === 'VIDEO' ? '🎥 Video' :
                                                (message.reply.type === 'DOCUMENT' || message.reply.type === 'FILE') ? `📄 ${message.reply.attachment?.file_name || 'Document'}` :
                                                    message.reply.content}
                                        {message.reply.status === 'EDITED' && <span className="ml-1.5 text-[10px] italic opacity-70">Edited</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MEDIA / DOCUMENT ATTACHMENT via Factory */}
                    {!isDeleted && message.attachment && (
                        <div className={`relative w-full ${hasCaption ? 'mb-2' : ''}`}>
                            <MediaRenderer
                                type={message.type}
                                attachment={message.attachment}
                                isDeleted={isDeleted}
                                isPending={isPending}
                                isError={isError}
                                progress={message.uploadProgress}
                                onRetry={onRetry}
                            />

                            {/* Timestamp/ticks floating directly on caption-less media, à la WhatsApp/Telegram */}
                            {showOverlayMeta && (
                                <MediaMetaOverlay position={message.type === 'VIDEO' ? 'top' : 'bottom'}>
                                    {isEdited && <span className="italic opacity-90">Edited</span>}
                                    {timeString}
                                    {isMine && <StatusTicks deliveryState={deliveryState} colorClass="text-white/80" />}
                                </MediaMetaOverlay>
                            )}
                        </div>
                    )}

                    {showTextRow && (
                        <div className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap select-text cursor-auto ${isDeleted ? 'italic flex items-center gap-1.5' : ''} ${isMediaAttachment ? 'px-3.5 pb-2 pt-0.5 md:px-4' : ''}`}>
                            {isDeleted ? (
                                <>
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    This message was deleted
                                </>
                            ) : (
                                message.content
                            )}

                            <span className={`float-right inline-flex items-center gap-1 ml-3 mt-2 whitespace-nowrap text-[10px] md:text-[11px] font-medium transition-colors duration-300 ${isDeleted ? 'text-slate-400' : (isMine ? 'text-indigo-200' : 'text-slate-400')}`}>
                                {isEdited && <span className="italic opacity-90">Edited</span>}
                                {timeString}

                                {/* STATUS & PROGRESS (only relevant when there's no attachment already showing its own state) */}
                                {!isDeleted && isMine && message.uploadProgress !== undefined && isPending && !message.attachment ? (
                                    <span className="text-indigo-200 text-[10px] ml-1 whitespace-nowrap">Uploading… {message.uploadProgress}%</span>
                                ) : !isDeleted && isMine && !isPending && !isError ? (
                                    <StatusTicks deliveryState={deliveryState} colorClass={tickColorClass} />
                                ) : !isDeleted && isMine && isPending ? (
                                    <svg className="w-3.5 h-3.5 animate-spin opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path></svg>
                                ) : null}
                            </span>
                        </div>
                    )}

                    {!isDeleted && groupedReactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 ${isMediaAttachment ? 'px-3 pb-2.5 pt-1' : 'mt-3 -mb-1'} ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {groupedReactions.map(group => {
                                const iReacted = group.users.some(u => u.user_id === user?.id);
                                return (
                                    <button
                                        key={group.emoji}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleReaction?.(message, group.emoji);
                                        }}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium transition-colors shadow-sm ${iReacted
                                            ? (isMine ? 'bg-white/20 text-white' : 'bg-indigo-100 border border-indigo-200 text-indigo-800')
                                            : (isMine ? 'bg-black/10 text-indigo-100 hover:bg-black/20' : 'bg-white/90 border border-slate-200 text-slate-600 hover:bg-slate-100')
                                            }`}
                                    >
                                        <span>{group.emoji}</span>
                                        {group.count > 1 && <span>{group.count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {isError && !message.attachment && (
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
        prevProps.message.is_edited === nextProps.message.is_edited &&
        prevProps.isConsecutive === nextProps.isConsecutive &&
        prevProps.deliveryState === nextProps.deliveryState &&
        prevProps.message.reply?.status === nextProps.message.reply?.status &&
        prevProps.message.reply?.content === nextProps.message.reply?.content &&
        prevProps.message.uploadProgress === nextProps.message.uploadProgress &&
        prevProps.message.reactions === nextProps.message.reactions &&
        prevProps.message.attachment === nextProps.message.attachment &&
        prevProps.message.type === nextProps.message.type &&
        prevProps.message.created_at === nextProps.message.created_at &&
        prevProps.message.sender_id === nextProps.message.sender_id;
});

MessageBubble.displayName = 'MessageBubble';