<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import SearchModal from '../business/SearchModal.vue'
import backendApi from '../../services/backend'
import { formatNumber } from '../../utils/formatters'
 
const isSearchOpen = ref(false)
const authStore = useAuthStore()
const isMenuOpen = ref(false)
const menuEl = ref<HTMLElement | null>(null)
const portfolioItems = ref<any[]>([])
const payoutMinutes = 10
const ratePerPayout = 0.01
const nextPayout10m = computed(() => {
  return Math.floor((portfolioItems.value || []).reduce((sum, it: any) => {
    const p = typeof it.purchase_price === 'number' ? it.purchase_price : (typeof it.current_price === 'number' ? it.current_price : 0)
    return sum + p * ratePerPayout
  }, 0))
})
const nextPayoutHour = computed(() => Math.floor(nextPayout10m.value * (60 / payoutMinutes)))
const nextPayoutDay = computed(() => Math.floor(nextPayout10m.value * (24 * 60 / payoutMinutes)))

const openSearchModal = () => {
  isSearchOpen.value = true;
};

const openSearch = () => openSearchModal() // Keep for compatibility if needed or replace usages
const closeSearch = () => isSearchOpen.value = false

// Keyboard shortcut (Ctrl+Shift+K or Cmd+Shift+K)
const onKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const onGlobalClick = (e: MouseEvent) => {
  if (!isMenuOpen.value) return
  const t = e.target as Node
  if (menuEl.value && !menuEl.value.contains(t)) {
    isMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onGlobalClick))
onUnmounted(() => document.removeEventListener('click', onGlobalClick))

const toggleMenu = async () => {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value && authStore.isAuthenticated && portfolioItems.value.length === 0) {
    try {
      const r = await backendApi.getPortfolio()
      portfolioItems.value = r.data || []
    } catch {}
  }
}
const handleLogout = () => {
  authStore.logout()
}

const formatMoney = (n?: number) => {
  const v = typeof n === 'number' ? Math.round(n) : 0
  return '$' + v.toLocaleString('en-US')
}

const balanceClasses = computed(() => {
  return authStore.lastBalanceChange === 'increase'
    ? 'text-emerald-400 animate-pulse'
    : authStore.lastBalanceChange === 'decrease'
      ? 'text-rose-400 animate-pulse'
      : 'text-slate-300'
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 supports-[backdrop-filter]:bg-slate-900/60">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center space-x-3 group relative z-10">
        <div class="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
          S
        </div>
        <span class="text-xl font-bold text-white tracking-tight hidden sm:block group-hover:text-indigo-200 transition-colors">SoundStock</span>
      </router-link>

      <!-- Desktop Navigation & Search -->
      <div class="hidden md:flex flex-1 items-center justify-between mx-8">
          <!-- Search -->
          <div class="flex-1 max-w-md relative cursor-pointer group" @click="openSearchModal">
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <input 
                type="text" 
                readonly
                placeholder="Поиск актива..." 
                class="relative w-full bg-slate-800/80 border border-slate-700 rounded-full py-2 pl-10 pr-12 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500 pointer-events-none group-hover:bg-slate-800"
            />
            <span class="absolute left-3 top-2.5 text-slate-500 group-hover:text-indigo-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <div class="absolute right-3 top-2.5">
                <kbd class="hidden lg:inline-block rounded border border-slate-600/50 bg-slate-900/50 px-1.5 font-mono text-xs font-medium text-slate-400">Ctrl Shift K</kbd>
            </div>
          </div>

          <!-- Nav Links -->
          <nav class="flex items-center space-x-1 ml-6">
            <router-link to="/leaderboard" class="flex items-center space-x-2 px-4 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18M7 15l4-4 3 3 5-6" /></svg>
                <span class="font-medium">Лидерборд</span>
            </router-link>
            <router-link v-if="authStore.isAuthenticated" to="/portfolio" class="flex items-center space-x-2 px-4 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <span class="font-medium">Портфель</span>
             </router-link>
          </nav>
      </div>

      <!-- User Profile / Auth (Desktop & Mobile Compact) -->
      <div class="flex items-center ml-auto md:ml-0 gap-2">
         <!-- Mobile Search Button -->
         <button @click="openSearch" class="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </button>
        <div v-if="authStore.isAuthenticated" class="relative flex items-center" ref="menuEl">
            <button @click="toggleMenu" class="flex items-center space-x-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full pl-1.5 pr-2 md:pr-4 py-1.5 transition-all duration-200 group ring-offset-2 ring-offset-slate-900 focus:ring-2 focus:ring-indigo-500/50">
                <template v-if="authStore.user?.avatar_url">
                  <img :src="authStore.user?.avatar_url" alt="" class="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-indigo-500/50 transition-all" />
                </template>
                <template v-else>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-700 group-hover:ring-indigo-500/50 transition-all">
                      {{ ((authStore.user?.display_name || authStore.user?.email || 'U') as string).slice(0,1).toUpperCase() }}
                  </div>
                </template>
                <div class="hidden md:flex flex-col items-start text-xs leading-tight ml-1">
                    <span class="text-slate-200 font-medium max-w-[100px] truncate group-hover:text-white transition-colors">
                      {{ authStore.user?.display_name || authStore.user?.email }}
                    </span>
                    <span :class="['font-mono', balanceClasses]">
                      {{ formatMoney(authStore.user?.balance) }}
                    </span>
                </div>
                <!-- Mobile Balance Only -->
                 <span :class="['md:hidden font-mono text-xs font-semibold ml-1', balanceClasses]">
                      {{ formatMoney(authStore.user?.balance) }}
                 </span>
            </button>
            
            <!-- Dropdown Menu -->
            <div v-if="isMenuOpen" class="absolute right-0 top-14 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-4 origin-top-right z-50 transform transition-all animate-in fade-in zoom-in-95 duration-200">
               <!-- Mobile Only Nav Links inside Menu -->
               <div class="md:hidden border-b border-slate-700/50 pb-3 mb-3 space-y-1">
                   <router-link to="/leaderboard" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18h18M7 15l4-4 3 3 5-6" /></svg>
                        <span>Лидерборд</span>
                   </router-link>
                   <router-link to="/portfolio" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <span>Портфель</span>
                   </router-link>
               </div>

               <div class="flex items-center space-x-3 pb-4 border-b border-slate-700/50">
                  <template v-if="authStore.user?.avatar_url">
                    <img :src="authStore.user?.avatar_url" alt="" class="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700" />
                  </template>
                  <template v-else>
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold ring-2 ring-slate-700">
                        {{ ((authStore.user?.display_name || authStore.user?.email || 'U') as string).slice(0,1).toUpperCase() }}
                    </div>
                  </template>
                  <div class="flex-1 overflow-hidden">
                    <div class="text-white text-base font-semibold truncate">{{ authStore.user?.display_name || authStore.user?.email }}</div>
                    <div class="text-slate-400 text-xs truncate">{{ authStore.user?.email }}</div>
                  </div>
               </div>
               
               <!-- Dividends summary -->
               <div class="mt-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
                 <div class="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-3 px-1 flex items-center">
                    <svg class="w-3 h-3 mr-1.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Прогноз дивидендов
                 </div>
                 <div class="grid grid-cols-3 gap-2 text-xs font-mono">
                   <div class="bg-slate-900/80 border border-slate-700/50 rounded-lg p-2 text-center group hover:border-emerald-500/30 transition-colors">
                     <div class="text-[10px] text-slate-500 mb-0.5">10 мин</div>
                     <div class="text-emerald-400 font-semibold">${{ formatNumber(nextPayout10m) }}</div>
                   </div>
                   <div class="bg-slate-900/80 border border-slate-700/50 rounded-lg p-2 text-center group hover:border-emerald-500/30 transition-colors">
                     <div class="text-[10px] text-slate-500 mb-0.5">1 час</div>
                     <div class="text-emerald-400 font-semibold">${{ formatNumber(nextPayoutHour) }}</div>
                   </div>
                   <div class="bg-slate-900/80 border border-slate-700/50 rounded-lg p-2 text-center group hover:border-emerald-500/30 transition-colors">
                     <div class="text-[10px] text-slate-500 mb-0.5">24 ч</div>
                     <div class="text-emerald-400 font-semibold">${{ formatNumber(nextPayoutDay) }}</div>
                   </div>
                 </div>
               </div>

               <!-- Actions -->
               <div class="mt-4 space-y-1">
                 <router-link to="/profile" class="flex items-center space-x-2 w-full px-3 py-2 rounded hover:bg-slate-800 text-slate-300 text-sm transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>Настройки профиля</span>
                 </router-link>
                 <button @click="handleLogout" class="flex items-center space-x-2 w-full px-3 py-2 rounded hover:bg-rose-900/20 text-rose-400 hover:text-rose-300 text-sm transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Выйти</span>
                 </button>
               </div>
            </div>
        </div>
        
        <div v-else class="flex items-center">
            <router-link to="/auth" class="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full transition-colors shadow-lg shadow-indigo-500/20">
                Войти
            </router-link>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <SearchModal :is-open="isSearchOpen" @close="closeSearch" />
    <ToastNotification />
  </header>
</template>
