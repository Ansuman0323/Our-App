import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader } from '../../../components/ui';

/**
 * OccasionTimeline — "Special Occasions". A vertical run of cards
 * (birthdays, celebrations, anniversaries) rather than a plain list.
 */
export const OccasionTimeline = ({ items }) => (
    <GlassCard className="occasion-timeline">
        <SectionHeader title="Special Occasions" />
        <ul className="occasion-timeline__list">
            {items.map((item, i) => (
                <motion.li
                    key={item.id}
                    className="occasion-timeline__item"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                    <span className="occasion-timeline__icon" aria-hidden="true">{item.icon}</span>
                    <span className="occasion-timeline__title">{item.title}</span>
                    <span className="occasion-timeline__date">{item.date}</span>
                </motion.li>
            ))}
        </ul>
    </GlassCard>
);

export default OccasionTimeline;
