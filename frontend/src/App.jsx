import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './components/routes/index';
import { Toaster } from 'react-hot-toast';
import { CallProvider } from "./features/calls/contexts/CallContext";

export default function App() {
  console.log("API:", import.meta.env.VITE_API_URL);
  console.log("SOCKET:", import.meta.env.VITE_SOCKET_URL);
  return (
    <AuthProvider>
      <CallProvider>
        {/* GLOBAL TOAST NOTIFICATION SYSTEM */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#334155', // text-slate-700
              fontWeight: '500',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              borderRadius: '9999px', // Fully rounded pills
              padding: '12px 24px',
            },
            success: {
              iconTheme: {
                primary: '#4f46e5', // indigo-600
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // red-500
                secondary: '#ffffff',
              },
            },
          }}
        />

        <RouterProvider router={router} />
      </CallProvider>
    </AuthProvider>
  );
}
