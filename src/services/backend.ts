import axios from 'axios';

const backendApi = axios.create({
    baseURL: 'https://soundstock.onrender.com',
});

// Interceptor to add token to headers
backendApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default {
    login(email: string, password: string) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        return backendApi.post('/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    },

    register(email: string, password: string) {
        return backendApi.post('/register', { email, password });
    },

    getPortfolio() {
        return backendApi.get('/portfolio');
    },

    addToPortfolio(item: { artist_name: string; track_name: string; image_url?: string; mbid?: string; current_price: number }) {
        return backendApi.post('/portfolio', item);
    },

    removeFromPortfolio(trackName: string, currentPrice: number) {
        return backendApi.delete(`/portfolio/${encodeURIComponent(trackName)}?current_price=${encodeURIComponent(currentPrice)}`);
    }
    ,
    getMe() {
        return backendApi.get('/me');
    },
    updateMe(payload: { display_name?: string; avatar_url?: string }) {
        return backendApi.put('/me', payload);
    },
    changePassword(old_password: string, new_password: string) {
        return backendApi.post('/me/password', { old_password, new_password });
    },
    deleteMe() {
        return backendApi.delete('/me');
    },
    resetAccount() {
        return backendApi.post('/me/reset');
    },
    getLeaderboard() {
        return backendApi.get('/leaderboard');
    },
    getTrackHistory(artist: string, track: string) {
        return backendApi.get(`/history/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
    },
    getMarketSnapshot() {
        return backendApi.get('/market/snapshot');
    },
    getTransactions(page: number = 1, size: number = 50) {
        return backendApi.get('/transactions', { params: { page, size } });
    }
};
