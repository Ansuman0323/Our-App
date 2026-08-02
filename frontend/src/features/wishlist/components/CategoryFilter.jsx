import React from 'react';
import { motion } from 'framer-motion';

/**
 * CategoryFilter — horizontal scrolling pill tabs for the wishlist's
 * dream-board categories.
 */
export const CategoryFilter = ({ categories, activeId, onSelect }) => (
    <div className="category-filter" role="tablist" aria-label="Wishlist categories">
        {categories.map((cat) => {
            const isActive = cat.id === activeId;
            return (
                <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`category-filter__pill${isActive ? ' category-filter__pill--active' : ''}`}
                    onClick={() => onSelect(cat.id)}
                >
                    {isActive && (
                        <motion.span
                            layoutId="category-filter-active"
                            className="category-filter__glow"
                            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                            aria-hidden="true"
                        />
                    )}
                    <span className="category-filter__icon" aria-hidden="true">{cat.icon}</span>
                    <span className="category-filter__label">{cat.label}</span>
                </button>
            );
        })}
    </div>
);

export default CategoryFilter;
