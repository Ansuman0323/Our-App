// Local mock data only — no API calls. Swap for `features/planner/api.js`
// once the backend exists.

export const anniversary = {
    label: 'Anniversary Countdown',
    date: 'March 14, 2026',
    daysLeft: 44,
    note: 'Something beautiful is already in motion.',
};

export const todaysPlans = [
    { id: 't1', time: '8:00 AM', title: 'Sunday Breakfast Together', icon: '🥐', done: true },
    { id: 't2', time: '1:00 PM', title: 'Coffee Date', icon: '☕', done: true },
    { id: 't3', time: '7:30 PM', title: 'Movie Night', icon: '🎬', done: false },
    { id: 't4', time: '10:00 PM', title: 'Stargazing on the roof', icon: '✨', done: false },
];

export const upcomingDate = {
    title: 'Candlelight Dinner',
    date: 'Fri, Feb 6 · 8:00 PM',
    location: 'That little Italian place downtown',
    icon: '🕯️',
};

export const weekendIdeas = [
    { id: 'w1', title: 'Beach Walk', icon: '🏖️' },
    { id: 'w2', title: 'Farmers Market Morning', icon: '🥕' },
    { id: 'w3', title: 'Board Game Marathon', icon: '🎲' },
    { id: 'w4', title: 'Bake Something New', icon: '🍪' },
];

export const specialOccasions = [
    { id: 's1', title: "Her Birthday Surprise", date: 'Feb 19', icon: '🎂' },
    { id: 's2', title: 'His Promotion Celebration', date: 'Mar 02', icon: '🥂' },
    { id: 's3', title: 'One Year Anniversary', date: 'Mar 14', icon: '💍' },
];

// Bucket list — a simple shared checklist with a completion ratio.
export const bucketList = [
    { id: 'b1', title: 'Watch the sunrise together', done: true },
    { id: 'b2', title: 'Take a road trip with no destination', done: true },
    { id: 'b3', title: 'Learn a dance together', done: false },
    { id: 'b4', title: 'Write each other a letter', done: false },
    { id: 'b5', title: 'Camp under the stars', done: false },
];

export const dreamDestinations = [
    { id: 'd1', title: 'Trip to Goa', subtitle: 'Sun, sand, and slow mornings', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80' },
    { id: 'd2', title: 'Kyoto in Spring', subtitle: 'Cherry blossoms and quiet temples', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
    { id: 'd3', title: 'Northern Lights, Iceland', subtitle: 'Someday, wrapped in blankets', image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600&q=80' },
];
