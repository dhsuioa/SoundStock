<script setup lang="ts">
import { onMounted } from 'vue'
import { useMarketStore } from '../stores/market'
import TheHeader from '../components/ui/TheHeader.vue'
import MarketTable from '../components/business/MarketTable.vue'
import MarketCard from '../components/business/MarketCard.vue'

const marketStore = useMarketStore()

onMounted(() => {
  if (marketStore.assets.length === 0) {
      marketStore.fetchMarket()
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 relative overflow-hidden">
    <!-- Ambient Background Effects -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

    <TheHeader />

    <main class="container mx-auto px-4 py-8 relative z-10">
      <!-- Title Section -->
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Обзор Рынка</h1>
          <p class="text-slate-400 text-sm mt-2 flex items-center space-x-2">
            <span>Топ-50 Глобального Рынка</span>
            <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span class="flex items-center text-emerald-400">
              <span class="relative flex h-2 w-2 mr-1.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Data
            </span>
          </p>
        </div>
        <div class="hidden sm:flex flex-col items-end">
           <div class="text-xs text-slate-500 uppercase font-medium tracking-wider mb-1">Статус Рынка</div>
           <div class="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-sm">
             <div class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </div>
             <span class="text-emerald-400 font-mono text-xs font-bold tracking-wide">ОТКРЫТ 24/7</span>
           </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="marketStore.isLoading" class="animate-pulse space-y-4">
         <div v-for="i in 10" :key="i" class="h-16 bg-slate-800 rounded-lg w-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="marketStore.error" class="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-center">
        {{ marketStore.error }}
        <button @click="marketStore.fetchMarket" class="block mx-auto mt-2 text-white underline hover:text-rose-200">Retry</button>
      </div>

      <!-- Data View -->
      <div v-else>
         <!-- Desktop View -->
         <div class="hidden md:block">
            <MarketTable :assets="marketStore.assets" />
         </div>

         <!-- Mobile View -->
         <div class="md:hidden">
            <MarketCard v-for="(asset, index) in marketStore.assets" :key="asset.artist + asset.name" :asset="asset" :index="index" />
         </div>
      </div>
    </main>
  </div>
</template>
