import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import backendApi from '../services/backend'
import ImageCache from '../services/imageCache'
import { enrichTrackData } from '../utils/marketSimulator'
import { EnrichedTrack, LastFmTrack } from '../types'
import { useAuthStore } from './auth'
import router from '../router'

export const useMarketStore = defineStore('market', () => {
    const assets = ref<EnrichedTrack[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const fetchMarket = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await api.getTopTracks()
            const rawTracks: LastFmTrack[] = response.data.tracks.track || []

            // console.log('DEBUG: Top Tracks Raw:', rawTracks[0]);

            // Transform data with market simulator
            assets.value = rawTracks.map(track => {
                const enriched = enrichTrackData(track);
                // Apply cache immediately if available
                const cachedImage = ImageCache.get(enriched.artist, enriched.name);
                if (cachedImage) {
                    enriched.image = cachedImage;
                }
                return enriched;
            })

            // Progressive Image Loading
            fetchImagesForTopTracks()

        } catch (err: any) {
            console.error('Market fetch failed:', err)
            error.value = err.message || 'Failed to fetch market data'
        } finally {
            isLoading.value = false
        }
    }

    // New action: Lazy load real images
    const fetchImagesForTopTracks = async () => {
        // Optimize: Process all tracks with rate limiting
        const tracksToUpdate = assets.value;

        for (const asset of tracksToUpdate) {
            // Skip if we already have a valid cached image
            if (ImageCache.has(asset.artist, asset.name)) continue;

            try {
                // Fetch details
                // asset.artist is a string (normalized by enrichTrackData)
                const response = await api.getTrackInfo(asset.artist, asset.name);
                const trackData = response.data.track;

                if (trackData && trackData.album && trackData.album.image) {
                    const images = trackData.album.image;
                    const bestImage = images[images.length - 1]['#text'];

                    if (bestImage) {
                        asset.image = bestImage; // Reactively update the asset
                        ImageCache.set(asset.artist, asset.name, bestImage); // Save to cache
                    }
                }
            } catch (ignore) {
                // console.warn('Failed to load image for', asset.name);
                // Fail silently, keep placeholder
            }

            // Small delay to be nice to the API
            await new Promise(r => setTimeout(r, 100));
        }
    }

    const portfolio = ref<EnrichedTrack[]>([])
    const authStore = useAuthStore()
    const portfolioValue = computed(() => {
        return portfolio.value.reduce((sum, t) => sum + (t.price || 0), 0)
    })

    // Initialize: Load from Backend
    const loadPortfolio = async () => {
        if (!authStore.isAuthenticated) return;
        
        try {
            const response = await backendApi.getPortfolio();
            const items = response.data || [];
            const enrichedItems: EnrichedTrack[] = await Promise.all(items.map(async (item: any) => {
                try {
                    const info = await api.getTrackInfo(item.artist_name, item.track_name);
                    const base = enrichTrackData(info.data.track);
                    base.image = item.image_url || base.image;
                    base.mbid = item.mbid || base.mbid;
                    return base;
                } catch {
                    return {
                        name: item.track_name,
                        artist: item.artist_name,
                        image: item.image_url,
                        price: 0,
                        volume: 0,
                        change24h: '0.00',
                        isPositive: true,
                        mbid: item.mbid
                    } as EnrichedTrack;
                }
            }));
            portfolio.value = enrichedItems;
        } catch (err: any) {
            console.error('Failed to load portfolio:', err);
            if (err.response && err.response.status === 401) {
                authStore.logout();
            }
        }
    }

    const addToPortfolio = async (track: EnrichedTrack) => {
        if (!authStore.isAuthenticated) {
            router.push('/auth');
            return;
        }

        if (!isInPortfolio(track)) {
            try {
                await backendApi.addToPortfolio({
                    artist_name: track.artist,
                    track_name: track.name,
                    image_url: track.image,
                    mbid: (track as any).mbid
                });
                portfolio.value.push(track);
            } catch (err: any) {
                console.error('Failed to add to portfolio:', err);
                if (err.response && err.response.status === 401) {
                    authStore.logout();
                }
            }
        }
    }

    const removeFromPortfolio = async (track: EnrichedTrack) => {
        if (!authStore.isAuthenticated) {
            router.push('/auth');
            return;
        }

        try {
            await backendApi.removeFromPortfolio(track.name);
            portfolio.value = portfolio.value.filter(t => t.name !== track.name || t.artist !== track.artist);
        } catch (err: any) {
            console.error('Failed to remove from portfolio:', err);
             if (err.response && err.response.status === 401) {
                authStore.logout();
            }
        }
    }

    const isInPortfolio = (track: EnrichedTrack) => {
        return portfolio.value.some(t => t.name === track.name && t.artist === track.artist)
    }

    return {
        assets,
        portfolio,
        portfolioValue,
        isLoading,
        error,
        fetchMarket,
        loadPortfolio,
        addToPortfolio,
        removeFromPortfolio,
        isInPortfolio
    }
})
