import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const Dashboard = () => {
    const { dbUser, isPaired } = useAuth();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">
                Welcome, {dbUser?.display_name || 'User'}!
            </h1>

            {isPaired ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">Your Space</h2>
                    <p className="text-slate-600 mb-6">You are paired and ready to chat.</p>

                    {/* The button that takes you to the chat module */}
                    <Link
                        to="/chat"
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-block"
                    >
                        Open Chat
                    </Link>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">Not Paired Yet</h2>
                    <p className="text-slate-600 mb-6">Create or join a space to start chatting.</p>
                    <div className="flex gap-4">
                        <Link
                            to="/pairing/create"
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Create Space
                        </Link>
                        <Link
                            to="/pairing/join"
                            className="bg-slate-100 text-slate-800 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                            Join Space
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};