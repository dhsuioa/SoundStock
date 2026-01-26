<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SearchModal from '../business/SearchModal.vue'

const isSearchOpen = ref(false)

const openSearchModal = () => {
  console.log('SEARCH CLICKED! Current state:', isSearchOpen.value);
  isSearchOpen.value = true;
  console.log('New state:', isSearchOpen.value);
};

const openSearch = () => openSearchModal() // Keep for compatibility if needed or replace usages
const closeSearch = () => isSearchOpen.value = false

// Keyboard shortcut (Ctrl+Shift+K or Cmd+Shift+K)
const onKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center space-x-2 group">
        <div class="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-400 transition-colors">
          S
        </div>
        <span class="text-xl font-bold text-white tracking-tight">SoundStock</span>
      </router-link>

      <!-- Search (Visual Placeholder) -->
      <div class="hidden md:flex flex-1 max-w-md mx-8 relative cursor-pointer group" @click="openSearchModal">
        <input 
            type="text" 
            readonly
            placeholder="Поиск актива..." 
            class="w-full bg-slate-800 border border-slate-700 rounded-full py-2 px-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500 pointer-events-none group-hover:bg-slate-700/50"
        />
        <span class="absolute left-3 top-2.5 text-slate-500">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <div class="absolute right-3 top-2.5">
             <kbd class="hidden sm:inline-block rounded border border-slate-600 bg-slate-900 px-1.5 font-mono text-xs font-medium text-slate-400">Ctrl Shift K</kbd>
        </div>
      </div>

      <!-- Mobile Search Icon -->
      <button @click="openSearch" class="md:hidden text-slate-400 hover:text-white p-2">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>

      <!-- Actions -->
      <div class="flex items-center space-x-4">
        <router-link to="/portfolio" class="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span class="hidden sm:block font-medium">Портфель</span>
        </router-link>
      </div>
    </div>

    <!-- Modal -->
    <SearchModal :is-open="isSearchOpen" @close="closeSearch" />
  </header>
</template>
