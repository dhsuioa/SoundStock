<script setup lang="ts">
import { ref, onMounted } from 'vue'
import backendApi from '../services/backend'
import TheHeader from '../components/ui/TheHeader.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const displayName = ref<string>('')
const avatarUrl = ref<string>('')
const loading = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const oldPassword = ref('')
const newPassword = ref('')

const loadProfile = async () => {
  try {
    const r = await backendApi.getMe()
    displayName.value = r.data.display_name || ''
    avatarUrl.value = r.data.avatar_url || ''
  } catch (e: any) {
    error.value = 'Не удалось загрузить профиль'
  }
}

const saveProfile = async () => {
  loading.value = true
  message.value = null
  error.value = null
  try {
    await backendApi.updateMe({ display_name: displayName.value, avatar_url: avatarUrl.value })
    message.value = 'Профиль обновлен'
    await auth.refreshUser()
  } catch (e: any) {
    error.value = 'Ошибка сохранения профиля'
  } finally {
    loading.value = false
  }
}

const changePassword = async () => {
  loading.value = true
  message.value = null
  error.value = null
  try {
    await backendApi.changePassword(oldPassword.value, newPassword.value)
    message.value = 'Пароль изменен'
    oldPassword.value = ''
    newPassword.value = ''
  } catch (e: any) {
    error.value = 'Неверный текущий пароль'
  } finally {
    loading.value = false
  }
}

const showResetModal = ref(false)

const openResetModal = () => {
  showResetModal.value = true
}

const confirmReset = async () => {
  loading.value = true
  message.value = null
  error.value = null
  try {
    await backendApi.resetAccount()
    message.value = 'Прогресс успешно сброшен'
    await auth.refreshUser()
    showResetModal.value = false
  } catch (e: any) {
    error.value = 'Не удалось сбросить прогресс'
    showResetModal.value = false
  } finally {
    loading.value = false
  }
}

const deleteAccount = async () => {
  loading.value = true
  message.value = null
  error.value = null
  try {
    await backendApi.deleteMe()
    auth.logout()
  } catch (e: any) {
    error.value = 'Не удалось удалить аккаунт'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
    </div>

    <TheHeader />
    <main class="container mx-auto px-4 py-8 grid gap-8 md:grid-cols-2 relative z-10">
      <div class="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <h2 class="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Профиль</h2>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Отображаемое имя</label>
            <input v-model="displayName" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" placeholder="Введите имя" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Аватар (URL)</label>
            <input v-model="avatarUrl" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" placeholder="https://..." />
          </div>
          <button :disabled="loading" @click="saveProfile" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></span>
            Сохранить изменения
          </button>
        </div>
      </div>

      <div class="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        <h2 class="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Безопасность</h2>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Текущий пароль</label>
            <input v-model="oldPassword" type="password" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Новый пароль</label>
            <input v-model="newPassword" type="password" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" />
          </div>
          <button :disabled="loading" @click="changePassword" class="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></span>
            Обновить пароль
          </button>
        </div>
      </div>

      <div class="md:col-span-2 space-y-6">
        <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
          <div v-if="message" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {{ message }}
          </div>
        </transition>
        
        <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
          <div v-if="error" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ error }}
          </div>
        </transition>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white mb-2">Сброс прогресса</h2>
                <p class="text-slate-400 text-sm mb-4 leading-relaxed">Вернуть начальный баланс и очистить портфель. Полезно, если вы хотите начать заново с чистого листа.</p>
                <button :disabled="loading" @click="openResetModal" class="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-600/50 px-6 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.98]">
                  Сбросить результат
                </button>
              </div>
            </div>
          </div>
  
          <div class="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white mb-2">Удаление аккаунта</h2>
                <p class="text-slate-400 text-sm mb-4 leading-relaxed">Полное удаление всех данных, истории и портфеля. Это действие необратимо.</p>
                <button :disabled="loading" @click="deleteAccount" class="bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-600/50 px-6 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-rose-500/10 active:scale-[0.98]">
                  Удалить аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>


    <Teleport to="body">
      <div v-if="showResetModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" @click="showResetModal = false"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 opacity-100">
          <!-- Icon -->
          <div class="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 mb-6 mx-auto ring-8 ring-amber-500/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <!-- Text -->
          <h3 class="text-xl font-bold text-white text-center mb-3">Сбросить прогресс?</h3>
          <p class="text-slate-400 text-center mb-8 leading-relaxed">
            Вы уверены, что хотите начать заново? Ваш портфель будет очищен, а баланс восстановлен до <span class="text-white font-medium">10,000,000</span>. Это действие нельзя отменить.
          </p>
          
          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="showResetModal = false" class="flex-1 px-4 py-3 rounded-xl text-slate-300 font-medium hover:text-white hover:bg-slate-700 transition-colors">
              Отмена
            </button>
            <button @click="confirmReset" :disabled="loading" class="flex-1 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сброс...
              </span>
              <span v-else>Сбросить</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
