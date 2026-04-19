import api from './authService';

export const settingsService = {
    // Profile
    getProfile: async () => {
        const { data } = await api.get('/settings/profile');
        return data;
    },
    updateProfile: async (profileData) => {
        const { data } = await api.put('/settings/profile', profileData);
        return data;
    },
    changePassword: async (passwordData) => {
        const { data } = await api.put('/settings/password', passwordData);
        return data;
    },

    // System Settings (Admin)
    getAll: async () => {
        const { data } = await api.get('/settings');
        return data;
    },
    update: async (settings) => {
        const { data } = await api.put('/settings', { settings });
        return data;
    },
    seed: async () => {
        const { data } = await api.post('/settings/seed');
        return data;
    },

    // Notifications
    getNotificationPrefs: async () => {
        const { data } = await api.get('/settings/notifications');
        return data;
    },
};

export default settingsService;
