import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCall } from '../contexts/CallContext';
import { CallState } from '../utils/fsm';
import './IncomingCallModal.css';

const EXIT_ANIMATION_MS = 220;
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export const IncomingCallModal = memo(() => {
    const { callState, partnerProfile, acceptCall, rejectCall, callType } = useCall();
    const isIncoming = callState === CallState.INCOMING;
    const isVoice = callType === 'voice';

    const [renderState, setRenderState] = useState(isIncoming ? 'visible' : 'hidden');
    const exitTimeoutRef = useRef(null);

    useEffect(() => {
        if (isIncoming) {
            if (exitTimeoutRef.current) {
                clearTimeout(exitTimeoutRef.current);
                exitTimeoutRef.current = null;
            }
            setRenderState('entering');
            const raf = requestAnimationFrame(() => setRenderState('visible'));
            return () => cancelAnimationFrame(raf);
        }

        setRenderState((prev) => {
            if (prev === 'hidden') return 'hidden';
            return 'exiting';
        });
        exitTimeoutRef.current = setTimeout(() => {
            setRenderState('hidden');
            setCachedProfile(null);
        }, EXIT_ANIMATION_MS);

        return () => {
            if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        };
    }, [isIncoming]);

    const [cachedProfile, setCachedProfile] = useState(partnerProfile ?? null);

    useEffect(() => {
        if (isIncoming) {
            setCachedProfile(partnerProfile ?? null);
        }
    }, [isIncoming, partnerProfile]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    useEffect(() => {
        if (isIncoming) {
            setIsProcessing(false);
            setPendingAction(null);
        }
    }, [isIncoming]);

    const handleAction = useCallback(async (actionName, actionFn) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setPendingAction(actionName);
        try {
            await actionFn();
        } catch (err) {
            console.error(`IncomingCallModal: ${actionName} failed`, err);
        } finally {
            setIsProcessing(false);
            setPendingAction(null);
        }
    }, [isProcessing]);

    const modalRef = useRef(null);
    const acceptButtonRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (isIncoming) {
            previousFocusRef.current = document.activeElement;
            acceptButtonRef.current?.focus();
        } else if (previousFocusRef.current) {
            previousFocusRef.current.focus();
            previousFocusRef.current = null;
        }
    }, [isIncoming]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            const root = modalRef.current;
            if (!root) return;
            const focusable = Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
                (el) => !el.hasAttribute('disabled')
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, []);

    const [avatarErrored, setAvatarErrored] = useState(false);
    const displayName = cachedProfile?.displayName || 'Unknown Caller';
    const initials = useMemo(() => getInitials(displayName), [displayName]);
    const hasAvatarUrl = Boolean(cachedProfile?.avatarUrl) && !avatarErrored;

    useEffect(() => {
        setAvatarErrored(false);
    }, [cachedProfile?.avatarUrl]);

    if (renderState === 'hidden') return null;

    const overlayClassName = [
        'modal-overlay',
        renderState === 'entering' && 'is-entering',
        renderState === 'exiting' && 'is-exiting'
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={modalRef}
            className={overlayClassName}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="incoming-call-title"
            aria-describedby="incoming-call-status"
            onKeyDown={handleKeyDown}
        >
            <div className="modal-content">
                <div className="title-group">
                    <h2 id="incoming-call-title">Incoming Call</h2>
                    <div className="call-type-indicator" aria-hidden="true" style={{ pointerEvents: 'none' }}>
                        {isVoice ? (
                            <svg className="camera-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.03 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                            </svg>
                        ) : (
                            <svg className="camera-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                        )}
                        <span>{isVoice ? 'Voice Call' : 'Video Call'}</span>
                    </div>
                </div>

                <div className="caller-info">
                    {hasAvatarUrl ? (
                        <img
                            src={cachedProfile.avatarUrl}
                            alt=""
                            className="avatar"
                            onError={() => setAvatarErrored(true)}
                        />
                    ) : (
                        <div className="avatar avatar-fallback" aria-hidden="true">
                            {initials}
                        </div>
                    )}
                    <p>{displayName}</p>
                </div>

                <p id="incoming-call-status" className="sr-only" aria-live="polite">
                    {isProcessing
                        ? pendingAction === 'accept'
                            ? 'Connecting call'
                            : 'Declining call'
                        : `Incoming call from ${displayName}`}
                </p>

                <div className="actions">
                    <button
                        onClick={() => handleAction('reject', rejectCall)}
                        disabled={isProcessing}
                        aria-busy={isProcessing && pendingAction === 'reject'}
                        className="btn-reject"
                        aria-label="Reject call"
                    >
                        {isProcessing && pendingAction === 'reject' ? (
                            <>
                                <span className="spinner" aria-hidden="true" />
                                Declining…
                            </>
                        ) : (
                            'Reject'
                        )}
                    </button>
                    <button
                        ref={acceptButtonRef}
                        onClick={() => handleAction('accept', acceptCall)}
                        disabled={isProcessing}
                        aria-busy={isProcessing && pendingAction === 'accept'}
                        className="btn-accept"
                        aria-label="Accept call"
                    >
                        {isProcessing && pendingAction === 'accept' ? (
                            <>
                                <span className="spinner" aria-hidden="true" />
                                Connecting…
                            </>
                        ) : (
                            'Accept'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
});

IncomingCallModal.displayName = 'IncomingCallModal';