<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMarketStore } from '../stores/market'
import api from '../services/api'
import { enrichTrackData } from '../utils/marketSimulator'
import { formatNumber } from '../utils/formatters'
import TheHeader from '../components/ui/TheHeader.vue'
import { EnrichedTrack } from '../types'

const route = useRoute()
const marketStore = useMarketStore()

const track = ref<EnrichedTrack | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const fetchTrackDetails = async () => {
    isLoading.value = true
    error.value = null
    try {
        const artistParam = Array.isArray(route.params.artist) ? route.params.artist[0] : route.params.artist;
        const trackParam = Array.isArray(route.params.track) ? route.params.track[0] : route.params.track;

        if (!artistParam || !trackParam) {
             throw new Error("Invalid parameters");
        }

        const response = await api.getTrackInfo(artistParam, trackParam)
        if (response.data.track) {
            track.value = enrichTrackData(response.data.track)
        } else {
            error.value = "Track not found"
        }
    } catch (err: any) {
        error.value = err.message || "Failed to load track details"
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchTrackDetails()
})

// Watch for route changes to reload if navigating between tracks
watch(() => route.params, () => {
    fetchTrackDetails()
})

const isOwned = computed(() => {
    if (!track.value) return false
    return marketStore.isInPortfolio(track.value)
})

const togglePortfolio = () => {
    if (track.value) {
        if (isOwned.value) {
            marketStore.removeFromPortfolio(track.value)
        } else {
            marketStore.addToPortfolio(track.value)
        }
    }
}

// Duration formatter (ms to mm:ss)
const formatDuration = (durationStr?: string) => {
    if (!durationStr) return '-'
    const ms = parseInt(durationStr);
    if (isNaN(ms)) return '-';
    
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    // Fix type error for comparison: parseInt(seconds) or explicit conversion
    const secondsNum = parseInt(seconds);
    return minutes + ":" + (secondsNum < 10 ? '0' : '') + seconds
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <TheHeader />

    <main class="container mx-auto px-4 py-8">
        <!-- Loading -->
        <div v-if="isLoading" class="animate-pulse space-y-8">
            <div class="h-64 bg-slate-800 rounded-xl w-full"></div>
            <div class="h-32 bg-slate-800 rounded-xl w-full"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-rose-400 text-center py-12">
            <h2 class="text-2xl font-bold">Ошибка</h2>
            <p>{{ error }}</p>
            <router-link to="/" class="text-indigo-400 hover:underline mt-4 inline-block">Вернуться на главную</router-link>
        </div>

        <div v-else-if="track" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Visual & Primary Info -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Cover Art -->
                <div class="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-800 group">
                    <img :src="track.image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                    <div class="absolute bottom-4 left-4 right-4">
                        <span class="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded mb-2 border border-emerald-500/30">
                            АКТИВ LIVE
                        </span>
                    </div>
                </div>

                <!-- Action Panel -->
                <div class="bg-surface p-6 rounded-xl border border-slate-700">
                     <button @click="togglePortfolio" 
                        class="w-full py-3 px-4 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center space-x-2"
                        :class="isOwned ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'">
                        <span v-if="isOwned">ПРОДАТЬ / УБРАТЬ</span>
                        <span v-else>КУПИТЬ / В ПОРТФЕЛЬ</span>
                     </button>
                     <p class="text-center text-xs text-slate-500 mt-3">
                        Действие симулирует транзакцию. Реальные средства не используются.
                     </p>
                </div>
            </div>

            <!-- Right Column: Data & Stats -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Header -->
                <div>
                    <h1 class="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">{{ track.name }}</h1>
                    <router-link to="/" class="text-xl text-slate-400 hover:text-indigo-400 transition-colors">
                        {{ track.artist }}
                    </router-link>
                    
                    <!-- Tags -->
                    <div class="flex flex-wrap gap-2 mt-4">
                        <span v-for="tag in track.toptags?.tag" :key="tag.name" 
                              class="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-default border border-slate-700">
                            {{ tag.name }}
                        </span>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-surface p-4 rounded-xl border border-slate-700">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1">Метрика: Цена</div>
                        <div class="text-2xl font-mono text-white">{{ formatNumber(track.price) }}</div>
                    </div>
                    <div class="bg-surface p-4 rounded-xl border border-slate-700">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1">Слушатели</div>
                        <div class="text-2xl font-mono text-white">{{ formatNumber(track.volume) }}</div>
                    </div>
                     <div class="bg-surface p-4 rounded-xl border border-slate-700">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1">Длительность</div>
                        <div class="text-2xl font-mono text-white">{{ formatDuration(track.duration) }}</div>
                    </div>
                     <div class="bg-surface p-4 rounded-xl border border-slate-700">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1">Изм. 24ч</div>
                        <div class="text-2xl font-mono" :class="track.isPositive ? 'text-success' : 'text-danger'">
                            {{ track.isPositive ? '+' : '' }}{{ track.change24h }}%
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="bg-surface p-6 rounded-xl border border-slate-700" v-if="track.wiki">
                    <h3 class="text-lg font-bold text-white mb-4">Об активе</h3>
                    <div class="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed" v-html="track.wiki.summary"></div>
                </div>
            </div>
        </div>
    </main>
  </div>
</template>
