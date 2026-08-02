// Returns a small set of CSS custom-property overrides for special
// dates, plus a flag for whether petals or snow should fall. Kept
// deliberately simple (date-based, no external calendar) — an
// anniversary date could be wired in later via user settings.
//
// The tokens are now the two the redesigned stylesheet actually reads:
// --splash-accent (primary) and --splash-lav (secondary). Both are
// space-separated RGB triplets so the CSS can apply its own alpha via
// rgb(var(--token) / x). The old --splash-pink/--splash-gold hex
// overrides silently did nothing.
export function getSplashOccasion(date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Valentine's Day — deeper rose, warmer secondary.
    if (month === 2 && day === 14) {
        return {
            name: 'valentines',
            vars: { '--splash-accent': '255 77 126', '--splash-lav': '255 179 198' },
            weather: 'petals',
        };
    }

    // Christmas — the pink cools toward a wintry blue secondary.
    if (month === 12 && day === 25) {
        return {
            name: 'christmas',
            vars: { '--splash-accent': '255 143 163', '--splash-lav': '159 216 255' },
            weather: 'snow',
        };
    }

    // New Year's Eve / Day — champagne gold against the lavender.
    if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
        return {
            name: 'new-year',
            vars: { '--splash-accent': '255 226 122', '--splash-lav': '198 176 255' },
            weather: 'stars',
        };
    }

    return { name: 'default', vars: {}, weather: 'petals' };
}
