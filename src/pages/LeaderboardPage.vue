<script setup lang="ts">
import { ref, onMounted } from 'vue'
import backendApi from '../services/backend'
import TheHeader from '../components/ui/TheHeader.vue'
import { useAuthStore } from '../stores/auth'

type LeaderItem = {
  rank: number
  username: string
  net_worth: number
  balance: number
  total_dividends: number
  avatar_url?: string | null
}

const rows = ref<LeaderItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const auth = useAuthStore()

const fetchLeaderboard = async () => {
  loading.value = true
  error.value = null
  try {
    const r = await backendApi.getLeaderboard()
    rows.value = r.data || []
  } catch (e: any) {
    error.value = 'Не удалось загрузить лидерборд'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLeaderboard)
</script>

<template>
  <div class="min-h-screen bg-slate-900 relative overflow-hidden">
    <!-- Ambient Background Effects -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

    <TheHeader />

    <main class="container mx-auto px-4 py-8 relative z-10">
      <div class="mb-8 flex items-end justify-between">
         <div>
            <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Лидерборд</h1>
            <p class="text-slate-400 text-sm mt-2">Топ инвесторов по стоимости активов</p>
         </div>
      </div>

      <div v-if="error" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/50 text-rose-400 mb-6 text-center">
        {{ error }}
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl shadow-xl">
        <table class="min-w-full text-left border-collapse">
          <thead>
            <tr class="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-800/50">
              <th class="px-6 py-4 w-16 text-center">Место</th>
              <th class="px-6 py-4">Инвестор</th>
              <th class="px-6 py-4 text-right">Состояние</th>
              <th class="px-6 py-4 text-right">Баланс</th>
              <th class="px-6 py-4 text-right">Дивиденды</th>
            </tr>
          </thead>
          <transition-group tag="tbody" name="list" class="divide-y divide-slate-700/50 text-sm">
            <tr v-for="(u,i) in rows" :key="u.rank"
                :class="[
                  (auth.user?.display_name === u.username || auth.user?.email === u.username) ? 'bg-indigo-500/10 hover:bg-indigo-500/20' : 'hover:bg-slate-700/30',
                  'transition-colors duration-200'
                ]">
              <td class="px-6 py-4 text-center">
                 <div class="flex items-center justify-center">
                    <span v-if="i === 0" class="text-2xl" title="1-е место">🥇</span>
                    <span v-else-if="i === 1" class="text-2xl" title="2-е место">🥈</span>
                    <span v-else-if="i === 2" class="text-2xl" title="3-е место">🥉</span>
                    <span v-else class="font-mono font-bold text-slate-500 text-lg">#{{ u.rank }}</span>
                 </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-4">
                  <div class="relative">
                     <div v-if="i < 3" class="absolute -inset-1 rounded-full blur opacity-50" 
                        :class="i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-300' : 'bg-amber-600'"></div>
                     <img v-if="u.avatar_url" :src="u.avatar_url" class="relative h-10 w-10 rounded-full border-2 bg-slate-800 object-cover" 
                        :class="i === 0 ? 'border-yellow-400' : i === 1 ? 'border-slate-300' : i === 2 ? 'border-amber-600' : 'border-slate-700'"
                     />
                     <div v-else class="relative h-10 w-10 rounded-full border-2 bg-slate-800 flex items-center justify-center text-slate-400 font-bold"
                        :class="i === 0 ? 'border-yellow-400' : i === 1 ? 'border-slate-300' : i === 2 ? 'border-amber-600' : 'border-slate-700'"
                     >
                        {{ u.username.charAt(0).toUpperCase() }}
                     </div>
                  </div>
                  
                  <div>
                      <div class="font-bold text-base" 
                        :class="[
                            (auth.user?.display_name === u.username || auth.user?.email === u.username) ? 'text-indigo-300' : 'text-white'
                        ]">
                        {{ u.username }} 
                        <span v-if="auth.user?.display_name === u.username || auth.user?.email === u.username" class="ml-2 text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">ВЫ</span>
                      </div>
                      <div class="text-xs text-slate-500 font-medium">Ранг #{{ u.rank }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="font-mono font-bold text-base text-indigo-400">
                    ${{ Math.round(u.net_worth).toLocaleString('en-US') }}
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="font-mono font-bold text-base text-emerald-400">
                    ${{ Math.round(u.balance).toLocaleString('en-US') }}
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="font-mono font-bold text-base text-amber-400">
                    ${{ Math.round(u.total_dividends).toLocaleString('en-US') }}
                </div>
              </td>
            </tr>
          </transition-group>
        </table>
      </div>
    </main>
  </div>
</template>
