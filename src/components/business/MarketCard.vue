<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatNumber } from '../../utils/formatters'
import { EnrichedTrack } from '../../types'

const props = defineProps<{
  asset: EnrichedTrack
  index?: number
}>()

const router = useRouter()
const changeClass = computed(() => props.asset.isPositive ? 'text-emerald-400' : 'text-rose-400')
const changeSign = computed(() => props.asset.isPositive ? '+' : '')
const divPerPayout = computed(() => Math.floor((props.asset.price || 0) * 0.01))
const divPerDay = computed(() => Math.floor(divPerPayout.value * 144))
const displayRank = computed(() => {
  if (props.index !== undefined) return props.index + 1
  return props.asset['@attr']?.rank
})

const goToTrack = (track: EnrichedTrack) => {
  const artistName = track.artist;
  const trackName = track.name;

  router.push({
    name: 'TrackDetails',
    params: {
      artist: artistName,
      track: trackName
    }
  });
};
</script>

<template>
  <div 
    @click="goToTrack(asset)"
    class="flex items-center justify-between p-4 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 mb-3 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:border-indigo-500/30 hover:shadow-indigo-500/10 relative overflow-hidden group">
    
    <!-- Hover Glow -->
    <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

    <div class="flex items-center space-x-4 overflow-hidden relative z-10">
        <!-- Rank Badge -->
        <span class="text-xs font-mono font-medium text-slate-500 w-6 flex-shrink-0">#{{ asset['@attr']?.rank }}</span>
        
        <!-- Image -->
        <div class="relative">
            <img :src="asset.image" class="w-12 h-12 rounded-lg bg-slate-900 object-cover flex-shrink-0 shadow-md border border-slate-700/50" loading="lazy" />
        </div>
        
        <!-- Info -->
        <div class="min-w-0">
            <h3 class="text-white font-bold text-sm truncate leading-tight group-hover:text-indigo-400 transition-colors">{{ asset.name }}</h3>
            <p class="text-slate-400 text-xs truncate mt-0.5">{{ asset.artist }}</p>
            <div class="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
              <span class="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-400 font-medium">${{ formatNumber(divPerPayout) }}/10м</span>
            </div>
        </div>
    </div>

    <!-- Price Info -->
    <div class="text-right pl-3 flex-shrink-0 relative z-10">
        <div class="text-white font-mono font-bold text-sm">{{ formatNumber(asset.price) }}</div>
        <div class="text-xs font-mono font-medium mt-0.5" :class="changeClass">
            {{ changeSign }}{{ asset.change24h }}%
        </div>
    </div>
  </div>
</template>
