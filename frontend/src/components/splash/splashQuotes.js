// One is chosen at random per app launch so the splash never feels
// identical twice in a row, per the "ritual, not repetition" brief.
//
// Every line is now a complete emotional sentence rather than a
// fragment, and none exceeds two rendered lines (\n is the explicit
// break — the CSS reserves exactly two lines of height).
export const SPLASH_QUOTES = [
    'Every memory\ndeserves forever.',
    'Love deserves\nits own place.',
    'Keep every\nheartbeat close.',
    'Where your\nstory lives.',
    'A quiet place\nfor the two of you.',
    'Everything worth\nremembering.',
    'Home is wherever\nyou are.',
    'The world, made\nsmaller for two.',
    'Some days deserve\nto be kept.',
    'Still choosing you,\nevery morning.',
    'Distance is only\na number here.',
    'Two hearts,\none rhythm.',
    'Our story\ncontinues here.',
    'Closer than\nyesterday.',
    'Made for us,\nand no one else.',
    'The best part\nof every day.',
    'Wherever you go,\nI go.',
    'Every mile,\nworth it.',
    'Together,\nno matter what.',
    'Our own\nlittle universe.',
];

export function getRandomQuote() {
    const index = Math.floor(Math.random() * SPLASH_QUOTES.length);
    return SPLASH_QUOTES[index];
}
