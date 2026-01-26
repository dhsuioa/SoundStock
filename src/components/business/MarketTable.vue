<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '../../stores/market'
import { formatNumber, formatCompactNumber } from '../../utils/formatters'

const props = defineProps({
  assets: {
    type: Array,
    required: true
  }
})

const router = useRouter()
const marketStore = useMarketStore()
const getChangeClass = (val) => val > 0 ? 'text-emerald-400' : 'text-rose-400';

const togglePortfolio = (event, asset) => {
  event.stopPropagation(); // Prevent navigation to track details
  if (marketStore.isInPortfolio(asset)) {
    marketStore.removeFromPortfolio(asset);
  } else {
    marketStore.addToPortfolio(asset);
  }
};

const goToTrack = (track) => {
  // 1. Безопасно достаем имя артиста
  let artistName = 'Unknown';

  if (typeof track.artist === 'string') {
    artistName = track.artist;
  } else if (typeof track.artist === 'object' && track.artist !== null) {
    artistName = track.artist.name || 'Unknown';
  }

  // 2. Безопасно достаем название трека
  const trackName = track.name || 'Unknown Track';

  console.log('Navigating to:', artistName, '-', trackName); // Лог для проверки

  // 3. Переход
  router.push({
    name: 'TrackDetails', // Current router config uses 'TrackDetails'
    params: {
      artist: artistName,
      track: trackName
    }
  });
};
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/50">
    <table class="w-full text-left border-collapse">
      <!-- Header -->
      <thead>
        <tr class="text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700">
          <th class="px-6 py-4 w-12 text-center">#</th>
          <th class="px-6 py-4">Актив</th>
          <th class="px-6 py-4 text-right">Цена (Просл.)</th>
          <th class="px-6 py-4 text-right">Сут. %</th>
          <th class="px-6 py-4 text-right hidden md:table-cell">Объем</th>
          <th class="px-6 py-4 text-right hidden lg:table-cell">Капитализация</th>
          <th class="px-6 py-4 text-center">Действие</th>
        </tr>
      </thead>
      
      <!-- Body -->
      <tbody class="divide-y divide-slate-700/50 text-sm">
        <tr v-for="(asset, index) in assets" :key="asset.mbid || asset.name" 
            @click="goToTrack(asset)"
            class="hover:bg-slate-700/30 transition-colors group cursor-pointer">
            
            <!-- Rank -->
            <td class="px-6 py-4 text-center font-mono text-slate-500">
                {{ index + 1 }}
            </td>

            <!-- Asset (Image + Name) -->
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <img :src="asset.image" class="w-10 h-10 rounded bg-slate-900 object-cover" loading="lazy" />
                    <div>
                        <div class="font-bold text-white group-hover:text-indigo-400 transition-colors">{{ asset.name }}</div>
                        <div class="text-slate-400 text-xs">{{ asset.artist }}</div>
                    </div>
                </div>
            </td>

            <!-- Price -->
            <td class="px-6 py-4 text-right font-mono text-slate-200">
                {{ formatNumber(asset.price) }}
            </td>

            <!-- Change -->
            <td class="px-6 py-4 text-right font-mono" :class="getChangeClass(asset.change24h)">
                <span v-if="asset.isPositive">▲</span>
                <span v-else>▼</span>
                {{ Math.abs(asset.change24h) }}%
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
                  class="transition-colors p-1 rounded-full hover:bg-slate-600/50"
                  :class="marketStore.isInPortfolio(asset) ? 'text-slate-400 hover:text-rose-300' : 'text-slate-500 hover:text-emerald-400'"
                 >
                    <!-- Icon for Remove (-) if in portfolio -->
                    <svg v-if="marketStore.isInPortfolio(asset)" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>

                    <!-- Icon for Add (+) if not in portfolio -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                 </button>
            </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
