import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader } from '../../../components/ui';

/**
 * BucketList — a shared checklist with a soft progress bar. Toggling
 * is local-only (UI prototype, no persistence yet).
 */
export const BucketList = ({ items }) => {
    const [list, setList] = useState(items);
    const doneCount = list.filter((i) => i.done).length;
    const pct = Math.round((doneCount / list.length) * 100);

    const toggle = (id) =>
        setList((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

    return (
        <GlassCard className="bucket-list">
            <SectionHeader title="Bucket List" action={`${doneCount}/${list.length}`} />
            <div className="bucket-list__progress-track" aria-hidden="true">
                <motion.div
                    className="bucket-list__progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
            <ul className="bucket-list__items">
                {list.map((item) => (
                    <li key={item.id} className="bucket-list__item">
                        <button
                            type="button"
                            className={`bucket-list__check${item.done ? ' bucket-list__check--done' : ''}`}
                            onClick={() => toggle(item.id)}
                            aria-pressed={item.done}
                            aria-label={item.done ? `Mark ${item.title} as not done` : `Mark ${item.title} as done`}
                        >
                            {item.done && (
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                        <span className={`bucket-list__label${item.done ? ' bucket-list__label--done' : ''}`}>
                            {item.title}
                        </span>
                    </li>
                ))}
            </ul>
        </GlassCard>
    );
};

export default BucketList;
