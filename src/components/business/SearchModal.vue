<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import ImageCache from '../../services/imageCache'
import { enrichTrackData } from '../../utils/marketSimulator'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const router = useRouter()

const query = ref('')
const results = ref([])
const isLoading = ref(false)
const inputRef = ref(null)
let debounceTimeout = null

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
      const rawTracks = response.data.results.trackmatches.track || []
      
      results.value = rawTracks.map(track => {
          const enriched = enrichTrackData(track);
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
        let artistName = typeof track.artist === 'string' ? track.artist : track.artist.name;
        
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

const handleSelect = (track) => {
  // 1. Безопасно достаем имя артиста
  let artistName = 'Unknown';
  if (typeof track.artist === 'string') {
    artistName = track.artist;
  } else if (typeof track.artist === 'object' && track.artist !== null) {
    artistName = track.artist.name || 'Unknown';
  }

  // 2. Безопасно достаем название трека
  const trackName = track.name || 'Unknown Track';

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
const onKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-start justify-center pt-24" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

        <div class="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl transition-all mx-4">
            
            <!-- Search Input -->
            <div class="relative border-b border-slate-700">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                    </svg>
                </div>
                <input 
                    ref="inputRef"
                    v-model="query"
                    type="text" 
                    class="h-14 w-full border-0 bg-transparent pl-11 pr-4 text-white placeholder:text-slate-500 focus:ring-0 sm:text-sm" 
                    placeholder="Поиск по тикеру, названию или артисту..."
                >
                <div v-if="isLoading" class="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>

            <!-- Results -->
            <ul v-if="results.length > 0" class="max-h-[60vh] overflow-y-auto scroll-py-2 py-2 text-sm text-slate-200 divide-y divide-slate-700/50">
                <li v-for="track in results" :key="track.url" 
                    @click="handleSelect(track)"
                    class="group flex cursor-pointer select-none items-center px-4 py-3 hover:bg-slate-700/50 transition-colors">
                    
                    <img :src="track.image" class="h-10 w-10 flex-none rounded bg-slate-900 object-cover" />
                    
                    <div class="ml-4 flex-auto">
                        <p class="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{{ track.name }}</p>
                        <p class="text-slate-400 truncate">{{ typeof track.artist === 'string' ? track.artist : track.artist.name }}</p>
                    </div>
                    
                    <div class="flex-none ml-2 text-right">
                        <span class="block font-mono font-medium text-white">{{ (track.price || 0).toLocaleString() }}</span>
                    </div>
                </li>
            </ul>

            <!-- Empty State -->
            <div v-if="query && !isLoading && results.length === 0" class="px-4 py-14 text-center sm:px-14">
                <p class="text-sm text-slate-400">Ничего не найдено по запросу "{{ query }}".</p>
            </div>
            
            <!-- Footer -->
            <div class="flex flex-wrap items-center bg-slate-900/50 px-4 py-2.5 text-xs text-data-400 border-t border-slate-700">
                <kbd class="mx-1 flex h-5 w-5 items-center justify-center rounded border border-slate-600 bg-slate-800 font-sans font-medium text-slate-400">ESC</kbd> 
                <span class="text-slate-500 mr-4">чтобы закрыть</span>
                <span class="text-slate-600">Enter to select</span>
            </div>

        </div>
    </div>
  </Teleport>
</template>
