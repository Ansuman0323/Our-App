import React, { useMemo, useState } from 'react';
import { PageBackground, EmptyState, GlassButton } from '../../../components/ui';
import { CategoryFilter } from '../components/CategoryFilter';
import { WishCard } from '../components/WishCard';
import { categories, wishes } from '../data/mockWishlist';

/**
 * Wishlist — a shared dream board. Entirely local mock data; swap
 * for `features/wishlist/api.js` once the backend exists.
 */
export const Wishlist = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const visibleWishes = useMemo(
        () =>
            activeCategory === 'all'
                ? wishes
                : wishes.filter((w) => w.category === activeCategory),
        [activeCategory]
    );

    return (
        <>
            <PageBackground />
            <div className="wishlist-page">
                <header className="wishlist-page__intro">
                    <span className="wishlist-page__eyebrow">Our Dream Board</span>
                    <h1 className="wishlist-page__title">Wishlist</h1>
                    <p className="wishlist-page__subtitle">
                        Every dream begins with one little wish.
                    </p>
                </header>

                <CategoryFilter
                    categories={categories}
                    activeId={activeCategory}
                    onSelect={setActiveCategory}
                />

                {visibleWishes.length > 0 ? (
                    <div className="wishlist-page__grid">
                        {visibleWishes.map((wish, i) => (
                            <WishCard key={wish.id} wish={wish} index={i} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="🌙"
                        title="Your next adventure is waiting."
                        subtitle="Nothing wished for here yet — that's an invitation, not an ending."
                    />
                )}

                <section className="wishlist-page__cta">
                    <p className="wishlist-page__cta-text">
                        Every forever begins with one moment.
                    </p>
                    <GlassButton variant="primary">Add a Wish</GlassButton>
                </section>
            </div>
        </>
    );
};

export default Wishlist;
