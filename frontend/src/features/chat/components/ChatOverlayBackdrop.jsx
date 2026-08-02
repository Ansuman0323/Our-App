import { createPortal } from 'react-dom';
import { useChatOverlay } from '../contexts/ChatOverlayContext';

// Single shared dimmed backdrop for every chat overlay (context menu,
// mobile action sheet, emoji/GIF popover). Sits at the base of the
// overlay z-index stack (10000) so any overlay content rendered above
// it — regardless of which one — is dismissed by tapping outside.
export const ChatOverlayBackdrop = () => {
    const { activeOverlay, closeOverlay } = useChatOverlay();

    if (!activeOverlay) return null;

    return createPortal(
        <div
            className="chat-overlay-backdrop"
            onClick={closeOverlay}
            aria-hidden="true"
        />,
        document.body
    );
};