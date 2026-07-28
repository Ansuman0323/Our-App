import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCall } from '../contexts/CallContext';
import { CallState } from '../utils/fsm';
import './IncomingCallModal.css';

// Exit animation duration must match the CSS transition timing (see .modal-overlay.is-exiting)
const EXIT_ANIMATION_MS = 220;

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * IncomingCallModal
 * Presentation-only component. Handles incoming call display,
 * accessible focus management/trapping, action locking, avatar
 * fallback, and enter/exit animation lifecycle.
 */
export const IncomingCallModal = memo(() => {
    const {
        callState,
        partnerProfile,
        acceptCall,
        rejectCall
    } = useCall();

    const isIncoming = callState === CallState.INCOMING;

    // --- Animation lifecycle -------------------------------------------------
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
        }, EXIT_ANIMATION_MS);

        return () => {
            if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        };
    }, [isIncoming]);

    // --- Action locking --------------------------------------------------------
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

    // --- Focus management + focus trap -----------------------------------------
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

    // --- Avatar fallback --------------------------------------------------------
    const [avatarErrored, setAvatarErrored] = useState(false);
    const displayName = partnerProfile?.displayName || 'Unknown Caller';
    const initials = useMemo(() => getInitials(displayName), [displayName]);
    const hasAvatarUrl = Boolean(partnerProfile?.avatarUrl) && !avatarErrored;

    useEffect(() => {
        setAvatarErrored(false);
    }, [partnerProfile?.avatarUrl]);

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

                {/* Structural Addition for Presentation Only */}
                <div className="title-group">
                    <h2 id="incoming-call-title">Incoming Call</h2>
                    <div className="call-type-indicator" aria-hidden="true" style={{ pointerEvents: 'none' }}>
                        <svg className="camera-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                        <span>Video Call</span>
                    </div>
                </div>

                <div className="caller-info">
                    {hasAvatarUrl ? (
                        <img
                            src={partnerProfile.avatarUrl}
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