<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const isLogin = ref(true);
const email = ref('');
const password = ref('');
const loading = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  authStore.error = null;
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    if (isLogin.value) {
      await authStore.authLogin(email.value, password.value);
    } else {
      await authStore.authRegister(email.value, password.value);
    }
  } catch (e) {
    // Error is handled in store
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
    <!-- Ambient Background Effects -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-y-1/2"></div>
    
    <div class="max-w-md w-full bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 relative z-10 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-slate-600">
      <div class="px-8 py-10">
        <!-- Logo/Brand Header -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-3xl shadow-lg shadow-indigo-500/30 mb-6 transform transition-transform hover:scale-105">
            S
          </div>
          <h2 class="text-3xl font-bold text-white tracking-tight">{{ isLogin ? 'Вход в систему' : 'Создание аккаунта' }}</h2>
          <p class="text-slate-400 mt-3 text-base">
            {{ isLogin ? 'Продолжите свой путь инвестора' : 'Присоединяйтесь к музыкальной бирже' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 ml-1">Email</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input 
                  v-model="email" 
                  type="email" 
                  required
                  class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 ml-1">Пароль</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input 
                  v-model="password" 
                  type="password" 
                  required
                  class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div v-if="authStore.error" class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-red-400 text-sm font-medium">{{ authStore.error }}</span>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
          </button>
        </form>

        <div class="mt-8 text-center pt-6 border-t border-slate-700/50">
          <p class="text-slate-400 text-sm mb-3">{{ isLogin ? 'Впервые у нас?' : 'Уже есть аккаунт?' }}</p>
          <button @click="toggleMode" class="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors hover:underline decoration-2 underline-offset-4">
            {{ isLogin ? 'Создать аккаунт' : 'Войти в систему' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
