import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pairingApi } from '../../pairing/api';
import { GlassCard, EmptyState } from '../../../components/ui';

export const WaitingState = () => {
    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const data = await pairingApi.getInvite();
                setInviteData(data);
            } catch (err) {
                setError("Failed to load invite code");
            } finally {
                setLoading(false);
            }
        };
        fetchInvite();
    }, []);

    const handleCopy = () => {
        if (inviteData?.invite_code) {
            navigator.clipboard.writeText(inviteData.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share && inviteData?.invite_code) {
            try {
                await navigator.share({
                    title: 'Join my Space',
                    text: `Use my invite code to join our space: ${inviteData.invite_code}`
                });
            } catch (err) {
                console.log("Share failed", err);
            }
        } else {
            handleCopy();
        }
    };

    const handleRegenerate = async () => {
        try {
            setLoading(true);
            const data = await pairingApi.regenerateInvite();
            setInviteData(data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to regenerate code.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <GlassCard className="waiting-state">
                <EmptyState icon="🌌" title="Preparing your shared world" subtitle="This will only take a second." />
            </GlassCard>
        );
    }
    if (error) {
        return (
            <GlassCard className="waiting-state">
                <div className="waiting-state__status waiting-state__status--error">{error}</div>
            </GlassCard>
        );
    }

    return (
        <GlassCard as="div" className="waiting-state">
            <div className="waiting-state__hero" aria-hidden="true">
                <span className="waiting-state__ring waiting-state__ring--outer" />
                <span className="waiting-state__ring waiting-state__ring--inner" />
                <div className="waiting-state__icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 4v16m8-8H4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>

            <h2 className="waiting-state__title">Preparing your shared world</h2>
            <p className="waiting-state__subtitle">
                Share this code with your partner to connect your space.
            </p>

            <motion.button
                type="button"
                className="waiting-state__code"
                onClick={handleCopy}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                whileTap={{ scale: 0.97 }}
            >
                {inviteData?.invite_code}
            </motion.button>

            <div className="waiting-state__actions">
                <motion.button
                    type="button"
                    onClick={handleShare}
                    className="waiting-state__btn waiting-state__btn--primary"
                    whileTap={{ scale: 0.96 }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {copied ? (
                            <motion.span
                                key="copied"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="waiting-state__btn-label"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copied!
                            </motion.span>
                        ) : (
                            <motion.span
                                key="share"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="waiting-state__btn-label"
                            >
                                Share Code
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
                <motion.button
                    type="button"
                    onClick={handleRegenerate}
                    className="waiting-state__btn waiting-state__btn--secondary"
                    whileTap={{ scale: 0.96 }}
                >
                    Regenerate
                </motion.button>
            </div>
        </GlassCard>
    );
};