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
    // We can't just `return null` the instant callState leaves INCOMING, or the
    // exit transition never gets a chance to run. `renderState` tracks the
    // component's own visual phase independently of the FSM state so we can
    // stay mounted just long enough to fade out.
    const [renderState, setRenderState] = useState(isIncoming ? 'visible' : 'hidden');
    const exitTimeoutRef = useRef(null);

    useEffect(() => {
        if (isIncoming) {
            if (exitTimeoutRef.current) {
                clearTimeout(exitTimeoutRef.current);
                exitTimeoutRef.current = null;
            }
            // Mount immediately, then flip to 'visible' on the next frame so the
            // CSS transition from the 'entering' state actually has something to
            // animate from.
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
    // try/finally guarantees isProcessing always clears, even if acceptCall /
    // rejectCall throws. We also reset it whenever the FSM (re)enters INCOMING,
    // covering the case where it briefly bounces back (e.g. accept failed
    // upstream and the caller is still ringing).
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'accept' | 'reject' | null

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
            // Presentation layer doesn't own error handling/business logic -
            // CallContext is expected to surface failures via callState. We only
            // guarantee the buttons come back to life.
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

        // REFINEMENT 3 decision: Escape is intentionally ignored.
        //
        // Rejecting a call is a destructive, irreversible action (a missed call
        // from another person). Escape is frequently pressed reflexively or by
        // accident, and unlike a form dialog, there's no "undo" - the caller has
        // already been told no. We only let Escape close things that can be
        // safely reopened; hanging up on someone doesn't qualify. The explicit
        // Reject button remains the only way to decline.
    }, []);

    // --- Avatar fallback --------------------------------------------------------
    const [avatarErrored, setAvatarErrored] = useState(false);
    const displayName = partnerProfile?.displayName || 'Unknown Caller';
    const initials = useMemo(() => getInitials(displayName), [displayName]);
    const hasAvatarUrl = Boolean(partnerProfile?.avatarUrl) && !avatarErrored;

    // Reset the "errored" flag if we get a new avatar URL to try.
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
                <h2 id="incoming-call-title">Incoming Call</h2>

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

                {/* Polite live region: announces processing state to screen readers
                    without interrupting them mid-sentence the way assertive would. */}
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