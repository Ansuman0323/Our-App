import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * StoryTimeline — turns "Our Story" into the beginning of a narrative
 * instead of another widget grid: First Message → First Call → First
 * Memory → Today → Next Milestone, connected by a single soft line.
 *
 * No backend contract exists for relationship milestones yet, so this
 * stays a pure presentation component: it accepts an optional
 * `milestones` array (id, label, date, description, status) and falls
 * back to a fully-formed placeholder story when none is supplied —
 * "Today" is always the one lit, present-tense stop; everything
 * around it is honestly framed as not-yet-written rather than
 * inventing dates or events that haven't happened.
 *
 * status: 'done' | 'current' | 'upcoming'
 */
const DEFAULT_MILESTONES = [
    {
        id: 'first-message',
        label: 'First Message',
        description: 'Not written yet',
        status: 'upcoming',
    },
    {
        id: 'first-call',
        label: 'First Call',
        description: 'Waiting to happen',
        status: 'upcoming',
    },
    {
        id: 'first-memory',
        label: 'First Memory',
        description: 'Waiting to be made',
        status: 'upcoming',
    },
    {
        id: 'today',
        label: 'Today',
        description: 'Your story is here',
        status: 'current',
    },
    {
        id: 'next-milestone',
        label: 'Next Milestone',
        description: 'Still unwritten',
        status: 'upcoming',
    },
];

const nodeMotion = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.09 },
    }),
};

export const StoryTimeline = ({ milestones, title = 'Our Story', tagline }) => {
    const items = milestones && milestones.length > 0 ? milestones : DEFAULT_MILESTONES;
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="story-timeline">
            <div className="story-timeline__intro">
                <h3 className="story-timeline__title">{title}</h3>
                <p className="story-timeline__tagline">
                    {tagline || 'Every love story is made of small beginnings.'}
                </p>
            </div>

            <ol className="story-timeline__list">
                {items.map((m, i) => (
                    <motion.li
                        key={m.id}
                        className={`story-timeline__item story-timeline__item--${m.status}`}
                        custom={i}
                        variants={nodeMotion}
                        initial={prefersReducedMotion ? undefined : 'hidden'}
                        whileInView={prefersReducedMotion ? undefined : 'visible'}
                        viewport={{ once: true, margin: '-40px' }}
                    >
                        <span className="story-timeline__rail" aria-hidden="true">
                            <span className="story-timeline__node">
                                {m.status === 'current' && (
                                    <span className="story-timeline__node-pulse" aria-hidden="true" />
                                )}
                            </span>
                        </span>
                        <span className="story-timeline__content">
                            <span className="story-timeline__label">{m.label}</span>
                            <span className="story-timeline__description">
                                {m.date || m.description}
                            </span>
                        </span>
                    </motion.li>
                ))}
            </ol>
        </div>
    );
};

export default StoryTimeline;