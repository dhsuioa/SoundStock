const CACHE_KEY = 'soundstock-image-cache';

class ImageCacheService {
    constructor() {
        this.cache = this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Failed to load image cache', e);
            return {};
        }
    }

    save() {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
        } catch (e) {
            console.warn('Failed to save image cache (quota exceeded?)', e);
        }
    }

    getKey(artist, track) {
        return `${artist.toLowerCase()}|${track.toLowerCase()}`;
    }

    get(artist, track) {
        const key = this.getKey(artist, track);
        return this.cache[key] || null;
    }

    set(artist, track, url) {
        if (!url) return;
        const key = this.getKey(artist, track);
        this.cache[key] = url;
        this.save();
    }

    has(artist, track) {
        return !!this.get(artist, track);
    }
}

export default new ImageCacheService();
