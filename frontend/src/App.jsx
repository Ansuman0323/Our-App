import React, { useCallback, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './components/routes/index';
import { Toaster } from 'react-hot-toast';
import { CallProvider } from './features/calls/contexts/CallContext';
import SplashScreen from './components/splash/SplashScreen';
import { useBackendHealth } from './components/splash/useBackendHealth';

export default function App() {
  console.log("API:", import.meta.env.VITE_API_URL);
  console.log("SOCKET:", import.meta.env.VITE_SOCKET_URL);

  const { isReady, statusMessage } = useBackendHealth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashExitComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {/*
        The real app mounts as soon as the backend responds. It sits
        UNDER the splash while the splash fades out, so there's no
        blank flash and no hard cut — just the splash dissolving to
        reveal the app that's already there.
      */}
      {isReady && (
        <AuthProvider>
          <CallProvider>
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: '500',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                },
                success: {
                  iconTheme: { primary: '#4f46e5', secondary: '#ffffff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                },
              }}
            />
            <RouterProvider router={router} />
          </CallProvider>
        </AuthProvider>
      )}

      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            ready={isReady}
            statusMessage={statusMessage}
            onExitComplete={handleSplashExitComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}