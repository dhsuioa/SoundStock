<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useMarketStore } from '../stores/market'
import { formatNumber } from '../utils/formatters'
import TheHeader from '../components/ui/TheHeader.vue'
import MarketTable from '../components/business/MarketTable.vue'
import MarketCard from '../components/business/MarketCard.vue'
import TransactionTable from '../components/business/TransactionTable.vue'
import backendApi from '../services/backend'
import { useAuthStore } from '../stores/auth'

const marketStore = useMarketStore()

const portfolioValue = computed(() => marketStore.portfolioValue)
const hasAssets = computed(() => marketStore.portfolio.length > 0)
const initialValue = ref<number>(0)
const changePercent = computed(() => {
  const start = initialValue.value
  const current = portfolioValue.value
  if (!start || start <= 0) return 0
  return Math.round(((current - start) / start) * 100)
})

onMounted(() => {
  marketStore.loadPortfolio()
  loadTransactions()
  loadInitialValue()
})

type Tx = {
  id: number
  user_id: number
  track_name?: string | null
  artist_name?: string | null
  transaction_type: 'BUY' | 'SELL' | 'DIVIDEND'
  amount: number
  timestamp: string
  date_str: string
}
const transactions = ref<Tx[]>([])
const txError = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
let refreshTimer: any = null

const loadTransactions = async () => {
  txError.value = null
  try {
    const r = await backendApi.getTransactions(page.value, pageSize.value)
    // Handle both old array format (just in case) and new object format
    if (Array.isArray(r.data)) {
        transactions.value = r.data
        totalItems.value = r.data.length
    } else {
        transactions.value = r.data.items || []
        totalItems.value = r.data.total || 0
    }
  } catch (e: any) {
    txError.value = 'Не удалось загрузить историю операций'
  }
}

const onPageChange = (p: number) => {
    page.value = p
    loadTransactions()
}

const onPageSizeChange = (s: number) => {
    pageSize.value = s
    page.value = 1
    loadTransactions()
}
const loadInitialValue = async () => {
  try {
    const r = await backendApi.getPortfolio()
    const items = r.data || []
    initialValue.value = items.reduce((sum: number, it: any) => {
      const p = typeof it.purchase_price === 'number' ? it.purchase_price : 0
      return sum + p
    }, 0)
  } catch {}
}
const authStore = useAuthStore()
watch(() => marketStore.portfolio.length, () => {
  loadTransactions()
})
watch(() => authStore.user?.balance, (n, o) => {
  if (typeof n === 'number' && n !== o) {
    loadTransactions()
  }
})
onMounted(() => {
  refreshTimer = setInterval(loadTransactions, 60000)
})
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 relative overflow-hidden">
    <!-- Ambient Background Effects -->
    <div class="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
    <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

    <TheHeader />

    <main class="container mx-auto px-4 py-8 relative z-10">
      
      <!-- Header Stats -->
      <div v-if="hasAssets" class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 mb-8 border border-slate-700/50 shadow-2xl relative overflow-hidden group">
        <!-- Glow Effect -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
        
        <div class="relative z-10">
            <h2 class="text-slate-400 font-medium uppercase tracking-wider text-xs sm:text-sm mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Общая стоимость портфеля
            </h2>
            <div class="text-3xl sm:text-4xl md:text-6xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 font-bold tracking-tight">
                {{ formatNumber(portfolioValue) }} <span class="text-lg md:text-2xl text-slate-500 font-normal">PLAYS</span>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-3">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                  :class="changePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/50'"
                >
                  <span v-if="changePercent >= 0" class="mr-1">▲</span>
                  <span v-else class="mr-1">▼</span>
                  {{ Math.abs(changePercent) }}%
                </span>
                <span class="text-slate-400 text-sm">С момента открытия</span>
            </div>
        </div>
        <!-- Decorative bg -->
        <div class="absolute right-0 bottom-0 opacity-5 pointer-events-none">
            <svg class="h-64 w-64 text-white transform translate-x-12 translate-y-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.95V5h-2.93v2.66c-1.8.46-2.46 1.32-2.46 2.32 0 1.61 1.54 2.39 3.53 2.82 1.95.42 2.36 1.05 2.36 1.8 0 .86-.88 1.51-2.22 1.51-1.57 0-2.07-.75-2.12-1.72H6.96c.07 1.65 1.14 2.76 2.97 3.19V19h2.93v-2.75c1.9-.45 2.53-1.4 2.53-2.33 0-1.68-1.54-2.42-3.88-2.92z"/></svg>
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
            <MarketCard v-for="(asset, index) in marketStore.portfolio" :key="asset.artist + asset.name" :asset="asset" :index="index" />
         </div>

         <!-- Transactions -->
         <div class="mt-10">
            <h3 class="text-xl font-bold text-white mb-4">История Операций</h3>
            <div v-if="txError" class="p-3 rounded bg-rose-500/10 border border-rose-500/50 text-rose-400 mb-4">
              {{ txError }}
            </div>
            <TransactionTable 
                :transactions="transactions" 
                :total="totalItems"
                :page="page"
                :page-size="pageSize"
                @update:page="onPageChange"
                @update:page-size="onPageSizeChange"
            />
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
