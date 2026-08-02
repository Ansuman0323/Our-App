// Pure decoration — no motion, no state. The old SplashHeart's mark,
// kept only as a small static glyph for the divider (and the Enter
// button) so the "heart" motif survives in miniature even though the
// hero animation itself now lives inside the video.
export default function HeartGlyph({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 64 58"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M32 57C32 57 2 38.2 2 17.9C2 7.9 9.7 2 18 2C24.2 2 29.2 5.7 32 10.7C34.8 5.7 39.8 2 46 2C54.3 2 62 7.9 62 17.9C62 38.2 32 57 32 57Z"
                fill="currentColor"
            />
        </svg>
    );
}