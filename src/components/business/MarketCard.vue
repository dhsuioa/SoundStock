<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatNumber } from '../../utils/formatters'

const props = defineProps({
  asset: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const changeClass = computed(() => props.asset.isPositive ? 'text-emerald-400' : 'text-rose-400')
const changeSign = computed(() => props.asset.isPositive ? '+' : '')

const goToTrack = (track) => {
  let artistName = 'Unknown';
  if (typeof track.artist === 'string') {
    artistName = track.artist;
  } else if (typeof track.artist === 'object' && track.artist !== null) {
    artistName = track.artist.name || 'Unknown';
  }

  const trackName = track.name || 'Unknown Track';

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
    class="flex items-center justify-between p-4 bg-slate-800 rounded-lg shadow-sm border border-slate-700/50 mb-3 active:scale-[0.98] transition-transform cursor-pointer">
    <div class="flex items-center space-x-3 overflow-hidden">
        <!-- Rank Badge -->
        <span class="text-xs font-mono text-slate-500 w-5">#{{ asset['@attr']?.rank }}</span>
        
        <!-- Image -->
        <img :src="asset.image" class="w-10 h-10 rounded bg-slate-900 object-cover flex-shrink-0" loading="lazy" />
        
        <!-- Info -->
        <div class="min-w-0">
            <h3 class="text-white font-bold text-sm truncate leading-tight">{{ asset.name }}</h3>
            <p class="text-slate-400 text-xs truncate">{{ asset.artist.name }}</p>
        </div>
    </div>

    <!-- Price Info -->
    <div class="text-right pl-2 flex-shrink-0">
        <div class="text-white font-mono font-medium">{{ formatNumber(asset.price) }}</div>
        <div class="text-xs font-mono" :class="changeClass">
            {{ changeSign }}{{ asset.change24h }}%
        </div>
    </div>
  </div>
</template>
