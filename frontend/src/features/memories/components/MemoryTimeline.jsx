import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader } from '../../../components/ui';

/**
 * MemoryTimeline — "Memory Timeline" section. Reuses the dashboard's
 * story-timeline visual grammar (done / current / upcoming nodes) so
 * the app's one narrative device stays consistent across pages.
 */
export const MemoryTimeline = ({ items }) => (
    <GlassCard className="memory-timeline-card">
        <SectionHeader title="Memory Timeline" />
        <p className="memory-timeline__tagline">Every chapter, in order.</p>
        <ol className="story-timeline__list memory-timeline__list">
            {items.map((item, i) => (
                <motion.li
                    key={item.id}
                    className={`story-timeline__item story-timeline__item--${item.state}`}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="story-timeline__rail">
                        <span className="story-timeline__node">
                            {item.state === 'current' && <span className="story-timeline__node-pulse" aria-hidden="true" />}
                        </span>
                    </span>
                    <span className="story-timeline__content">
                        <span className="story-timeline__label">{item.label}</span>
                        <span className="story-timeline__description">{item.description}</span>
                        <span className="memory-timeline__date">{item.date}</span>
                    </span>
                </motion.li>
            ))}
        </ol>
    </GlassCard>
);

export default MemoryTimeline;
