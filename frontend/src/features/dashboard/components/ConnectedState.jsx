import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { StoryTimeline } from './StoryTimeline';
import { FloatingQuote } from './FloatingQuote';
import { MemoriesCarousel } from './MemoriesCarousel';
import { WidgetGrid } from './WidgetGrid';
import { GlassCard, SectionHeader, Divider } from '../../../components/ui';

export const ConnectedState = ({ data, loading, error }) => {
    // NOTE: response shape for `data` not yet provided (no schema or
    // sample response). We deliberately do not map fields into widgets
    // until the shape is known — inventing field names risks showing
    // wrong or broken content. WidgetGrid, StoryTimeline and
    // MemoriesCarousel all ship their own honestly-placeholdered
    // fallbacks for exactly this reason, so the page still reads as
    // complete before any of that data exists.
    void data;
    void loading;
    void error;

    return (
        <div className="connected-state">
            <DashboardHeader />

            {/* "Our Story" is now the timeline itself, not a section
                label sitting above a grid of features. */}
            <StoryTimeline />

            {/* A quote living directly on the background, not boxed in
                a card — a small pause between chapters, like turning a
                page in a diary rather than scrolling past another tile. */}
            <FloatingQuote />

            <MemoriesCarousel />

            <Divider />

            <SectionHeader title="Together" className="connected-state__section" />
            <WidgetGrid />

            <Divider />

            {/* Static closing note — purely decorative, not bound to any
                data, just a soft place for the eye to land at the bottom
                of the page. */}
            <div className="connected-state__footer">
                <span className="connected-state__footer-mark" aria-hidden="true">❝</span>
                <p className="connected-state__footer-text">
                    The best moments are the ones you share.
                </p>
            </div>
        </div>
    );
};