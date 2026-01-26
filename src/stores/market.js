import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import ImageCache from '../services/imageCache'
import { enrichTrackData } from '../utils/marketSimulator'

export const useMarketStore = defineStore('market', () => {
    const assets = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const fetchMarket = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await api.getTopTracks()
            const rawTracks = response.data.tracks.track || []

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

        } catch (err) {
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

    const portfolio = ref([])

    // Initialize: Load from localStorage
    const loadPortfolio = () => {
        const stored = localStorage.getItem('soundstock-portfolio')
        if (stored) {
            portfolio.value = JSON.parse(stored)
        }
    }

    // Persist helper
    const savePortfolio = () => {
        localStorage.setItem('soundstock-portfolio', JSON.stringify(portfolio.value))
    }

    const addToPortfolio = (track) => {
        if (!isInPortfolio(track)) {
            portfolio.value.push(track)
            savePortfolio()
        }
    }

    const removeFromPortfolio = (track) => {
        const index = portfolio.value.findIndex(item => item.name === track.name && item.artist === track.artist)
        if (index !== -1) {
            portfolio.value.splice(index, 1)
            savePortfolio()
        }
    }

    const isInPortfolio = (track) => {
        return portfolio.value.some(item => item.name === track.name && item.artist === track.artist)
    }

    // Getters (Computed in Script Setup store)
    const portfolioValue = computed(() => {
        return portfolio.value.reduce((total, item) => total + (item.price || 0), 0)
    })

    // Load on init
    loadPortfolio()

    return {
        assets,
        isLoading,
        error,
        fetchMarket,
        // Portfolio
        portfolio,
        addToPortfolio,
        removeFromPortfolio,
        isInPortfolio,
        portfolioValue
    }
})
