import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../../../components/ui';

// Small deterministic "hand-placed" tilt per card index, so the strip
// doesn't look machine-generated but also never jumps around on
// re-render (no Math.random in render).
const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5];

const Polaroid = ({ item, index }) => {
    const tilt = TILTS[index % TILTS.length];
    const isEmpty = !item.image;

    return (
        <motion.figure
            className={`polaroid${isEmpty ? ' polaroid--empty' : ''}`}
            style={{ transform: `rotate(${tilt}deg)` }}
            initial={{ opacity: 0, y: 16, rotate: tilt - 4 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
            whileHover={{ y: -4, rotate: 0, transition: { duration: 0.2 } }}
        >
            <span className="polaroid__tape" aria-hidden="true" />
            <span className={`polaroid__photo${isEmpty ? ' polaroid__photo--empty' : ''}`}>
                {isEmpty ? (
                    <span aria-hidden="true" style={{ fontSize: 22 }}>🌸</span>
                ) : (
                    <img src={item.image} alt={item.title} loading="lazy" />
                )}
            </span>
            <figcaption className="polaroid__caption">
                <span>{isEmpty ? 'Your next memory belongs here.' : item.title}</span>
                {item.date && <span className="polaroid__date">{item.date}</span>}
            </figcaption>
        </motion.figure>
    );
};

/**
 * PolaroidShelf — a titled, horizontally-scrolling row of polaroids.
 * Used for "Recent Moments", "This Month", and each memory category
 * (Vacation, Funny Moments, Favorite Memories).
 */
export const PolaroidShelf = ({ title, icon, items, action }) => (
    <section className="memories-carousel">
        <SectionHeader
            title={icon ? `${icon}  ${title}` : title}
            action={action}
            className="memories-carousel__header"
        />
        <div className="memories-carousel__track">
            {items.map((item, i) => (
                <Polaroid key={item.id} item={item} index={i} />
            ))}
        </div>
    </section>
);

export default PolaroidShelf;
