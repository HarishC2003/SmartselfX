import api from './authService';

export const reportService = {
    getDashboardKPIs: async () => {
        const response = await api.get('/reports/dashboard-kpis');
        return response.data;
    },

    getInventoryHealth: async () => {
        const response = await api.get('/reports/inventory-health');
        return response.data;
    },

    getPurchaseVsSales: async () => {
        const response = await api.get('/reports/purchase-sales-comparison');
        return response.data;
    },

    getTopPerformers: async () => {
        const response = await api.get('/reports/top-performers');
        return response.data;
    },

    downloadExport: async (type, format) => {
        const response = await api.get(`/reports/export?type=${type}&format=${format}`, {
            responseType: 'blob'
        });

        // Create a blob from the response data
        const blob = new Blob([response.data], {
            type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `${type}_report.${format}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch.length === 2) {
                filename = filenameMatch[1];
            }
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
};
