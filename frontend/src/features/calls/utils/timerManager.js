export class TimerManager {
    constructor() {
        this.timers = new Map();
    }

    start(key, callback, ms) {
        this.clear(key);
        this.timers.set(key, setTimeout(callback, ms));
    }

    clear(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    clearAll() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }
}