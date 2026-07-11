import React, { useState, useEffect } from 'react';
import { pairingApi } from '../../pairing/api';

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

    if (loading) return <div className="py-20 text-center text-sm font-medium text-slate-400 animate-pulse">Loading invite details...</div>;
    if (error) return <div className="py-20 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-indigo-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Waiting for your partner</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Share this code with your partner to connect your accounts.</p>

            <div
                className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100 mb-8 w-full max-w-xs mx-auto cursor-pointer group hover:border-indigo-100 transition-colors"
                onClick={handleCopy}
            >
                <span className="text-4xl font-mono font-bold tracking-widest text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {inviteData?.invite_code}
                </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
                <button onClick={handleShare} className="flex-1 bg-slate-900 text-white rounded-xl py-3 px-4 font-medium hover:bg-slate-800 transition-colors shadow-sm">
                    {copied ? 'Copied!' : 'Share Code'}
                </button>
                <button onClick={handleRegenerate} className="flex-1 bg-white text-slate-700 rounded-xl py-3 px-4 font-medium border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                    Regenerate
                </button>
            </div>
        </div>
    );
};