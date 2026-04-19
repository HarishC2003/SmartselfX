import api from './authService';

export const searchService = {
    search: async (query, type = 'all', limit = 20) => {
        const { data } = await api.get('/search', { params: { q: query, type, limit } });
        return data;
    }
};

export default searchService;
