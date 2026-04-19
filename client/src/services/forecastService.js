import api from './authService';

export const forecastService = {
    /**
     * Get latest forecast for a specific product
     */
    getProductForecast: async (productId) => {
        const { data } = await api.get(`/forecast/${productId}`);
        return data;
    },

    /**
     * Manually refresh forecast for a product
     */
    refreshForecast: async (productId) => {
        const { data } = await api.post(`/forecast/${productId}/refresh`);
        return data;
    },

    /**
     * Get latest forecasts for all products with filtering/pagination
     */
    getAllForecasts: async (params = {}) => {
        const { data } = await api.get('/forecast', { params });
        return data;
    },

    /**
     * Get global forecasting summary metrics
     */
    getForecastSummary: async () => {
        const { data } = await api.get('/forecast/summary');
        return data;
    }
};
