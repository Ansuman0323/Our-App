import React from 'react';
import { WidgetCard } from './WidgetCard';

// Each widget carries its own `layout` now, instead of every card past
// the first sharing one compact shape — this is what gives the grid
// rhythm: one hero, one quote-style tile, then a settled run of small,
// specific, personal widgets rather than generic "feature" tiles.
// Photo/memory duty now belongs to MemoriesCarousel, so it's no longer
// duplicated here as a 'wide' card.
const DEFAULT_WIDGETS = [
    {
        key: 'days_together',
        title: 'Our Journey',
        icon: '❤️',
        variant: 'gradient',
        layout: 'hero',
        value: 'The first chapter of your story is about to begin.',
    },
    {
        key: 'latest_message',
        title: 'Love Letters',
        icon: '💌',
        variant: 'rose',
        layout: 'quote',
        value: 'Every love story deserves to be written.',
    },
    {
        key: 'this_day',
        title: 'This Day Together',
        icon: '📆',
        variant: 'indigo',
        layout: 'default',
        value: 'Your journey together starts today.',
    },
    {
        key: 'our_song',
        title: 'Our Song',
        icon: '🎵',
        variant: 'lavender',
        layout: 'default',
        value: 'Add the song that\u2019s yours.',
    },
    {
        key: 'streak',
        title: 'Relationship Streak',
        icon: '💖',
        variant: 'rose',
        layout: 'default',
        value: 'Every day you show up counts.',
    },
    {
        key: 'mood',
        title: 'Tonight Together',
        icon: '🌙',
        variant: 'blue',
        layout: 'default',
        value: 'How are you both feeling tonight?',
    },
    {
        key: 'upcoming_event',
        title: 'Countdown',
        icon: '📅',
        variant: 'emerald',
        layout: 'default',
        value: 'Your next date is waiting.',
    },
    {
        key: 'wishlist',
        title: 'Dream Gifts',
        icon: '🎁',
        variant: 'peach',
        layout: 'default',
        value: 'Every dream begins with one little wish.',
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
                    image={w.image}
                    variant={w.variant}
                    index={i}
                    footer={w.footer}
                    // Falls back to the old hero-first/compact-rest
                    // behavior if a caller passes widgets with no
                    // `layout` field of their own.
                    layout={w.layout ?? (i === 0 ? 'hero' : 'default')}
                >
                    {w.value ?? 'Our first memory together will bloom here.'}
                </WidgetCard>
            ))}
        </div>
    );
};