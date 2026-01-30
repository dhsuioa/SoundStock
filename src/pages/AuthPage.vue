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
  <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4">
    <div class="max-w-md w-full bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
      <div class="px-6 py-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-white">{{ isLogin ? 'Вход' : 'Регистрация' }}</h2>
          <p class="text-slate-400 mt-2">
            {{ isLogin ? 'Добро пожаловать обратно!' : 'Создайте аккаунт, чтобы начать инвестировать' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input 
              v-model="email" 
              type="email" 
              required
              class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Пароль</label>
            <input 
              v-model="password" 
              type="password" 
              required
              class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div v-if="authStore.error" class="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {{ authStore.error }}
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button @click="toggleMode" class="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            {{ isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
