import { useEffect, useState } from 'react';
import { getSceneProfile } from './sceneProfiles';

// Resolved once per mount and updated on resize/orientation-change,
// debounced — the splash is short-lived, so we don't need this to be
// exhaustively reactive, just correct at the moment it's read.
export function useSceneProfile() {
    const [profile, setProfile] = useState(() =>
        getSceneProfile(window.innerWidth, window.innerHeight)
    );

    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setProfile(getSceneProfile(window.innerWidth, window.innerHeight));
            }, 150);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return profile;
}