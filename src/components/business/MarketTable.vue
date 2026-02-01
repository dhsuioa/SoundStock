<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMarketStore } from '../../stores/market'
import { formatNumber, formatCompactNumber } from '../../utils/formatters'
import { EnrichedTrack } from '../../types'

const props = defineProps<{
  assets: EnrichedTrack[]
}>()

const router = useRouter()
const marketStore = useMarketStore()

import { gsap } from 'gsap'

const togglePortfolio = async (event: Event, asset: EnrichedTrack) => {
  event.stopPropagation(); // Prevent navigation to track details
  const target = event.currentTarget as HTMLElement
  if (marketStore.isInPortfolio(asset)) {
    await marketStore.removeFromPortfolio(asset);
  } else {
    try {
      await marketStore.addToPortfolio(asset);
    } catch (e: any) {
      if (e?.code === 'INSUFFICIENT_FUNDS') {
        gsap.fromTo(target, { x: 0 }, { x: -8, yoyo: true, repeat: 3, duration: 0.08 });
        target.classList.add('ring-2','ring-rose-500')
        setTimeout(() => target.classList.remove('ring-2','ring-rose-500'), 700)
      }
    }
  }
};

const goToTrack = (track: EnrichedTrack) => {
  // Artist is already normalized to string in EnrichedTrack
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
  <div class="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl shadow-xl">
    <table class="w-full text-left border-collapse">
      <!-- Header -->
      <thead>
        <tr class="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-800/50">
          <th class="px-6 py-4 w-12 text-center">#</th>
          <th class="px-6 py-4">Актив</th>
          <th class="px-6 py-4 text-right">Цена (Просл.)</th>
          <th class="px-6 py-4 text-right">Сут. %</th>
          <th class="px-6 py-4 text-right hidden md:table-cell">Див/10м</th>
          <th class="px-6 py-4 text-right hidden md:table-cell">Объем</th>
          <th class="px-6 py-4 text-right hidden lg:table-cell">Капитализация</th>
          <th class="px-6 py-4 text-center">Действие</th>
        </tr>
      </thead>
      
      <!-- Body -->
      <transition-group tag="tbody" name="list" class="divide-y divide-slate-700/50 text-sm">
        <tr v-for="(asset, index) in assets" :key="asset.mbid || asset.name" 
            @click="goToTrack(asset)"
            class="hover:bg-slate-700/30 transition-all duration-200 group cursor-pointer relative">
            
            <!-- Rank -->
            <td class="px-6 py-4 text-center font-mono text-slate-500 font-medium">
                {{ index + 1 }}
            </td>

            <!-- Asset (Image + Name) -->
            <td class="px-6 py-4">
                <div class="flex items-center space-x-4">
                    <div class="relative group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img :src="asset.image" class="relative w-10 h-10 rounded-lg bg-slate-900 object-cover shadow-lg border border-slate-700/50" loading="lazy" />
                    </div>
                    <div>
                        <div class="font-bold text-white group-hover:text-indigo-400 transition-colors text-base">{{ asset.name }}</div>
                        <div class="text-slate-400 text-xs font-medium">{{ asset.artist }}</div>
                    </div>
                </div>
            </td>

            <!-- Price -->
            <td class="px-6 py-4 text-right font-mono text-slate-200">
                {{ formatNumber(asset.price) }}
            </td>

            <!-- Change -->
            <td class="px-6 py-4 text-right font-mono" :class="asset.isPositive ? 'text-emerald-400' : 'text-rose-400'">
                <span v-if="asset.isPositive">▲</span>
                <span v-else>▼</span>
                {{ Math.abs(parseFloat(asset.change24h)) }}%
            </td>

            <!-- Dividends per 10m -->
            <td class="px-6 py-4 text-right font-mono text-slate-300 hidden md:table-cell whitespace-nowrap tabular-nums">
                ${{ formatNumber(Math.floor((asset.price || 0) * 0.01)) }} <span class="text-slate-500 text-[11px] ml-2">/10м</span>
            </td>

            <!-- Volume -->
            <td class="px-6 py-4 text-right font-mono text-slate-400 hidden md:table-cell">
                {{ formatNumber(asset.volume) }}
            </td>

             <!-- "Market Cap" (Fake mult) -->
             <td class="px-6 py-4 text-right font-mono text-slate-400 hidden lg:table-cell">
                ${{ formatCompactNumber(asset.price * asset.volume / 1000) }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-center">
                 <button 
                  @click="togglePortfolio($event, asset)"
                  class="transition-colors p-1 rounded-full hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="marketStore.isInPortfolio(asset) ? 'text-slate-400 hover:text-rose-300' : 'text-slate-500 hover:text-emerald-400'"
                  :disabled="marketStore.isPending(asset)"
                 >
                    <!-- Icon for Remove (-) if in portfolio -->
                    <svg v-if="marketStore.isPending(asset)" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z" />
                    </svg>
                    <svg v-else-if="marketStore.isInPortfolio(asset)" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>

                    <!-- Icon for Add (+) if not in portfolio -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                 </button>
            </td>
        </tr>
      </transition-group>
    </table>
  </div>
</template>

<style scoped>
.list-enter-active, .list-leave-active {
  transition: all 0.2s;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
