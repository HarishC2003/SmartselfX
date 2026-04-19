import api from './authService';

export const productService = {
    getAllProducts: async (params = {}) => {
        const { data } = await api.get('/products', { params });
        return data;
    },

    getProductById: async (id) => {
        const { data } = await api.get(`/products/${id}`);
        return data; // returns { product }
    },

    createProduct: async (productData) => {
        const { data } = await api.post('/products', productData);
        return data;
    },

    updateProduct: async (id, productData) => {
        const { data } = await api.put(`/products/${id}`, productData);
        return data;
    },

    deleteProduct: async (id) => {
        const { data } = await api.delete(`/products/${id}`);
        return data;
    },

    getProductStats: async (params = {}) => {
        const { data } = await api.get('/products/stats', { params });
        return data; // returns { stats }
    },

    importProductsCSV: async (formData) => {
        const { data } = await api.post('/products/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },

    exportProductsCSV: async (params = {}) => {
        const response = await api.get('/products/export', {
            params,
            responseType: 'blob', // crucial for file download
        });

        // Create a blob link to trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Try to get filename from content-disposition header if available, otherwise fallback
        const contentDisposition = response.headers['content-disposition'];
        let filename = `smartshelfx-products-${new Date().toISOString().split('T')[0]}.csv`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch.length === 2) {
                filename = filenameMatch[1];
            }
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    },

    uploadProductImage: async (id, formData) => {
        const { data } = await api.post(`/products/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data; // returns { imageUrl }
    }
};
