import api from './authService';

const getExecutiveSummary = async (params) => {
    const response = await api.get('/analytics/executive-summary', { params });
    return response.data;
};

const getInventoryHealth = async (params) => {
    const response = await api.get('/analytics/inventory-health', { params });
    return response.data;
};

const getTransactionReport = async (params) => {
    const response = await api.get('/analytics/transactions', { params });
    return response.data;
};

const getPurchaseOrderReport = async (params) => {
    const response = await api.get('/analytics/purchase-orders', { params });
    return response.data;
};

const getCategoryReport = async (params) => {
    const response = await api.get('/analytics/categories', { params });
    return response.data;
};

const exportExcel = async (params) => {
    const response = await api.get('/analytics/export/excel', {
        params,
        responseType: 'blob' // Important for file downloads
    });
    
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `SmartShelfX-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
};

const exportPDF = async (params) => {
    const response = await api.get('/analytics/export/pdf', {
        params,
        responseType: 'blob' // Important for file downloads
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `SmartShelfX-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
};

const sendWeeklyReport = async (data) => {
    const response = await api.post('/analytics/send-weekly-report', data);
    return response.data;
};

const analyticsService = {
    getExecutiveSummary,
    getInventoryHealth,
    getTransactionReport,
    getPurchaseOrderReport,
    getCategoryReport,
    exportExcel,
    exportPDF,
    sendWeeklyReport
};

export default analyticsService;
