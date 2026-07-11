import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
            // The backend returns { message: "...", space: { space_id, invite_code } }
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
        // Force a hard navigation to dashboard to guarantee AuthContext 
        // re-fetches the updated `isPaired` status from the backend.
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
                        Create a Space
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm">
                        Generate a secure invite code to share with your partner.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                        {error}
                    </div>
                )}

                {!inviteCode ? (
                    <div className="space-y-6">
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-4 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate Invite Code'
                            )}
                        </button>

                        <p className="text-center text-sm text-zinc-500">
                            Partner already has a code?{' '}
                            <Link
                                to="/pairing/join"
                                className="text-zinc-900 font-medium hover:underline"
                            >
                                Join a Space
                            </Link>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-3">
                            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                                Your Invite Code
                            </p>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl py-6 px-4">
                                <span className="text-4xl font-mono font-bold tracking-[0.2em] text-zinc-900 select-all">
                                    {inviteCode}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Send this exactly as shown. Codes are case-sensitive.
                            </p>
                        </div>

                        <button
                            onClick={handleContinue}
                            className="w-full py-3 px-4 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};