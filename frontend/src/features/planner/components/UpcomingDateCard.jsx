import React from 'react';
import { GlassCard, SectionHeader } from '../../../components/ui';

/**
 * UpcomingDateCard — "Upcoming Date" spotlight, styled like a warm
 * invitation/ticket rather than a plain list row.
 */
export const UpcomingDateCard = ({ date }) => (
    <GlassCard className="upcoming-date">
        <SectionHeader title="Upcoming Date" />
        <div className="upcoming-date__body">
            <span className="upcoming-date__icon" aria-hidden="true">{date.icon}</span>
            <div className="upcoming-date__info">
                <span className="upcoming-date__title">{date.title}</span>
                <span className="upcoming-date__meta">{date.date}</span>
                <span className="upcoming-date__meta upcoming-date__meta--muted">{date.location}</span>
            </div>
        </div>
    </GlassCard>
);

export default UpcomingDateCard;
