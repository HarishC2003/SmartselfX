import api from './authService';

export const transactionService = {
    stockIn: async (data) => {
        const { data: responseData } = await api.post('/transactions/stock-in', data);
        return responseData;
    },
    stockOut: async (data) => {
        const { data: responseData } = await api.post('/transactions/stock-out', data);
        return responseData;
    },
    getAllTransactions: async (params = {}) => {
        const { data } = await api.get('/transactions', { params });
        return data; // { transactions, pagination }
    },
    getTransactionById: async (id) => {
        const { data } = await api.get(`/transactions/${id}`);
        return data; // { transaction }
    },
    getTransactionSummary: async (params = {}) => {
        const { data } = await api.get('/transactions/summary', { params });
        return data; // { summary }
    },
    getProductHistory: async (productId) => {
        const { data } = await api.get(`/transactions/product/${productId}`);
        return data; // { transactions, currentStock, product }
    }
};
