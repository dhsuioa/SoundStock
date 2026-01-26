import axios from 'axios'

const api = axios.create({
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
})

// Request Interceptor: Inject API Key and Format
api.interceptors.request.use(config => {
    config.params = config.params || {};
    config.params.api_key = import.meta.env.VITE_LASTFM_API_KEY;
    config.params.format = 'json';
    return config;
});

// Response Interceptor: Debug
api.interceptors.response.use(response => {
    // console.log('API Raw Response:', response.config.params.method, response.data);
    return response;
}, error => {
    console.error('API Error:', error);
    return Promise.reject(error);
});

export const getTopTracks = (limit: number = 50) => {
    return api.get('', {
        params: {
            method: 'chart.gettoptracks',
            limit,
        }
    });
};

export const getTrackInfo = (artist: string, track: string) => {
    return api.get('', {
        params: {
            method: 'track.getInfo',
            artist,
            track,
        }
    });
};

export const searchTracks = (query: string, limit: number = 10) => {
    return api.get('', {
        params: {
            method: 'track.search',
            track: query,
            limit,
        }
    });
};

export default {
    getTopTracks,
    getTrackInfo,
    searchTracks,
};
