// Local mock data only — no API calls, no backend. Swap this module
// out for a real `features/memories/api.js` call once the endpoint
// exists; every component below only cares about this shape.

export const featuredMemory = {
    id: 'feat-1',
    title: 'The night we said forever',
    date: 'Dec 14, 2025',
    caption: "We danced in the kitchen until the neighbors knocked. Best noise complaint of my life.",
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80',
};

// "Recent Moments" — a horizontal scrapbook strip.
export const recentMoments = [
    {
        id: 'rm-1',
        title: 'Rainy day, warm mugs',
        date: 'Jan 22',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    },
    {
        id: 'rm-2',
        title: 'You beat me at chess again',
        date: 'Jan 18',
        image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&q=80',
    },
    {
        id: 'rm-3',
        title: 'Sunset on the terrace',
        date: 'Jan 09',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    },
    {
        id: 'rm-4',
        title: '',
        date: '',
        image: null, // empty slot on purpose — invites the next upload
    },
];

// "Memory Timeline" — the story so far, oldest to newest.
export const memoryTimeline = [
    { id: 'tl-1', label: 'Our First Picture', description: 'The blurry selfie that started it all.', date: 'Mar 2024', state: 'done' },
    { id: 'tl-2', label: 'First Trip Together', description: 'Three days, one map, zero plans.', date: 'Jul 2024', state: 'done' },
    { id: 'tl-3', label: 'Moved in Together', description: 'Boxes everywhere, hearts fuller.', date: 'Nov 2024', state: 'done' },
    { id: 'tl-4', label: 'The night we said forever', description: 'Kitchen dance floor, no regrets.', date: 'Dec 2025', state: 'current' },
    { id: 'tl-5', label: 'Your next chapter', description: 'Still being written.', date: 'Someday', state: 'upcoming' },
];

// "This Month" — a small themed set.
export const thisMonth = [
    { id: 'mo-1', title: 'Sunday market run', date: 'Jan 05', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80' },
    { id: 'mo-2', title: 'Movie night marathon', date: 'Jan 12', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80' },
    { id: 'mo-3', title: '', date: '', image: null },
];

// Category shelves — "Our First Picture" is folded into the timeline
// above, so the remaining shelves are Vacation / Funny Moments /
// Favorite Memories, each its own little scrapbook page.
export const memoryCollections = [
    {
        id: 'vacation',
        title: 'Vacation',
        icon: '🌴',
        items: [
            { id: 'vac-1', title: 'Goa, day one', date: 'Oct 2025', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80' },
            { id: 'vac-2', title: 'Lost on purpose', date: 'Oct 2025', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80' },
            { id: 'vac-3', title: '', date: '', image: null },
        ],
    },
    {
        id: 'funny',
        title: 'Funny Moments',
        icon: '😂',
        items: [
            { id: 'fun-1', title: 'The pancake incident', date: 'Sep 2025', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80' },
            { id: 'fun-2', title: '', date: '', image: null },
        ],
    },
    {
        id: 'favorite',
        title: 'Favorite Memories',
        icon: '💫',
        items: [
            { id: 'favm-1', title: 'The proposal rehearsal (oops)', date: 'Dec 2025', image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80' },
            { id: 'favm-2', title: '', date: '', image: null },
            { id: 'favm-3', title: '', date: '', image: null },
        ],
    },
];
