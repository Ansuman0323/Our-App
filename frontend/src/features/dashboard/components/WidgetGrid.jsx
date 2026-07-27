import React from 'react';
import { WidgetCard } from './WidgetCard';

const DEFAULT_WIDGETS = [
    {
        key: 'days_together',
        title: 'Our Journey',
        icon: '❤️',
        variant: 'gradient',
        value: 'Waiting for your first shared milestone...',
    },
    {
        key: 'latest_message',
        title: 'Our Last Conversation',
        icon: '💌',
        variant: 'rose',
        value: 'Your beautiful conversations will appear here.',
    },
    {
        key: 'recent_memory',
        title: 'Our Latest Memory',
        icon: '📸',
        variant: 'indigo',
        value: 'Your first shared memory will live here.',
    },
    {
        key: 'today_tasks',
        title: 'Today, Together',
        icon: '✅',
        variant: 'emerald',
        value: "What you plan together will show up here.",
    },
    {
        // Renamed from "Shared Dreams" (plant icon) to match what the
        // key itself already says — a wishlist, not a dreams board.
        // See chat notes if the dream/plant framing is preferred instead.
        key: 'wishlist',
        title: 'Little Wishes',
        icon: '🎁',
        variant: 'peach',
        value: 'Start planning something together.',
    },
    {
        key: 'upcoming_event',
        title: 'Our Next Adventure',
        icon: '📅',
        variant: 'blue',
        value: 'Your next moment together will appear here.',
    },
];

export const WidgetGrid = ({ widgets }) => {
    const items = widgets && widgets.length > 0 ? widgets : DEFAULT_WIDGETS;

    return (
        <div className="widget-grid">
            {items.map((w, i) => (
                <WidgetCard
                    key={w.key}
                    title={w.title}
                    icon={w.icon}
                    variant={w.variant}
                    index={i}
                    footer={w.footer}
                    // The first widget is rendered as the featured/hero
                    // tile (full-width, larger) — the rest sit in the
                    // compact 2-column grid.
                    layout={i === 0 ? 'hero' : 'default'}
                >
                    {w.value ?? 'Our first memory together will bloom here.'}
                </WidgetCard>
            ))}
        </div>
    );
};