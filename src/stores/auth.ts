import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import backendApi from '../services/backend';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<{ email: string } | null>(null);
    const token = ref<string | null>(localStorage.getItem('token'));
    const error = ref<string | null>(null);

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

    return {
        user,
        token,
        isAuthenticated,
        error,
        authLogin,
        authRegister,
        logout
    };
});
