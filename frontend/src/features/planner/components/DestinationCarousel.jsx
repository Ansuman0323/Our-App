import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../../../components/ui';

/**
 * DestinationCarousel — "Dream Destinations". A horizontal strip of
 * postcard-style cards.
 */
export const DestinationCarousel = ({ items }) => (
    <section className="destination-carousel">
        <SectionHeader title="Dream Destinations" />
        <div className="destination-carousel__track">
            {items.map((item, i) => (
                <motion.figure
                    key={item.id}
                    className="destination-card"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4 }}
                >
                    <img className="destination-card__photo" src={item.image} alt={item.title} loading="lazy" />
                    <span className="destination-card__scrim" aria-hidden="true" />
                    <figcaption className="destination-card__caption">
                        <span className="destination-card__title">{item.title}</span>
                        <span className="destination-card__subtitle">{item.subtitle}</span>
                    </figcaption>
                </motion.figure>
            ))}
        </div>
    </section>
);

export default DestinationCarousel;
