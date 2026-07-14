import { useRef, useLayoutEffect, useEffect, useCallback } from 'react';

export const useAutoScroll = (messages, isFetchingTop) => {
    const scrollRef = useRef(null);
    const previousScrollHeight = useRef(0);
    const isScrolledToBottom = useRef(true);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        isScrolledToBottom.current = scrollHeight - scrollTop - clientHeight < 50;
    }, []);

    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        if (isFetchingTop) {
            previousScrollHeight.current = container.scrollHeight;
        } else if (previousScrollHeight.current > 0) {
            const heightDifference = container.scrollHeight - previousScrollHeight.current;
            container.scrollTop += heightDifference;
            previousScrollHeight.current = 0;
        } else if (isScrolledToBottom.current) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, isFetchingTop]);

    // FIX: Maintain bottom scroll when mobile keyboard opens/resizes container
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            if (isScrolledToBottom.current) {
                container.scrollTop = container.scrollHeight;
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    return { scrollRef, handleScroll, scrollToBottom };
};