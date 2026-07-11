import React from 'react';
import { DashboardHeader } from './DashboardHeader';
import { WidgetGrid } from './WidgetGrid';

export const ConnectedState = ({ widgets }) => {
    return (
        <div>
            <DashboardHeader />
            <WidgetGrid widgets={widgets} />
        </div>
    );
};