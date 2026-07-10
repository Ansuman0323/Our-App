import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    // Placeholder: In the future, this will check AuthContext or Supabase session
    const isAuthenticated = false; // Forced false for Module 0

    if (!isAuthenticated) {
        // Redirect to login (or return null/loading state)
        // For now, we just pass through or render a placeholder
        return <div>Authentication required placeholder</div>;
    }

    return <Outlet />;
};