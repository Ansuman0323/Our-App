import React from 'react';
import { PageBackground, Divider, SectionHeader, GlassButton } from '../../../components/ui';
import { FeaturedMemory } from '../components/FeaturedMemory';
import { MemoryTimeline } from '../components/MemoryTimeline';
import { PolaroidShelf } from '../components/PolaroidShelf';
import {
    featuredMemory,
    recentMoments,
    memoryTimeline,
    thisMonth,
    memoryCollections,
} from '../data/mockMemories';

/**
 * Memories — a romantic scrapbook. Entirely local mock data for now;
 * swap the imports above for a real `features/memories/api.js` once
 * the backend exists. No fetch, no sockets, no loading/error states
 * needed here on purpose — this page always has something to show.
 */
export const Memories = () => {
    return (
        <>
            <PageBackground />
            <div className="memories-page">
                <header className="memories-page__intro">
                    <span className="memories-page__eyebrow">Our Scrapbook</span>
                    <h1 className="memories-page__title">Memories</h1>
                    <p className="memories-page__subtitle">
                        Every little moment, kept somewhere safe.
                    </p>
                </header>

                <FeaturedMemory memory={featuredMemory} />

                <PolaroidShelf
                    title="Recent Moments"
                    items={recentMoments}
                    action="See all"
                />

                <Divider />

                <MemoryTimeline items={memoryTimeline} />

                <Divider />

                <PolaroidShelf title="This Month" icon="📖" items={thisMonth} />

                {memoryCollections.map((collection) => (
                    <PolaroidShelf
                        key={collection.id}
                        title={collection.title}
                        icon={collection.icon}
                        items={collection.items}
                    />
                ))}

                <section className="memories-page__cta">
                    <span className="memories-page__cta-flower" aria-hidden="true">🌷</span>
                    <p className="memories-page__cta-text">
                        Your next memory belongs here.
                    </p>
                    <GlassButton variant="primary">Add a Memory</GlassButton>
                </section>
            </div>
        </>
    );
};

export default Memories;
