import api from './authService';

export const alertService = {
    getAlerts: async (params = {}) => {
        const { data } = await api.get('/alerts', { params });
        return data; // { alerts, unreadCount, pagination }
    },
    getAlertCount: async () => {
        const { data } = await api.get('/alerts/count');
        return data; // { unreadCount }
    },
    markRead: async (id) => {
        const { data } = await api.patch(`/alerts/${id}/read`);
        return data; // { message, alert }
    },
    markAllRead: async () => {
        const { data } = await api.patch('/alerts/read-all');
        return data; // { message, count }
    },
    dismissAlert: async (id) => {
        const { data } = await api.patch(`/alerts/${id}/dismiss`);
        return data; // { message, alert }
    }
};
