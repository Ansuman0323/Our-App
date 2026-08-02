import React, { useCallback, useRef, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './components/routes/index';
import { Toaster } from 'react-hot-toast';
import { CallProvider } from './features/calls/contexts/CallContext';
import SplashScreen from './components/splash/SplashScreen';
import { useBackendHealth } from './components/splash/useBackendHealth';

export default function App() {
  const { isReady, statusMessage } = useBackendHealth();

  // Whether the splash is still in the tree. Starts true, flips to
  // false exactly once, permanently, when the exit animation
  // finishes. This is intentionally a SEPARATE state from `isReady` —
  // it's driven only by the completion callback, never by re-renders.
  const [splashVisible, setSplashVisible] = useState(true);

  // Belt-and-braces: ensures we only ever act on the first time the
  // splash reports it has finished exiting.
  const hasUnmountedSplashRef = useRef(false);

  const handleSplashExitComplete = useCallback(() => {
    if (hasUnmountedSplashRef.current) return;
    hasUnmountedSplashRef.current = true;
    setSplashVisible(false);
  }, []);

  return (
    <>
      {/*
        The real app mounts the instant the backend responds
        (isReady flips false -> true exactly once, ever), sitting
        UNDERNEATH the splash. The splash then fades out on top of it
        and reports back when done — so there's no blank flash and no
        hard cut, and this subtree mounts exactly once per page load.
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

      {/*
        Plain conditional — no AnimatePresence needed. SplashScreen
        finishes its own fade-out internally and only THEN calls
        onExitComplete, so by the time we stop rendering it here,
        there's nothing left to animate out.
      */}
      {splashVisible && (
        <SplashScreen
          ready={isReady}
          statusMessage={statusMessage}
          onExitComplete={handleSplashExitComplete}
        />
      )}
    </>
  );
}