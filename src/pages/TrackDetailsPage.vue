<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMarketStore } from '../stores/market'
import api from '../services/api'
import { enrichTrackData } from '../utils/marketSimulator'
import { formatNumber } from '../utils/formatters'
import TheHeader from '../components/ui/TheHeader.vue'
import { EnrichedTrack } from '../types'
import backendApi from '../services/backend'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const marketStore = useMarketStore()
const authStore = useAuthStore()

const track = ref<EnrichedTrack | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const history = ref<{ timestamp: string; price: number }[]>([])
let refreshTimer: any = null
const ownedPurchasePrice = ref<number | null>(null)

const fetchTrackDetails = async () => {
    isLoading.value = true
    error.value = null
    try {
        const artistRaw = Array.isArray(route.params.artist) ? route.params.artist[0] : route.params.artist;
        const trackRaw = Array.isArray(route.params.track) ? route.params.track[0] : route.params.track;
        const artistParam = typeof artistRaw === 'string' ? decodeURIComponent(artistRaw) : '';
        const trackParam = typeof trackRaw === 'string' ? decodeURIComponent(trackRaw) : '';

        if (!artistParam || !trackParam) {
             throw new Error("Invalid parameters");
        }

        const response = await api.getTrackInfo(artistParam, trackParam)
        let finalTrack: any = response.data.track || null;

        if (!finalTrack) {
            const searchResp = await api.searchTracks(trackParam, 10);
            const matches = (searchResp.data?.results?.trackmatches?.track || []) as any[];
            const norm = (s: string) => s.trim().toLowerCase();
            const candidate = matches.find(m => norm(m.artist) === norm(artistParam))
                || matches.find(m => norm(m.name) === norm(trackParam))
                || matches[0];
            if (candidate) {
                const info2 = await api.getTrackInfo(candidate.artist, candidate.name);
                finalTrack = info2.data.track || candidate;
            }
        }

        if (finalTrack) {
            track.value = enrichTrackData(finalTrack)
            const hist = await backendApi.getTrackHistory(track.value.artist, track.value.name)
            history.value = (hist.data || [])
                .map((p: any) => ({ timestamp: p.timestamp, price: p.price }))
                .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            if (authStore.isAuthenticated) {
                try {
                    const pr = await backendApi.getPortfolio()
                    const items = pr.data || []
                    const m = items.find((it: any) => it.artist_name === track.value?.artist && it.track_name === track.value?.name)
                    ownedPurchasePrice.value = m?.purchase_price ?? null
                } catch {}
            } else {
                ownedPurchasePrice.value = null
            }
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
    marketStore.loadPortfolio()
    fetchTrackDetails()
    refreshTimer = setInterval(async () => {
        const artistRaw = Array.isArray(route.params.artist) ? route.params.artist[0] : route.params.artist
        const trackRaw = Array.isArray(route.params.track) ? route.params.track[0] : route.params.track
        const artistParam = typeof artistRaw === 'string' ? decodeURIComponent(artistRaw) : ''
        const trackParam = typeof trackRaw === 'string' ? decodeURIComponent(trackRaw) : ''
        if (artistParam && trackParam) {
            try {
                const hist = await backendApi.getTrackHistory(artistParam, trackParam)
                history.value = (hist.data || [])
                    .map((p: any) => ({ timestamp: p.timestamp, price: p.price }))
                    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            } catch {}
        }
    }, 60000)
})

// Watch for route changes to reload if navigating between tracks
watch(() => route.params, () => {
    fetchTrackDetails()
})
 
import { onUnmounted } from 'vue'
onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
    }
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

// Sanitize wiki summary (strip HTML tags to avoid XSS)
const stripTags = (html: string) => {
    try {
        const div = document.createElement('div')
        div.innerHTML = html
        return (div.textContent || div.innerText || '').trim()
    } catch {
        return html
    }
}
const sanitizedWiki = computed(() => {
    const summary = (track.value as any)?.wiki?.summary as string | undefined
    return summary ? stripTags(summary) : ''
})
const payoutMinutes = 10
const ratePerPayout = 0.01
const baseDividendPrice = computed(() => {
    const p = ownedPurchasePrice.value
    if (p && p > 0) return p
    return Math.round(track.value?.price || 0)
})
const dividendPerPayout = computed(() => Math.floor(baseDividendPrice.value * ratePerPayout))
const dividendPerHour = computed(() => Math.floor(dividendPerPayout.value * (60 / payoutMinutes)))
const dividendPerDay = computed(() => Math.floor(dividendPerPayout.value * (24 * 60 / payoutMinutes)))

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

const svgWidth = 800
const svgHeight = 200
const padding = 24
const chartPoints = computed(() => {
    if (!history.value.length) return []
    const ys = history.value.map(h => h.price)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const rangeY = maxY - minY
    const stepX = (svgWidth - padding * 2) / Math.max(1, history.value.length - 1)
    return history.value.map((h, i) => {
        const x = padding + stepX * i
        const yNorm = rangeY === 0 ? 0.5 : (h.price - minY) / rangeY
        const y = svgHeight - padding - yNorm * (svgHeight - padding * 2)
        return { x, y }
    })
})
const yTicks = computed(() => {
    if (!history.value.length) return []
    const ys = history.value.map(h => h.price)
    let minY = Math.min(...ys)
    let maxY = Math.max(...ys)
    let rangeY = maxY - minY
    if (rangeY === 0) {
        const step = Math.max(1, Math.round(minY * 0.01))
        minY = Math.max(0, minY - 2 * step)
        maxY = minY + 4 * step
        rangeY = maxY - minY
    }
    const step = rangeY / 4
    const ticks = [minY, minY + step, minY + 2 * step, minY + 3 * step, maxY]
    const height = svgHeight - padding * 2
    return ticks.map(v => {
        const yNorm = (v - minY) / (maxY - minY)
        const y = svgHeight - padding - yNorm * height
        return { y, label: Math.round(v) }
    })
})
const pathD = computed(() => {
    if (!chartPoints.value.length) return ''
    return chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 relative overflow-hidden">
    <!-- Ambient Background Effects -->
    <div class="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
    <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

    <TheHeader />

    <main class="container mx-auto px-4 py-8 relative z-10">
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
                <div class="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800 group">
                    <div class="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img :src="track.image" class="relative w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                    <div class="absolute bottom-4 left-4 right-4">
                        <span class="inline-flex items-center px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold rounded mb-2 border border-emerald-500/30 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
                            <span class="relative flex h-2 w-2 mr-1.5">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            АКТИВ LIVE
                        </span>
                    </div>
                </div>

                <!-- Action Panel -->
                <div class="bg-slate-800/40 backdrop-blur-xl p-6 rounded-xl border border-slate-700/50 shadow-xl">
                     <button @click="togglePortfolio" 
                        class="w-full py-3 px-4 rounded-xl font-bold transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
                        :class="isOwned ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/20 ring-1 ring-rose-400/50' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20 ring-1 ring-indigo-400/50'"
                        :disabled="marketStore.isPending(track)"
                        :aria-busy="marketStore.isPending(track)">
                        <svg v-if="marketStore.isPending(track)" class="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"></path>
                        </svg>
                        <span v-if="isOwned">ПРОДАТЬ / УБРАТЬ</span>
                        <span v-else>КУПИТЬ / В ПОРТФЕЛЬ</span>
                     </button>
                     <p class="text-center text-xs text-slate-500 mt-3">
                        Действие симулирует транзакцию. Реальные средства не используются.
                     </p>
                </div>
            </div>

            <!-- Right Column: Data & Stats -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Header -->
                <div>
                    <h1 class="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight mb-2">{{ track.name }}</h1>
                    <router-link to="/" class="text-xl text-slate-400 hover:text-indigo-400 transition-colors flex items-center group">
                        {{ track.artist }}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </router-link>
                    
                    <!-- Tags -->
                    <div class="flex flex-wrap gap-2 mt-4">
                        <span v-for="tag in track.toptags?.tag" :key="tag.name" 
                              class="px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 text-xs hover:bg-slate-700/50 hover:text-white transition-colors cursor-default border border-slate-700/50 backdrop-blur-sm">
                            {{ tag.name }}
                        </span>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div class="bg-slate-800/40 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1 group-hover:text-indigo-400 transition-colors">Метрика: Цена</div>
                        <div class="text-2xl font-mono text-white font-bold">{{ formatNumber(track.price) }}</div>
                    </div>
                    <div class="bg-slate-800/40 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1 group-hover:text-indigo-400 transition-colors">Слушатели</div>
                        <div class="text-2xl font-mono text-white font-bold">{{ formatNumber(track.volume) }}</div>
                    </div>
                     <div class="bg-slate-800/40 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1 group-hover:text-indigo-400 transition-colors">Длительность</div>
                        <div class="text-2xl font-mono text-white font-bold">{{ formatDuration(track.duration) }}</div>
                    </div>
                     <div class="bg-slate-800/40 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                        <div class="text-slate-500 text-xs uppercase font-medium mb-1 group-hover:text-indigo-400 transition-colors">Изм. 24ч</div>
                        <div class="text-2xl font-mono font-bold" :class="track.isPositive ? 'text-emerald-400' : 'text-rose-400'">
                            {{ track.isPositive ? '+' : '' }}{{ track.change24h }}%
                        </div>
                    </div>
                </div>

                <div class="bg-slate-800/40 backdrop-blur-xl p-6 rounded-xl border border-slate-700/50 shadow-lg">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.312-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.312.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                      </svg>
                      Дивиденды
                    </h3>
                    <div class="text-3xl font-mono text-white tabular-nums font-bold tracking-tight">${{ formatNumber(dividendPerPayout) }}</div>
                    <div class="mt-4 grid grid-cols-3 gap-3 text-xs font-mono">
                        <div class="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">10 мин</div>
                            <div class="text-emerald-400 font-bold text-sm tabular-nums">${{ formatNumber(dividendPerPayout) }}</div>
                        </div>
                        <div class="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">1 час</div>
                            <div class="text-emerald-400 font-bold text-sm tabular-nums">${{ formatNumber(dividendPerHour) }}</div>
                        </div>
                        <div class="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-center">
                            <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">24 часа</div>
                            <div class="text-emerald-400 font-bold text-sm tabular-nums">${{ formatNumber(dividendPerDay) }}</div>
                        </div>
                    </div>
                    <div class="text-slate-500 text-xs mt-3 flex items-center">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-600 mr-2"></span>
                        {{ ownedPurchasePrice ? 'Рассчитано от цены вашей покупки' : 'Рассчитано от текущей рыночной цены' }}
                    </div>
                </div>

                <!-- History Chart -->
                <div class="bg-slate-800/40 backdrop-blur-xl p-6 rounded-xl border border-slate-700/50 shadow-lg">
                    <h3 class="text-lg font-bold text-white mb-4">Исторические данные</h3>
                    <div v-if="history.length">
                        <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="w-full h-auto max-h-[300px]">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
                                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
                                </linearGradient>
                            </defs>
                            <line :x1="padding" :y1="padding" :x2="padding" :y2="svgHeight - padding" stroke="#334155" stroke-width="1" />
                            <line v-for="(t, i) in yTicks" :key="'g'+i" :x1="padding" :y1="t.y" :x2="svgWidth - padding" :y2="t.y" stroke="#334155" stroke-width="1" stroke-dasharray="4 4" opacity="0.3" />
                            <text v-for="(t, i) in yTicks" :key="'l'+i" :x="padding - 8" :y="t.y + 4" text-anchor="end" fill="#94a3b8" font-size="10" font-family="monospace">{{ t.label }}</text>
                            
                            <!-- Area fill under the line (simulated) -->
                             <path :d="`${pathD} L${chartPoints[chartPoints.length-1].x},${svgHeight-padding} L${padding},${svgHeight-padding} Z`" fill="url(#chartGradient)" stroke="none" />

                            <path :d="pathD" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                            <circle v-for="(p, i) in chartPoints" :key="i" :cx="p.x" :cy="p.y" r="3" fill="#1e293b" stroke="#6366f1" stroke-width="2" />
                            <text v-for="(p, i) in chartPoints" :key="'v'+i" :x="p.x + 6" :y="p.y - 6" fill="#cbd5e1" font-size="10" font-family="monospace">{{ formatNumber(history[i].price) }}</text>
                        </svg>
                        <p class="text-slate-500 text-xs mt-2 text-right font-mono">Точки данных: {{ history.length }}</p>
                    </div>
                    <div v-else class="text-slate-400 py-8 text-center bg-slate-800/50 rounded-lg border border-slate-700/50 border-dashed">Нет исторических данных</div>
                </div>

                <!-- Description -->
                <div class="bg-slate-800/40 backdrop-blur-xl p-6 rounded-xl border border-slate-700/50 shadow-lg" v-if="track.wiki">
                    <h3 class="text-lg font-bold text-white mb-4">Об активе</h3>
                    <div class="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-light">{{ sanitizedWiki }}</div>
                </div>
            </div>
        </div>
    </main>
  </div>
</template>
