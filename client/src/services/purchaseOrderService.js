import api from './authService';

export const purchaseOrderService = {
    getAllPOs: async (params = {}) => {
        const response = await api.get('/purchase-orders', { params });
        return response.data;
    },

    getPOById: async (id, vendorToken = null) => {
        const url = vendorToken ? `/purchase-orders/${id}?vendorToken=${vendorToken}` : `/purchase-orders/${id}`;
        const response = await api.get(url);
        return response.data;
    },

    createPO: async (data) => {
        const response = await api.post('/purchase-orders', data);
        return response.data;
    },

    approvePO: async (id, data, vendorToken = null) => {
        const url = vendorToken ? `/purchase-orders/${id}/approve?vendorToken=${vendorToken}` : `/purchase-orders/${id}/approve`;
        const response = await api.patch(url, data);
        return response.data;
    },

    rejectPO: async (id, data, vendorToken = null) => {
        const url = vendorToken ? `/purchase-orders/${id}/reject?vendorToken=${vendorToken}` : `/purchase-orders/${id}/reject`;
        const response = await api.patch(url, data);
        return response.data;
    },

    markDispatched: async (id) => {
        const response = await api.patch(`/purchase-orders/${id}/dispatch`);
        return response.data;
    },

    markReceived: async (id, data) => {
        const response = await api.patch(`/purchase-orders/${id}/receive`, data);
        return response.data;
    },

    cancelPO: async (id, data) => {
        const response = await api.patch(`/purchase-orders/${id}/cancel`, data);
        return response.data;
    },

    getPOStats: async () => {
        const response = await api.get('/purchase-orders/stats');
        return response.data;
    },

    getAIRecommendations: async () => {
        const response = await api.get('/purchase-orders/recommendations');
        return response.data;
    }
};
