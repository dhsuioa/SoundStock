import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import backendApi from '../services/backend';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<{ email: string; display_name?: string | null; avatar_url?: string | null; balance?: number } | null>(null);
    const token = ref<string | null>(localStorage.getItem('token'));
    const error = ref<string | null>(null);
    const lastBalanceChange = ref<null | 'increase' | 'decrease'>(null);

    const isAuthenticated = computed(() => !!token.value);

    const decodeEmail = (jwt: string): string | null => {
        try {
            const base64Url = jwt.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const payload = JSON.parse(jsonPayload);
            return typeof payload.sub === 'string' ? payload.sub : null;
        } catch {
            return null;
        }
    };

    if (token.value) {
        const email = decodeEmail(token.value);
        if (email) user.value = { email };
        refreshUser().catch(() => {});
    }

    async function refreshUser() {
        try {
            const r = await backendApi.getMe();
            user.value = {
                email: r.data.email,
                display_name: r.data.display_name ?? null,
                avatar_url: r.data.avatar_url ?? null,
                balance: r.data.balance
            };
        } catch (e) {
            // ignore, most likely unauthenticated
        }
    }

    const authLogin = async (username: string, password: string) => {
        error.value = null;
        try {
            const response = await backendApi.login(username, password);
            token.value = response.data.access_token;
            localStorage.setItem('token', token.value as string);
            const { useMarketStore } = await import('./market');
            const marketStore = useMarketStore();
            marketStore.portfolio = [];
            await marketStore.loadPortfolio();
            const email = decodeEmail(token.value as string);
            user.value = email ? { email } : null;
            await refreshUser();
            router.push('/portfolio');
        } catch (err) {
            console.error('Login failed:', err);
            error.value = 'Login failed. Please check your credentials.';
            throw err;
        }
    };

    const authRegister = async (email: string, password: string) => {
        error.value = null;
        try {
            await backendApi.register(email, password);
            await authLogin(email, password);
        } catch (err) {
            console.error('Registration failed:', err);
            error.value = 'Registration failed. Email might be already taken.';
            throw err;
        }
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        import('./market').then(mod => {
            const marketStore = mod.useMarketStore();
            marketStore.portfolio = [];
        });
        router.push('/auth');
    };
    
    const updateBalance = (newBalance: number, change?: 'increase' | 'decrease') => {
        if (user.value) {
            user.value.balance = newBalance;
            lastBalanceChange.value = change ?? null;
            setTimeout(() => {
                if (lastBalanceChange.value === change) lastBalanceChange.value = null;
            }, 800);
        }
    };

    return {
        user,
        token,
        isAuthenticated,
        error,
        authLogin,
        authRegister,
        logout,
        refreshUser,
        lastBalanceChange,
        updateBalance
    };
});
