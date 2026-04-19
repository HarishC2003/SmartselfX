import api from './authService';

export const auditService = {
    getLogs: async (params = {}) => {
        const { data } = await api.get('/audit', { params });
        return data;
    },
    getStats: async () => {
        const { data } = await api.get('/audit/stats');
        return data;
    },
    getById: async (id) => {
        const { data } = await api.get(`/audit/${id}`);
        return data;
    }
};

export default auditService;
