import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../../features/auth/pages/Login';
import { Signup } from '../../features/auth/pages/Signup';
import { CreateSpace } from '../../features/pairing/pages/CreateSpace';
import { JoinSpace } from '../../features/pairing/pages/JoinSpace';

// Import our new dedicated Dashboard module
import { Dashboard } from '../../features/dashboard/pages/Dashboard';
import { ChatPage } from '../../features/chat/pages/ChatPage';

export const router = createBrowserRouter([
    {
        // Unauthenticated shell: no header, no BottomNav.
        // Same paths as before ('/', '/login', '/signup').
        path: '/',
        element: <AuthLayout />,
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
        ],
    },
    {
        // Authenticated app shell: header + BottomNav.
        // Pathless layout route — children keep the exact same
        // absolute paths they had before ('/dashboard', '/chat', etc.).
        element: <AppLayout />,
        children: [
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
                    { path: 'chat', element: <ChatPage /> },
                ],
            },
        ],
    },
]);