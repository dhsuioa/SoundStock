<script setup lang="ts">
import ToastNotification from './components/ui/ToastNotification.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-slate-200 font-sans antialiased">
    <RouterView />
    <ToastNotification />
  </div>
</template>
