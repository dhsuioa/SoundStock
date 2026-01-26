<script setup lang="ts">
import { computed } from 'vue'
import { useMarketStore } from '../stores/market'
import { formatNumber } from '../utils/formatters'
import TheHeader from '../components/ui/TheHeader.vue'
import MarketTable from '../components/business/MarketTable.vue'
import MarketCard from '../components/business/MarketCard.vue'

const marketStore = useMarketStore()

const portfolioValue = computed(() => marketStore.portfolioValue)
const hasAssets = computed(() => marketStore.portfolio.length > 0)
</script>

<template>
  <div class="min-h-screen bg-background">
    <TheHeader />

    <main class="container mx-auto px-4 py-8">
      
      <!-- Header Stats -->
      <div v-if="hasAssets" class="bg-gradient-to-r from-indigo-900/50 to-slate-800 rounded-2xl p-8 mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div class="relative z-10">
            <h2 class="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">Общая стоимость портфеля</h2>
            <div class="text-4xl md:text-6xl font-mono text-white font-bold tracking-tight">
                {{ formatNumber(portfolioValue) }} <span class="text-lg md:text-2xl text-slate-500 font-normal">PLAYS</span>
            </div>
            <div class="mt-4 flex items-center space-x-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  ▲ 24% (fake)
                </span>
                <span class="text-slate-400 text-sm">С момента открытия</span>
            </div>
        </div>
        <!-- Decorative bg -->
        <div class="absolute right-0 bottom-0 opacity-10">
            <svg class="h-64 w-64 text-indigo-500 transform translate-x-12 translate-y-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.95V5h-2.93v2.66c-1.8.46-2.46 1.32-2.46 2.32 0 1.61 1.54 2.39 3.53 2.82 1.95.42 2.36 1.05 2.36 1.8 0 .86-.88 1.51-2.22 1.51-1.57 0-2.07-.75-2.12-1.72H6.96c.07 1.65 1.14 2.76 2.97 3.19V19h2.93v-2.75c1.9-.45 2.53-1.4 2.53-2.33 0-1.68-1.54-2.42-3.88-2.92z"/></svg>
        </div>
      </div>

      <!-- Content -->
      <div v-if="hasAssets">
         <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-white">Мои Активы <span class="text-slate-500 text-lg ml-2">{{ marketStore.portfolio.length }}</span></h3>
         </div>

         <!-- Reuse Components -->
         <div class="hidden md:block">
            <MarketTable :assets="marketStore.portfolio" />
         </div>
         <div class="md:hidden">
            <MarketCard v-for="asset in marketStore.portfolio" :key="asset.artist + asset.name" :asset="asset" />
         </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-24 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
         <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
         </div>
         <h2 class="text-3xl font-bold text-white mb-3">Ваш портфель пуст</h2>
         <p class="text-slate-400 max-w-md mx-auto mb-8">Инвестируйте в свои любимые музыкальные треки, чтобы сформировать коллекцию активов.</p>
         <router-link to="/" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            Перейти к рынку
         </router-link>
      </div>

    </main>
  </div>
</template>
