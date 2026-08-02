import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EmojiPickerPopover } from './EmojiPickerPopover'; // Your existing emoji picker
import { giphyService } from '../services/giphyService';

// Reusable Search Input
const GifSearch = ({ query, setQuery, placeholder }) => (
    <div className="p-2 shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
        <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-none rounded-full py-1.5 pl-9 pr-4 text-sm outline-none transition-shadow"
                style={{
                    background: 'var(--surface-glass)',
                    color: 'var(--text-primary)',
                }}
            />
        </div>
    </div>
);

// Reusable Masonry Grid with Infinite Scroll
const MediaGrid = ({ items, isLoading, onSelect, hasMore, loadMore }) => {
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, loadMore]);

    return (
        <div
            className="
        flex-1
        overflow-y-auto
        p-2
        grid
        grid-cols-2
        gap-2
        content-start
        min-h-0
    "
        >
            {items.map((item, index) => {
                const isLast = items.length === index + 1;
                return (
                    <div
                        key={item.id}
                        ref={isLast ? lastElementRef : null}
                        onClick={() => onSelect(item)}
                        className="relative rounded-lg overflow-hidden cursor-pointer group pb-[100%] transition-shadow"
                        style={{ background: 'var(--surface-glass)' }}
                    >
                        <img
                            src={item.previewUrl}
                            alt={item.title}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                );
            })}

            {/* Loading Skeletons */}
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={`skel-${i}`} className="rounded-lg pb-[100%] animate-pulse" style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}></div>
            ))}

            {!isLoading && items.length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No results found
                </div>
            )}
        </div>
    );
};

export const EmojiGifPicker = ({
    onEmojiSelect,
    onGifSelect,
    onStickerSelect,
    isMobile,
    className = ""
}) => {
    const [activeTab, setActiveTab] = useState('emoji'); // 'emoji' | 'gif' | 'sticker'

    // Media State
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const LIMIT = 20;

    // Debounce the search query
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    // Reset items when tab or query changes
    useEffect(() => {
        if (activeTab === 'emoji') return;
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, debouncedQuery]);

    const fetchData = async (isNewSearch = false) => {
        if (activeTab === 'emoji') return;

        setIsLoading(true);
        try {
            const currentOffset = isNewSearch ? 0 : offset;
            let results = [];

            if (activeTab === 'gif') {
                results = debouncedQuery
                    ? await giphyService.searchGifs(debouncedQuery, currentOffset, LIMIT)
                    : await giphyService.getTrendingGifs(currentOffset, LIMIT);
            } else if (activeTab === 'sticker') {
                results = debouncedQuery
                    ? await giphyService.searchStickers(debouncedQuery, currentOffset, LIMIT)
                    : await giphyService.getTrendingStickers(currentOffset, LIMIT);
            }

            setItems(prev => isNewSearch ? results : [...prev, ...results]);
            setOffset(currentOffset + LIMIT);
            setHasMore(results.length === LIMIT);
        } catch (error) {
            console.error("Failed to fetch media", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchData(false);
    };

    return (
        <div
            className={`flex flex-col overflow-hidden w-[320px] md:w-[350px] max-w-[calc(100vw-24px)] h-[420px] rounded-2xl ${className}`}
            style={{
                background: 'var(--surface-glass-strong)',
                backdropFilter: 'blur(var(--blur-lg)) saturate(160%)',
                WebkitBackdropFilter: 'blur(var(--blur-lg)) saturate(160%)',
                border: '1px solid var(--surface-border)',
                boxShadow: 'var(--shadow-floating)',
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >

            {/* TABS HEADER */}
            <div className="flex items-center justify-around shrink-0" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                {[
                    { id: 'emoji', label: '😀 Emoji' },
                    { id: 'gif', label: '🎞 GIF' },
                    { id: 'sticker', label: '🧸 Sticker' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== activeTab) setQuery('');
                        }}
                        className="flex-1 py-2.5 text-xs font-bold transition-colors"
                        style={
                            activeTab === tab.id
                                ? { color: 'var(--dream-pink)', borderBottom: '2px solid var(--dream-pink)', background: 'var(--surface-glass)' }
                                : { color: 'var(--text-muted)' }
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="flex flex-col flex-1 relative overflow-hidden min-h-0">
                {activeTab === 'emoji' ? (
                    // We render your original picker seamlessly
                    <EmojiPickerPopover
                        onSelect={onEmojiSelect}
                        isMobile={isMobile}
                        className="static shadow-none border-none !w-full"
                    />
                ) : (
                    <>
                        <GifSearch
                            query={query}
                            setQuery={setQuery}
                            placeholder={`Search ${activeTab === 'gif' ? 'GIFs' : 'Stickers'}...`}
                        />
                        <MediaGrid
                            items={items}
                            isLoading={isLoading}
                            onSelect={(item) => {
                                if (activeTab === "gif") {
                                    onGifSelect(item);
                                } else {
                                    onStickerSelect(item);
                                }
                            }}
                            hasMore={hasMore}
                            loadMore={handleLoadMore}
                        />
                    </>
                )}
            </div>
        </div>
    );
};