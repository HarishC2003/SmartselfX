import api from './authService';

export const healthService = {
    getHealth: async () => {
        const { data } = await api.get('/health');
        return data;
    },
    ping: async () => {
        const { data } = await api.get('/health/ping');
        return data;
    }
};

export default healthService;
