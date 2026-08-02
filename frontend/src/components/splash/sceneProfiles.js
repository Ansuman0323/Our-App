// sceneProfiles.js
// Single source of truth for every device-dependent constant in the
// splash experience. Components consume a resolved profile via
// useSceneProfile() — they never branch on isMobile/isTablet directly.
//
// Changes in this pass: the display face is much larger and its
// tracking is positive (a serif wordmark wants air, not the negative
// tracking a sans-serif needs), the content gaps grew to create real
// whitespace, timings slowed so the cascade reads as choreography,
// and charIntervalMs — which SplashScreen already destructured from
// timing but no profile actually defined — is now supplied per device.

export const PROFILE_NAME = {
    DESKTOP: 'desktop',
    TABLET: 'tablet',
    LARGE_PHONE: 'largePhone',
    SMALL_PHONE: 'smallPhone',
};

// Breakpoints are on the SMALLER of viewport width/height so
// landscape phones and tablets classify sanely too.
const BREAKPOINTS = {
    smallPhoneMax: 380,   // iPhone SE class and below
    largePhoneMax: 480,   // standard modern phones, portrait
    tabletMax: 900,       // iPad portrait / small laptop
    // anything above tabletMax => desktop
};

export const SCENE_PROFILES = {
    [PROFILE_NAME.DESKTOP]: {
        heart: { scale: 0.62 },
        aurora: { opacity: 0.6 },
        particles: { starCount: 18, fireflyCount: 4, petalCount: 3 },
        typography: {
            titleSize: '78px', titleLetterSpacing: '0.012em',
            taglineSize: '19px', taglineLineHeight: 1.55,
        },
        spacing: { contentGap: 44, contentMaxWidth: 460, contentPadding: 24 },
        timing: { titleStartMs: 900, typewriterStartMs: 1800, charIntervalMs: 42 },
    },

    [PROFILE_NAME.TABLET]: {
        heart: { scale: 0.56 },
        aurora: { opacity: 0.55 },
        particles: { starCount: 12, fireflyCount: 3, petalCount: 2 },
        typography: {
            titleSize: '66px', titleLetterSpacing: '0.01em',
            taglineSize: '18px', taglineLineHeight: 1.5,
        },
        spacing: { contentGap: 38, contentMaxWidth: 400, contentPadding: 22 },
        timing: { titleStartMs: 850, typewriterStartMs: 1700, charIntervalMs: 42 },
    },

    [PROFILE_NAME.LARGE_PHONE]: {
        heart: { scale: 0.46 },
        aurora: { opacity: 0.42 },
        particles: { starCount: 8, fireflyCount: 2, petalCount: 1 },
        typography: {
            titleSize: '56px', titleLetterSpacing: '0.008em',
            taglineSize: '16.5px', taglineLineHeight: 1.48,
        },
        spacing: { contentGap: 32, contentMaxWidth: '86vw', contentPadding: 20 },
        timing: { titleStartMs: 800, typewriterStartMs: 1600, charIntervalMs: 40 },
    },

    [PROFILE_NAME.SMALL_PHONE]: {
        heart: { scale: 0.4 },
        aurora: { opacity: 0.36 },
        particles: { starCount: 6, fireflyCount: 1, petalCount: 1 },
        typography: {
            titleSize: '48px', titleLetterSpacing: '0.006em',
            taglineSize: '15px', taglineLineHeight: 1.45,
        },
        spacing: { contentGap: 26, contentMaxWidth: '90vw', contentPadding: 18 },
        timing: { titleStartMs: 750, typewriterStartMs: 1500, charIntervalMs: 38 },
    },
};

export function resolveProfileName(width, height) {
    const shortSide = Math.min(width, height);
    if (shortSide <= BREAKPOINTS.smallPhoneMax) return PROFILE_NAME.SMALL_PHONE;
    if (shortSide <= BREAKPOINTS.largePhoneMax) return PROFILE_NAME.LARGE_PHONE;
    if (shortSide <= BREAKPOINTS.tabletMax) return PROFILE_NAME.TABLET;
    return PROFILE_NAME.DESKTOP;
}

export function getSceneProfile(width, height) {
    return SCENE_PROFILES[resolveProfileName(width, height)];
}