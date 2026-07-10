import { createBrowserRouter } from 'react-router-dom';
import { GlobalLayout } from '../components/layouts/GlobalLayout';
import { ProtectedRoute } from '../components/routes/ProtectedRoute';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <GlobalLayout />,
        children: [
            {
                index: true,
                element: <div>Public Landing Page Placeholder</div>,
            },
            {
                path: 'auth',
                element: <div>Auth Routes Placeholder</div>,
            },
            // Protected Routes
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: 'dashboard',
                        element: <div>Dashboard Placeholder</div>,
                    },
                    {
                        path: 'chat',
                        element: <div>Chat Module Placeholder</div>,
                    },
                    // Future routes: /planner, /calendar, /memories, etc.
                ],
            },
        ],
    },
]);