<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import ImageCache from '../../services/imageCache'
import { enrichTrackData } from '../../utils/marketSimulator'
import { EnrichedTrack, LastFmTrack } from '../../types'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const router = useRouter()

const query = ref('')
const results = ref<EnrichedTrack[]>([])
const isLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

// Focus input when opened
watch(() => props.isOpen, async (val) => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
  } else {
    query.value = ''
    results.value = []
  }
})

// Debounced search
watch(query, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  
  if (!newVal || newVal.length < 2) {
    results.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  debounceTimeout = setTimeout(async () => {
    try {
      const response = await api.searchTracks(newVal)
      // Search API returns artist as string, but LastFmTrack interface allows it.
      // Casting to any[] to avoid strict check on partial match before enrichment
      const rawTracks = (response.data.results.trackmatches.track || []) as any[]
      
      results.value = rawTracks.map((track) => {
          // Ensure structure matches what enrichTrackData expects (mostly it does)
          const enriched = enrichTrackData(track as LastFmTrack);
          
          // Apply cache immediately if available
          const cachedImage = ImageCache.get(enriched.artist, enriched.name);
          if (cachedImage) {
              enriched.image = cachedImage;
          }
          return enriched;
      })
      
      // Start lazy loading images
      fetchImagesForResults()
      
    } catch (e) {
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }, 500)
})

const fetchImagesForResults = async () => {
  const currentResults = results.value;
  
  for (const track of currentResults) {
    // If user changed query or cleared results, stop processing old list
    if (results.value !== currentResults) break;
    
    // Skip if we already have a valid cached image
    if (ImageCache.has(track.artist, track.name)) continue;

    try {
        // EnrichedTrack always has artist as string
        const artistName = track.artist;
        
        const response = await api.getTrackInfo(artistName, track.name);
        const trackData = response.data.track;

        if (trackData && trackData.album && trackData.album.image) {
              const images = trackData.album.image;
              const bestImage = images[images.length - 1]['#text'];
              
              if (bestImage) {
                track.image = bestImage; 
                ImageCache.set(artistName, track.name, bestImage); // Save to cache
              }
        }
    } catch (ignore) {
        // Fail silently
    }
    
    // Small delay to prevent rate limits
    await new Promise(r => setTimeout(r, 100));
  }
}

const handleSelect = (track: EnrichedTrack) => {
  const artistName = track.artist;
  const trackName = track.name;

  emit('close')
  
  router.push({ 
    name: 'TrackDetails', 
    params: { 
      artist: artistName,
      track: trackName 
    } 
  })
}

// Close on escape
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
    debounceTimeout = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-start justify-center pt-24" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <transition 
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-md" @click="$emit('close')"></div>
        </transition>

        <transition 
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
            <div class="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-800/90 border border-slate-700/50 shadow-2xl ring-1 ring-white/10 mx-4 backdrop-blur-xl">
                
                <!-- Search Input -->
                <div class="relative border-b border-slate-700/50">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                        <svg class="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <input 
                        ref="inputRef"
                        v-model="query"
                        type="text" 
                        class="h-16 w-full border-0 bg-transparent pl-12 pr-12 text-white placeholder:text-slate-500 focus:ring-0 sm:text-lg font-medium" 
                        placeholder="Поиск по тикеру, названию или артисту..."
                    >
                    <div v-if="isLoading" class="absolute inset-y-0 right-0 flex items-center pr-5">
                        <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <div v-else-if="query" class="absolute inset-y-0 right-0 flex items-center pr-4">
                        <button @click="query = ''; $refs.inputRef?.focus()" class="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Results -->
                <ul v-if="results.length > 0" class="max-h-[60vh] overflow-y-auto scroll-py-2 py-2 text-sm text-slate-200 divide-y divide-slate-700/30">
                    <li v-for="track in results" :key="track.url" 
                        @click="handleSelect(track)"
                        class="group flex cursor-pointer select-none items-center px-4 py-3 hover:bg-white/5 transition-all active:bg-white/10">
                        
                        <div class="relative h-12 w-12 flex-none">
                            <img :src="track.image" class="h-full w-full rounded-lg bg-slate-800 object-cover shadow-md group-hover:scale-105 transition-transform duration-300" />
                            <div class="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10"></div>
                        </div>
                        
                        <div class="ml-4 flex-auto">
                            <p class="font-bold text-base text-white group-hover:text-indigo-400 transition-colors truncate">{{ track.name }}</p>
                            <p class="text-slate-400 truncate text-sm">{{ track.artist }}</p>
                        </div>
                        
                        <div class="flex-none ml-2 text-right">
                            <div class="font-mono font-bold text-slate-200 group-hover:text-white transition-colors bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10">
                                {{ (track.price || 0).toLocaleString() }}
                            </div>
                        </div>
                    </li>
                </ul>

                <!-- Empty State -->
                <div v-if="query && !isLoading && results.length === 0" class="px-4 py-16 text-center sm:px-14">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-4">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p class="text-slate-400 text-lg font-medium">Ничего не найдено</p>
                    <p class="text-slate-500 text-sm mt-1">Попробуйте изменить запрос "{{ query }}".</p>
                </div>
                
                <!-- Initial State -->
                <div v-if="!query && !isLoading" class="px-4 py-12 text-center">
                    <p class="text-slate-500 text-sm">Введите название трека или имя артиста для поиска</p>
                </div>
                
                <!-- Footer -->
                <div class="flex flex-wrap items-center bg-slate-900/50 px-4 py-3 text-xs text-slate-400 border-t border-slate-700/50 backdrop-blur-sm">
                    <div class="flex items-center gap-1 mr-4">
                        <kbd class="flex h-5 w-5 items-center justify-center rounded border border-slate-600 bg-slate-800 font-sans font-medium text-slate-300 shadow-sm">esc</kbd> 
                        <span>закрыть</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <kbd class="flex h-5 w-5 items-center justify-center rounded border border-slate-600 bg-slate-800 font-sans font-medium text-slate-300 shadow-sm">↵</kbd>
                        <span>выбрать</span>
                    </div>
                </div>
            </div>
        </transition>
    </div>
  </Teleport>
</template>
