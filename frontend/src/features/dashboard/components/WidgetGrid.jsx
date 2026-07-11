import React from 'react';
import { WidgetCard } from './WidgetCard';

export const WidgetGrid = ({ widgets }) => {
    const defaultWidgets = [
        { key: 'days_together', title: 'Days Together', icon: '❤️' },
        { key: 'latest_message', title: 'Latest Message', icon: '💬' },
        { key: 'upcoming_event', title: 'Upcoming Events', icon: '📅' },
        { key: 'today_tasks', title: "Today's Tasks", icon: '✅' },
        { key: 'recent_memory', title: 'Recent Memory', icon: '📸' },
        { key: 'wishlist', title: 'Wishlist', icon: '🎁' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultWidgets.map((w) => (
                <WidgetCard
                    key={w.key}
                    title={w.title}
                    icon={w.icon}
                    footer="Coming soon &rarr;"
                >
                    <span className="opacity-50">No data yet</span>
                </WidgetCard>
            ))}
        </div>
    );
};