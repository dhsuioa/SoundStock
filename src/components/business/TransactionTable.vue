<script setup lang="ts">
import { computed } from 'vue';

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

const props = defineProps<{
  transactions: Tx[]
  total?: number
  page?: number
  pageSize?: number
}>()

const emit = defineEmits(['update:page', 'update:pageSize'])

const totalPages = computed(() => Math.ceil((props.total || 0) / (props.pageSize || 10)))
const hasPagination = computed(() => (props.total !== undefined && props.page !== undefined))

const isPositive = (t: Tx) => t.transaction_type === 'SELL' || t.transaction_type === 'DIVIDEND'
const formatAmount = (t: Tx) => {
  const sign = isPositive(t) ? '+' : '-'
  const v = Math.round(t.amount)
  return `${sign} $${v.toLocaleString('en-US')}`
}
</script>

<template>
  <div class="flex flex-col space-y-4">
    <!-- Desktop Table View -->
    <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl shadow-xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-800/50">
            <th class="px-6 py-4">Дата</th>
            <th class="px-6 py-4">Тип</th>
            <th class="px-6 py-4">Детали</th>
            <th class="px-6 py-4 text-right">Сумма</th>
          </tr>
        </thead>
        <transition-group tag="tbody" name="list" class="divide-y divide-slate-700/50 text-sm">
          <tr v-for="t in transactions" :key="t.id" class="hover:bg-slate-700/30 transition-all duration-200">
            <td class="px-6 py-4 text-slate-300">{{ t.date_str }}</td>
            <td class="px-6 py-4 font-semibold"
                :class="isPositive(t) ? 'text-emerald-400' : 'text-rose-400'">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" :class="isPositive(t) ? 'bg-emerald-500/10' : 'bg-rose-500/10'">
                {{ t.transaction_type }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-300">
              <span v-if="t.artist_name && t.track_name" class="font-medium text-white">{{ t.artist_name }}</span>
              <span v-if="t.artist_name && t.track_name" class="text-slate-500 mx-1">—</span>
              <span v-if="t.artist_name && t.track_name" class="text-slate-400">{{ t.track_name }}</span>
              <span v-else class="text-slate-600 italic">Нет деталей</span>
            </td>
            <td class="px-6 py-4 text-right font-mono text-slate-200 font-medium">
              {{ formatAmount(t) }}
            </td>
          </tr>
          <tr v-if="transactions.length === 0">
            <td colspan="4" class="px-6 py-12 text-center text-slate-500">
              <div class="flex flex-col items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                 </svg>
                 <p>История операций пуста</p>
              </div>
            </td>
          </tr>
        </transition-group>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden space-y-3">
        <div v-for="t in transactions" :key="t.id" class="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-lg active:scale-[0.98] transition-all">
            <div class="flex justify-between items-start mb-3">
                <div class="flex flex-col">
                     <span class="text-xs text-slate-500 font-medium mb-1">{{ t.date_str }}</span>
                     <span class="font-bold text-xs inline-flex self-start px-2 py-0.5 rounded" 
                        :class="isPositive(t) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'">
                        {{ t.transaction_type }}
                     </span>
                </div>
                <div class="font-mono font-bold text-slate-200 text-base">
                    {{ formatAmount(t) }}
                </div>
            </div>
            <div class="text-sm text-slate-300 border-t border-slate-700/50 pt-3 mt-1">
                <span v-if="t.artist_name && t.track_name">
                  <span class="font-semibold text-white">{{ t.artist_name }}</span>
                  <span class="block text-slate-400 text-xs mt-0.5">{{ t.track_name }}</span>
                </span>
                <span v-else class="text-slate-500 italic text-xs">Нет деталей</span>
            </div>
        </div>
        <div v-if="transactions.length === 0" class="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/30 border-dashed">
            История операций пуста
        </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="hasPagination && (total || 0) > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
      <div class="flex items-center space-x-2">
        <span>Показывать по:</span>
        <select 
          :value="pageSize" 
          @change="e => emit('update:pageSize', Number((e.target as HTMLSelectElement).value))"
          class="bg-slate-800 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <span class="hidden sm:inline">Стр. {{ page }} из {{ totalPages }} (Всего {{ total }})</span>
        <div class="flex space-x-1">
          <button 
            @click="emit('update:page', (page || 1) - 1)" 
            :disabled="(page || 1) <= 1"
            class="px-3 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &larr;
          </button>
          <button 
            @click="emit('update:page', (page || 1) + 1)" 
            :disabled="(page || 1) >= totalPages"
            class="px-3 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
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
