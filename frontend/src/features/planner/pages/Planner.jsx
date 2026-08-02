import React from 'react';
import { PageBackground, Divider } from '../../../components/ui';
import { AnniversaryCountdown } from '../components/AnniversaryCountdown';
import { TodayChecklist } from '../components/TodayChecklist';
import { UpcomingDateCard } from '../components/UpcomingDateCard';
import { StickyNoteBoard } from '../components/StickyNoteBoard';
import { OccasionTimeline } from '../components/OccasionTimeline';
import { BucketList } from '../components/BucketList';
import { DestinationCarousel } from '../components/DestinationCarousel';
import {
    anniversary,
    todaysPlans,
    upcomingDate,
    weekendIdeas,
    specialOccasions,
    bucketList,
    dreamDestinations,
} from '../data/mockPlans';

/**
 * Planner — a romantic planning space. Entirely local mock data;
 * swap for `features/planner/api.js` once the backend exists.
 */
export const Planner = () => {
    return (
        <>
            <PageBackground />
            <div className="planner-page">
                <header className="planner-page__intro">
                    <span className="planner-page__eyebrow">Plan Something Beautiful</span>
                    <h1 className="planner-page__title">Planner</h1>
                </header>

                <AnniversaryCountdown data={anniversary} />

                <TodayChecklist items={todaysPlans} />

                <UpcomingDateCard date={upcomingDate} />

                <Divider />

                <StickyNoteBoard items={weekendIdeas} />

                <DestinationCarousel items={dreamDestinations} />

                <Divider />

                <BucketList items={bucketList} />

                <OccasionTimeline items={specialOccasions} />
            </div>
        </>
    );
};

export default Planner;
