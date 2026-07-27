import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = () => {
    const { user, loading, isPaired } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-pulse text-lg font-semibold text-slate-500">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isPairingRoute = location.pathname.startsWith('/pairing');

    // By the time `loading` is false, fetchDbUser has already resolved
    // both dbUser and isPaired together, so isPaired is a real boolean
    // here, never the initial null.
    if (isPaired === false && !isPairingRoute) {
        return <Navigate to="/pairing/create" replace />;
    }

    if (isPaired === true && isPairingRoute) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};