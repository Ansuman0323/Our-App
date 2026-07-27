import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pairingApi } from '../api';

export const CreateSpace = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState(null);

    const handleCreate = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await pairingApi.createSpace();
            setInviteCode(response.space.invite_code);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'An unexpected error occurred while creating your space.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        window.location.href = '/dashboard';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#FFFAF8] overflow-hidden p-4 font-sans">
            {/* Subtle Floating Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#A78BFA] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 motion-safe:animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#FB7185] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 motion-safe:animate-pulse" style={{ animationDelay: '2s' }}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_16px_40px_rgba(15,23,42,0.06)] border border-white/60 p-8 sm:p-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] flex items-center justify-center shadow-sm border border-white">
                        <svg className="w-8 h-8 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-3">
                        Begin Your Journey
                    </h1>
                    <p className="text-[#64748B] text-[15px] leading-relaxed">
                        Create a private space where your memories, conversations, and dreams live together.
                    </p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50/80 text-red-600 text-sm rounded-[16px] border border-red-100 text-center backdrop-blur-sm">
                        {error}
                    </motion.div>
                )}

                {!inviteCode ? (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
                        <motion.button
                            variants={itemVariants}
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white text-[15px] font-semibold rounded-[20px] shadow-[0_8px_28px_rgba(99,102,241,0.22)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#FFFAF8] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Preparing Space...
                                </>
                            ) : (
                                'Create Our Space'
                            )}
                        </motion.button>

                        <motion.p variants={itemVariants} className="text-center text-[14px] text-[#64748B]">
                            Already have an invitation?{' '}
                            <Link to="/pairing/join" className="text-[#6366F1] font-semibold hover:text-[#A78BFA] transition-colors">
                                Join Space
                            </Link>
                        </motion.p>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                        <motion.div variants={itemVariants} className="text-center space-y-3">
                            <p className="text-[13px] font-semibold text-[#A78BFA] uppercase tracking-widest">
                                Your Special Code
                            </p>
                            <div className="bg-white/60 border border-white rounded-[24px] py-6 px-4 shadow-sm backdrop-blur-md">
                                <span className="text-4xl font-mono font-bold tracking-[0.2em] text-[#0F172A] select-all bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#A78BFA]">
                                    {inviteCode}
                                </span>
                            </div>
                            <p className="text-[13px] text-[#64748B]">
                                Share this with your partner to connect your accounts.
                            </p>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            onClick={handleContinue}
                            className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white text-[15px] font-semibold rounded-[20px] shadow-[0_8px_28px_rgba(99,102,241,0.22)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Enter Dashboard
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};