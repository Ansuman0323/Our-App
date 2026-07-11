import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GlobalLayout } from '../layouts/GlobalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../../features/auth/pages/Login';
import { Signup } from '../../features/auth/pages/Signup';
import { CreateSpace } from '../../features/pairing/pages/CreateSpace';
import { JoinSpace } from '../../features/pairing/pages/JoinSpace';

// Import our new dedicated Dashboard module
import { Dashboard } from '../../features/dashboard/pages/Dashboard';

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
            // Protected Routes (Must be logged in to access)
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: 'dashboard',
                        element: <Dashboard />, // The real Dashboard is now mounted here!
                    },
                    {
                        path: 'pairing/create',
                        element: <CreateSpace />,
                    },
                    {
                        path: 'pairing/join',
                        element: <JoinSpace />,
                    },
                ],
            },
        ],
    },
]);