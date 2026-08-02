import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

/**
 * ChatOverlayContext
 * ---------------------------------------------------------------------
 * Small, additive coordination layer so that only ONE chat overlay
 * (message context menu, mobile action sheet, or the emoji/GIF popover)
 * can ever be open at a time, and so the background (message list,
 * header, composer) is consistently locked/dimmed while any of them
 * are open.
 *
 * This does NOT touch sockets, routing, or message business logic —
 * it purely coordinates UI overlay visibility.
 * ---------------------------------------------------------------------
 */

const ChatOverlayContext = createContext(null);

export const OVERLAY_TYPES = {
    CONTEXT_MENU: 'contextMenu',
    BOTTOM_SHEET: 'bottomSheet',
    EMOJI_PICKER: 'emojiPicker',
};

export const ChatOverlayProvider = ({ children }) => {
    // null | 'contextMenu' | 'bottomSheet' | 'emojiPicker'
    const [activeOverlay, setActiveOverlay] = useState(null);

    const openOverlay = useCallback((type) => {
        setActiveOverlay(type);
    }, []);

    const closeOverlay = useCallback(() => {
        setActiveOverlay(null);
    }, []);

    // Lock background scroll + dim/blur the chat surface while any
    // overlay is open. Toggled on <body> so it works regardless of
    // where in the tree the overlay itself is portaled to.
    useEffect(() => {
        if (activeOverlay) {
            document.body.classList.add('chat-overlay-lock');
        } else {
            document.body.classList.remove('chat-overlay-lock');
        }
        return () => document.body.classList.remove('chat-overlay-lock');
    }, [activeOverlay]);

    return (
        <ChatOverlayContext.Provider value={{ activeOverlay, openOverlay, closeOverlay }}>
            {children}
        </ChatOverlayContext.Provider>
    );
};

export const useChatOverlay = () => {
    const ctx = useContext(ChatOverlayContext);
    if (!ctx) {
        // Fail-safe: if a component is ever rendered outside the provider,
        // don't crash — just behave as if no overlay coordination exists.
        return { activeOverlay: null, openOverlay: () => { }, closeOverlay: () => { } };
    }
    return ctx;
};