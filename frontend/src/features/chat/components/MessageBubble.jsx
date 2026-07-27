import React, { useRef } from 'react';
import { MediaRenderer, MediaMetaOverlay } from './MediaRenderers';
import { useSwipeReply } from '../hooks/useSwipeReply'; // NEW HOOK

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

const StatusTicks = ({ isRead, isDelivered, colorClass }) => {
    if (isRead || isDelivered) {
        return (
            <svg className={`w-4 h-4 ${isRead ? 'text-sky-300' : colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 6 8.5 17 4 12.5"></polyline>
                <polyline points="22 6 12.5 17 11 15.3"></polyline>
            </svg>
        );
    }
    return (
        <svg className={`w-3.5 h-3.5 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
};

// ADDED: onSwipeToReply prop
export const MessageBubble = React.memo(({ message, isMine, isConsecutive, deliveryState, onRetry, onOpenActions, onQuoteClick, user, onToggleReaction, onSwipeToReply }) => {

    const isPending = message.status === 'pending';
    const isError = message.status === 'error';
    const isDeleted = message.status === 'DELETED';
    const isRead = deliveryState === "read";
    const isDelivered =
        deliveryState === "read" ||
        deliveryState === "delivered";
    const isEdited = !!message.is_edited && !isDeleted;
    const groupedReactions = groupReactions(message.reactions);
    const timeString = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const isMediaAttachment =
        !isDeleted &&
        !!message.attachment &&
        (
            message.type === 'IMAGE' ||
            message.type === 'VIDEO' ||
            message.type === 'GIF' ||
            message.type === 'STICKER'
        );
    const isDocAttachment = !isDeleted && !!message.attachment && (message.type === 'FILE' || message.type === 'DOCUMENT');
    const hasCaption =
        !isDeleted &&
        message.type !== "GIF" &&
        message.type !== "STICKER" &&
        !!(message.content && message.content.trim().length > 0);
    const showOverlayMeta = isMediaAttachment && !hasCaption && !isPending && !isError;
    const showTextRow = isDeleted || hasCaption || (!isMediaAttachment && !isDocAttachment);

    const bubbleContainerRef = useRef(null);
    const touchTimer = useRef(null);

    // --- SWIPE TO REPLY INTEGRATION ---
    const canSwipe = !isDeleted && !isError && !isPending && !!onSwipeToReply;
    const { bubbleRef, iconRef, handlers: swipeHandlers } = useSwipeReply(() => {
        if (canSwipe) onSwipeToReply(message);
    });

    const setRefs = (node) => {
        bubbleContainerRef.current = node;
        bubbleRef.current = node;
    };

    const handleTouchStart = (e) => {
        // Trigger both the swipe tracker and the long-press timer
        if (canSwipe) swipeHandlers.onTouchStart(e);

        touchTimer.current = setTimeout(() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(50);
            onOpenActions(message, { isTouch: true, isMine });
        }, 500);
    };

    const handleTouchMove = (e) => {
        // If the finger moves, cancel the long-press menu and allow swipe to take over
        if (touchTimer.current) clearTimeout(touchTimer.current);
        if (canSwipe) swipeHandlers.onTouchMove(e);
    };

    const handleTouchEnd = (e) => {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        if (canSwipe) swipeHandlers.onTouchEnd(e);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        const anchorRect = bubbleContainerRef.current?.getBoundingClientRect();
        onOpenActions(message, { anchorRect, isMine });
    };

    const bubbleStyle = isDeleted
        ? (isMine ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-500')
        : (isMine
            ? 'bg-indigo-600 text-white shadow-[0_1px_2px_rgba(79,70,229,0.18),0_4px_12px_rgba(79,70,229,0.16)]'
            : 'bg-white text-slate-800 border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_10px_rgba(15,23,42,0.04)]');

    const tickColorClass = isMine ? 'text-indigo-200' : 'text-slate-400';

    return (
        <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mb-0.5' : 'mb-2.5 mt-1'} group animate-in slide-in-from-bottom-2 fade-in duration-300 relative`}>

            {/* NEW: Reply curved arrow icon fixed to the left of the chat window */}
            {canSwipe && (
                <div
                    ref={iconRef}
                    className="absolute left-2 top-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-slate-500 z-0 pointer-events-none opacity-0"
                    style={{ transform: 'translateY(-50%) scale(0.5)' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 11l9-9v6c8 0 10 5 10 11-2-4-6-5-10-5v6l-9-9z"></path>
                    </svg>
                </div>
            )}

            <div
                ref={setRefs}
                className={`flex flex-col items-end max-w-[82%] md:max-w-[65%] select-none md:select-auto ${!isDeleted ? 'cursor-pointer' : 'cursor-default'} z-10`}
                style={{ touchAction: 'pan-y' }} // Natively delegates vertical scrolling to the browser
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onContextMenu={handleContextMenu}
            >
                <div
                    data-bubble-content="true"
                    className={`
                        relative transition-colors overflow-hidden
                        ${bubbleStyle}
                        ${isPending ? 'opacity-90' : ''} 
                        ${isError ? 'bg-red-500 text-white border-red-600' : ''}
                        rounded-2xl
                        ${isMine ? (isConsecutive ? 'rounded-tr-md' : 'rounded-br-md') : ''}
                        ${!isMine ? (isConsecutive ? 'rounded-tl-md' : 'rounded-bl-md') : ''}
                        ${isMediaAttachment ? '' : 'px-4 py-2.5 md:px-4 md:py-2.5'}
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
                            className={`relative rounded-xl p-2.5 border-l-4 text-left flex flex-col justify-center transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 overflow-hidden min-w-0 max-h-[80px] ${isMediaAttachment ? 'mx-2.5 mt-2.5 mb-1.5' : 'mb-2'} ${isDeleted
                                ? 'bg-black/5 border-slate-300 hover:bg-black/10'
                                : (isMine ? 'bg-black/10 border-indigo-300 hover:bg-black/20' : 'bg-slate-100 border-indigo-500 hover:bg-slate-200')
                                }`}
                        >
                            <div className={`text-[11.5px] font-bold mb-0.5 truncate transition-colors duration-300 ${isDeleted ? 'text-slate-500' : (isMine ? 'text-indigo-200' : 'text-indigo-600')}`}>
                                {message.reply.sender_name || 'User'}
                            </div>
                            <div className={`text-[13px] line-clamp-2 break-words transition-colors duration-300 ${isDeleted ? 'text-slate-400' : (isMine ? 'text-indigo-50' : 'text-slate-600')} ${message.reply.status === 'DELETED' ? 'italic opacity-80 flex items-center gap-1' : ''}`}>
                                {message.reply.status === 'DELETED' ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Deleted message
                                    </>
                                ) : (
                                    <>
                                        {message.reply.type === 'IMAGE' ? '🖼 Photo' :
                                            message.reply.type === 'VIDEO' ? '🎥 Video' :
                                                message.reply.type === 'GIF' ? '🎞 GIF' :
                                                    message.reply.type === 'STICKER' ? '🧸 Sticker' :
                                                        (message.reply.type === 'FILE' || message.reply.type === 'FILE') ? '📄 Document' :
                                                            message.reply.content}
                                        {message.reply.status === 'EDITED' && <span className="ml-1.5 text-[10px] italic opacity-70 whitespace-nowrap">Edited</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

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

                            {showOverlayMeta && (
                                <MediaMetaOverlay position={message.type === 'VIDEO' ? 'top' : 'bottom'}>
                                    {isEdited && <span className="italic opacity-90">Edited</span>}
                                    {timeString}
                                    {isMine && <StatusTicks isRead={isRead} isDelivered={isDelivered} colorClass="text-white/80" />}
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

                            <span className={`float-right inline-flex items-center gap-1 ml-3 mt-2 text-[11px] font-medium transition-colors duration-300 ${isDeleted ? 'text-slate-400' : (isMine ? 'text-indigo-200' : 'text-slate-400')}`}>
                                {isEdited && <span className="italic opacity-90">Edited</span>}
                                {timeString}

                                {!isDeleted && isMine && message.uploadProgress !== undefined && isPending && !message.attachment ? (
                                    <span className="text-indigo-200 text-[10px] ml-1">{message.uploadProgress}%</span>
                                ) : !isDeleted && isMine && !isPending && !isError && (isRead || isDelivered) ? (
                                    <StatusTicks isRead={isRead} isDelivered={isDelivered} colorClass={tickColorClass} />
                                ) : !isDeleted && isMine && !isPending && !isError && !isRead && !isDelivered ? (
                                    <StatusTicks isRead={false} isDelivered={false} colorClass={tickColorClass} />
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
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors shadow-sm ${iReacted
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
        prevProps.message.reply?.status === nextProps.message.reply?.status &&
        prevProps.message.reply?.content === nextProps.message.reply?.content &&
        prevProps.message.uploadProgress === nextProps.message.uploadProgress &&
        prevProps.message.reactions === nextProps.message.reactions &&
        prevProps.deliveryState === nextProps.deliveryState;
});

MessageBubble.displayName = 'MessageBubble';