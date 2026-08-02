import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnniversaryCountdown — the planner's hero. A soft glowing ring
 * around a day count, echoing the WaitingState ring motif already
 * used elsewhere in the app so the "countdown" idiom feels familiar.
 */
export const AnniversaryCountdown = ({ data }) => (
    <motion.section
        className="anniversary-countdown"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
        <div className="anniversary-countdown__ring-wrap">
            <span className="anniversary-countdown__ring anniversary-countdown__ring--outer" aria-hidden="true" />
            <span className="anniversary-countdown__ring anniversary-countdown__ring--inner" aria-hidden="true" />
            <div className="anniversary-countdown__center">
                <span className="anniversary-countdown__days">{data.daysLeft}</span>
                <span className="anniversary-countdown__unit">days to go</span>
            </div>
        </div>
        <div className="anniversary-countdown__body">
            <span className="anniversary-countdown__label">{data.label}</span>
            <span className="anniversary-countdown__date">{data.date}</span>
            <p className="anniversary-countdown__note">{data.note}</p>
        </div>
    </motion.section>
);

export default AnniversaryCountdown;
