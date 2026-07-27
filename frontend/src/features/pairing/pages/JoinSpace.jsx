import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pairingApi } from '../api';

export const JoinSpace = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const sanitized = e.target.value.toUpperCase().replace(/\s/g, '');
        if (sanitized.length <= 8) {
            setCode(sanitized);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();

        if (code.length !== 8) {
            setError('The invitation code must be exactly 8 characters.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await pairingApi.joinSpace(code);
            window.location.href = '/dashboard';
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'An unexpected error occurred while connecting.'
            );
        } finally {
            setLoading(false);
        }
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
            <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-[#FB7185] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 motion-safe:animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#6366F1] rounded-full mix-blend-multiply filter blur-[100px] opacity-15 motion-safe:animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_16px_40px_rgba(15,23,42,0.06)] border border-white/60 p-8 sm:p-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF1F2] to-[#FDF2F8] flex items-center justify-center shadow-sm border border-white">
                        <svg className="w-8 h-8 text-[#FB7185]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-3">
                        Join Your Space
                    </h1>
                    <p className="text-[#64748B] text-[15px] leading-relaxed">
                        Enter the invitation code to seamlessly connect your worlds.
                    </p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50/80 text-red-600 text-sm rounded-[16px] border border-red-100 text-center backdrop-blur-sm">
                        {error}
                    </motion.div>
                )}

                <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleJoin} className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <label htmlFor="inviteCode" className="sr-only">
                            Invite Code
                        </label>
                        <input
                            id="inviteCode"
                            type="text"
                            value={code}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="e.g. A1B2C3D4"
                            className="w-full px-4 h-16 bg-white/50 border border-white rounded-[20px] text-center text-[22px] font-mono font-bold tracking-[0.2em] text-[#0F172A] placeholder:text-[#CBD5E1] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#A78BFA] focus:bg-white/80 transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    </motion.div>

                    <motion.button
                        variants={itemVariants}
                        type="submit"
                        disabled={loading || code.length !== 8}
                        className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white text-[15px] font-semibold rounded-[20px] shadow-[0_8px_28px_rgba(99,102,241,0.22)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#FFFAF8] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Connecting...
                            </>
                        ) : (
                            'Join Space'
                        )}
                    </motion.button>
                </motion.form>

                <motion.p variants={itemVariants} initial="hidden" animate="show" className="mt-6 text-center text-[14px] text-[#64748B]">
                    Want to start fresh?{' '}
                    <Link to="/pairing/create" className="text-[#FB7185] font-semibold hover:text-[#F43F5E] transition-colors">
                        Create a Space
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
};