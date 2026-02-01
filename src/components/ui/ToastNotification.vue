<script setup lang="ts">
import { computed } from 'vue'
import { useToastStore } from '../../stores/toast'

const store = useToastStore()
const toasts = computed(() => store.toasts)

const classes = (type: 'success' | 'error' | 'info') => {
  if (type === 'success') return 'bg-emerald-600/90 border-emerald-500/50 shadow-emerald-500/20'
  if (type === 'error') return 'bg-rose-600/90 border-rose-500/50 shadow-rose-500/20'
  return 'bg-slate-700/90 border-slate-600/50 shadow-slate-500/20'
}

const icon = (type: 'success' | 'error' | 'info') => {
  if (type === 'success') return '✓'
  if (type === 'error') return '!'
  return 'i'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-20 right-4 z-[10000] space-y-3 pointer-events-none">
      <transition-group 
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-8 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 translate-x-8 scale-95"
      >
        <div v-for="t in toasts" :key="t.id"
             :class="['pointer-events-auto flex items-center w-full max-w-sm rounded-xl border shadow-xl backdrop-blur-md p-4 pr-10 relative overflow-hidden', classes(t.type)]">
          
          <!-- Icon -->
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white mr-3 shadow-inner">
             <svg v-if="t.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
             </svg>
             <svg v-else-if="t.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
             </svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
             </svg>
          </div>

          <div class="text-white font-medium text-sm leading-tight">
            {{ t.message }}
          </div>
          
          <!-- Close button -->
          <button @click="$event.stopPropagation(); store.dismiss(t.id)"
                  class="absolute top-2 right-2 p-1 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Progress bar/Accent -->
          <div class="absolute bottom-0 left-0 h-1 bg-white/20 w-full"></div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

