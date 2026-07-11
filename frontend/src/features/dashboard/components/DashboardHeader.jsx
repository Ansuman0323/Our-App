import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export const DashboardHeader = () => {
    const { dbUser, logout } = useAuth();

    return (
        <div className="mb-8 flex justify-between items-start">
            <div>
                <p className="text-slate-500 font-medium text-sm">Welcome back</p>
                <h2 className="text-3xl font-bold tracking-tight">{dbUser?.display_name || 'User'}</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold mt-3 ring-1 ring-green-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Space Connected
                </span>
            </div>
            <button
                onClick={logout}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
                Log out
            </button>
        </div>
    );
};