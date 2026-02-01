import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import backendApi from '../services/backend'
import ImageCache from '../services/imageCache'
import { enrichTrackData } from '../utils/marketSimulator'
import { EnrichedTrack, LastFmTrack } from '../types'
import { useAuthStore } from './auth'
import router from '../router'
import { useToastStore } from './toast'

export const useMarketStore = defineStore('market', () => {
    const assets = ref<EnrichedTrack[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const isActionPending = ref(false)
    const pendingKeys = ref<Set<string>>(new Set())
    const keyFor = (track: EnrichedTrack) => `${track.artist}|||${track.name}`
    const isPending = (track?: EnrichedTrack) => {
        if (!track) return false
        return pendingKeys.value.has(keyFor(track))
    }

    const fetchMarket = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await api.getTopTracks()
            const rawTracks: LastFmTrack[] = response.data.tracks.track || []

            // console.log('DEBUG: Top Tracks Raw:', rawTracks[0]);

            // Transform data with market simulator
            const enriched = rawTracks.map(track => {
                const enriched = enrichTrackData(track);
                // Apply cache immediately if available
                const cachedImage = ImageCache.get(enriched.artist, enriched.name);
                if (cachedImage) {
                    enriched.image = cachedImage;
                }
                return enriched;
            })
            // Try to override price/change with backend snapshot (real data)
            try {
                const snap = await backendApi.getMarketSnapshot();
                const map = new Map<string, { price: number; change24h: number; is_positive: boolean }>();
                (snap.data || []).forEach((item: any) => {
                    map.set(`${item.artist_name}|||${item.track_name}`, { price: item.price, change24h: item.change24h, is_positive: item.is_positive });
                });
                for (const t of enriched) {
                    const key = `${t.artist}|||${t.name}`;
                    const s = map.get(key);
                    if (s) {
                        t.price = s.price;
                        t.change24h = (s.change24h ?? 0).toFixed(2);
                        t.isPositive = !!s.is_positive;
                    }
                }
            } catch (ignore) {}
            assets.value = enriched;

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

        if (isPending(track)) return;
        if (!isInPortfolio(track)) {
            pendingKeys.value.add(keyFor(track))
            const toast = useToastStore()
            try {
                await backendApi.addToPortfolio({
                    artist_name: track.artist,
                    track_name: track.name,
                    image_url: track.image,
                    mbid: (track as any).mbid,
                    current_price: Math.round(track.price || 0)
                });
                portfolio.value.push(track);
                const currentBalance = authStore.user?.balance ?? 0;
                authStore.updateBalance(currentBalance - Math.round(track.price || 0), 'decrease');
                authStore.refreshUser().catch(() => {});
                toast.show('Актив куплен', 'success')
            } catch (err: any) {
                console.error('Failed to add to portfolio:', err);
                if (err.response && err.response.status === 400 && err.response.data?.detail === 'Not enough funds') {
                    const e = new Error('Недостаточно средств');
                    (e as any).code = 'INSUFFICIENT_FUNDS';
                    toast.show('Недостаточно средств', 'error')
                    throw e;
                }
                if (err.response && err.response.status === 401) {
                    authStore.logout();
                }
            } finally {
                pendingKeys.value.delete(keyFor(track))
            }
        }
    }

    const removeFromPortfolio = async (track: EnrichedTrack) => {
        if (!authStore.isAuthenticated) {
            router.push('/auth');
            return;
        }

        if (isPending(track)) return;
        pendingKeys.value.add(keyFor(track))
        const toast = useToastStore()
        try {
            await backendApi.removeFromPortfolio(track.name, Math.round(track.price || 0));
            portfolio.value = portfolio.value.filter(t => t.name !== track.name || t.artist !== track.artist);
            const currentBalance = authStore.user?.balance ?? 0;
            authStore.updateBalance(currentBalance + Math.round(track.price || 0), 'increase');
            authStore.refreshUser().catch(() => {});
            toast.show('Актив продан', 'success')
        } catch (err: any) {
            console.error('Failed to remove from portfolio:', err);
             if (err.response && err.response.status === 401) {
                authStore.logout();
            }
        } finally {
            pendingKeys.value.delete(keyFor(track))
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
        isActionPending,
        isPending,
        fetchMarket,
        loadPortfolio,
        addToPortfolio,
        removeFromPortfolio,
        isInPortfolio
    }
})
