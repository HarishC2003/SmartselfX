import api from './authService';

const declarationService = {
  // Vendor Methods
  addDeclaration: async (data) => {
    const response = await api.post('/declarations', data);
    return response.data;
  },
  getMyDeclarations: async (params) => {
    const response = await api.get('/declarations/mine', { params });
    return response.data;
  },
  updateDeclaration: async (id, data) => {
    const response = await api.put(`/declarations/${id}`, data);
    return response.data;
  },
  updateQtyOnly: async (id, availableQty) => {
    const response = await api.patch(`/declarations/${id}/qty`, { availableQty });
    return response.data;
  },
  deleteDeclaration: async (id) => {
    const response = await api.delete(`/declarations/${id}`);
    return response.data;
  },
  getAssignedProducts: async () => {
    const response = await api.get('/declarations/assigned');
    return response.data;
  },
  rejectAssignment: async (productId, reason) => {
    const response = await api.post('/declarations/reject-assignment', { productId, reason });
    return response.data;
  },

  // Admin / Manager Methods
  searchVendorsForProduct: async (query) => {
    const response = await api.get('/declarations/search', { params: { q: query } });
    return response.data;
  },
  getAllDeclarations: async (params) => {
    const response = await api.get('/declarations', { params });
    return response.data;
  }
};

export default declarationService;
