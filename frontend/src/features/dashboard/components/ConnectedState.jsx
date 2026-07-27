import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { WidgetGrid } from './WidgetGrid';

export const ConnectedState = ({ data, loading, error }) => {
    // NOTE: response shape for `data` not yet provided (no schema or
    // sample response). We deliberately do not map fields into widgets
    // until the shape is known — inventing field names risks showing
    // wrong or broken content. WidgetGrid's existing placeholder cards
    // are the graceful fallback for loading, error, and unmapped-data
    // states alike.
    void data;
    void loading;
    void error;

    return (
        <div className="connected-state">
            <DashboardHeader />
            <WidgetGrid />

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