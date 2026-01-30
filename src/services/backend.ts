import axios from 'axios';

const backendApi = axios.create({
    baseURL: 'http://localhost:8000',
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
    login(username: string, password: string) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        return backendApi.post('/token', formData);
    },

    register(email: string, password: string) {
        return backendApi.post('/register', { email, password });
    },

    getPortfolio() {
        return backendApi.get('/portfolio');
    },

    addToPortfolio(item: { artist_name: string; track_name: string; image_url?: string; mbid?: string }) {
        return backendApi.post('/portfolio', item);
    },

    removeFromPortfolio(trackName: string) {
        return backendApi.delete(`/portfolio/${encodeURIComponent(trackName)}`);
    }
};
