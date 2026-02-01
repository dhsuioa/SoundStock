import { defineStore } from 'pinia'
import { ref } from 'vue'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
    id: number
    message: string
    type: ToastType
    timeout?: number
}

export const useToastStore = defineStore('toast', () => {
    const toasts = ref<Toast[]>([])
    let counter = 0

    const show = (message: string, type: ToastType = 'info', timeout = 3000) => {
        const id = ++counter
        toasts.value.push({ id, message, type, timeout })
        if (timeout > 0) {
            setTimeout(() => dismiss(id), timeout)
        }
    }

    const dismiss = (id: number) => {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }

    return {
        toasts,
        show,
        dismiss,
    }
})
