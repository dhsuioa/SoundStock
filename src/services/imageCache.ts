const CACHE_KEY = 'soundstock-image-cache';

class ImageCacheService {
    private cache: Record<string, string>;

    constructor() {
        this.cache = this.load();
    }

    load(): Record<string, string> {
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Failed to load image cache', e);
            return {};
        }
    }

    save(): void {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
        } catch (e) {
            console.warn('Failed to save image cache (quota exceeded?)', e);
        }
    }

    getKey(artist: string, track: string): string {
        return `${artist.toLowerCase()}|${track.toLowerCase()}`;
    }

    get(artist: string, track: string): string | null {
        const key = this.getKey(artist, track);
        return this.cache[key] || null;
    }

    set(artist: string, track: string, url: string): void {
        if (!url) return;
        const key = this.getKey(artist, track);
        this.cache[key] = url;
        this.save();
    }

    has(artist: string, track: string): boolean {
        return !!this.get(artist, track);
    }
}

export default new ImageCacheService();
