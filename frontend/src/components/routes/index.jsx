import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GlobalLayout } from '../layouts/GlobalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../../features/auth/pages/Login';
import { Signup } from '../../features/auth/pages/Signup';
import { useAuth } from '../../contexts/AuthContext';

// Simple Dashboard placeholder with Logout for testing
const DashboardPlaceholder = () => {
    const { dbUser, logout } = useAuth();
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold">Dashboard Placeholder</h2>
            <p className="mt-4">Welcome, {dbUser?.display_name || 'User'}!</p>
            <button onClick={logout} className="mt-6 bg-red-500 text-white px-4 py-2 rounded">
                Log Out
            </button>
        </div>
    );
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <GlobalLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'signup',
                element: <Signup />,
            },
            // Protected Routes
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: 'dashboard',
                        element: <DashboardPlaceholder />,
                    },
                ],
            },
        ],
    },
]);