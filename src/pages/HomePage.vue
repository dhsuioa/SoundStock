<script setup>
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
  <div class="min-h-screen bg-background">
    <TheHeader />

    <main class="container mx-auto px-4 py-6">
      <!-- Title Section -->
      <div class="mb-6 flex items-end justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Обзор Рынка</h1>
          <p class="text-slate-400 text-sm mt-1">Топ-50 Глобального Рынка • Live Data</p>
        </div>
        <div class="text-right hidden sm:block">
           <div class="text-xs text-slate-500 uppercase font-medium">Статус Рынка</div>
           <div class="text-emerald-400 font-mono text-sm">● ОТКРЫТ 24/7</div>
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
            <MarketCard v-for="asset in marketStore.assets" :key="asset.id" :asset="asset" />
         </div>
      </div>
    </main>
  </div>
</template>
