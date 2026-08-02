import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, SectionHeader } from '../../../components/ui';

/**
 * TodayChecklist — "Today's Plans". Locally-toggleable checklist
 * cards (state resets on refresh — this is a UI prototype, no
 * persistence layer yet) with a small progress readout up top.
 */
export const TodayChecklist = ({ items }) => {
    const [plans, setPlans] = useState(items);
    const doneCount = plans.filter((p) => p.done).length;

    const toggle = (id) =>
        setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)));

    return (
        <GlassCard className="today-checklist">
            <SectionHeader
                title="Today's Plans"
                action={`${doneCount}/${plans.length} done`}
            />
            <ul className="today-checklist__list">
                {plans.map((plan, i) => (
                    <motion.li
                        key={plan.id}
                        className={`today-checklist__item${plan.done ? ' today-checklist__item--done' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.05 }}
                    >
                        <button
                            type="button"
                            className="today-checklist__check"
                            onClick={() => toggle(plan.id)}
                            aria-pressed={plan.done}
                            aria-label={plan.done ? `Mark ${plan.title} as not done` : `Mark ${plan.title} as done`}
                        >
                            {plan.done && (
                                <motion.svg
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3 }}
                                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                </motion.svg>
                            )}
                        </button>
                        <span className="today-checklist__icon" aria-hidden="true">{plan.icon}</span>
                        <span className="today-checklist__text">
                            <span className="today-checklist__title">{plan.title}</span>
                            <span className="today-checklist__time">{plan.time}</span>
                        </span>
                    </motion.li>
                ))}
            </ul>
        </GlassCard>
    );
};

export default TodayChecklist;
