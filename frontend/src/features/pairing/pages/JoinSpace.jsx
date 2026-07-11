import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { pairingApi } from '../api';

export const JoinSpace = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        // Automatically uppercase and remove whitespace as the user types
        const sanitized = e.target.value.toUpperCase().replace(/\s/g, '');
        if (sanitized.length <= 8) {
            setCode(sanitized);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();

        if (code.length !== 8) {
            setError('Invite code must be exactly 8 characters.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await pairingApi.joinSpace(code);
            // Force a hard navigation to dashboard to guarantee AuthContext 
            // re-fetches the updated `isPaired` status from the backend.
            window.location.href = '/dashboard';
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'An unexpected error occurred while joining the space.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
                        Join a Space
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm">
                        Enter the 8-character invite code from your partner.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center animate-in fade-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
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
                            className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-2xl font-mono font-bold tracking-[0.2em] text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length !== 8}
                        className="w-full flex items-center justify-center py-3 px-4 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Joining...
                            </>
                        ) : (
                            'Join Space'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-500">
                    Need to make your own?{' '}
                    <Link
                        to="/pairing/create"
                        className="text-zinc-900 font-medium hover:underline"
                    >
                        Create a Space
                    </Link>
                </p>
            </div>
        </div>
    );
};