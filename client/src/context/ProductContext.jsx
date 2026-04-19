import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
    products: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1
    },
    stats: null,
    categories: [],
    filters: {
        search: '',
        category: '',
        vendor: '',
        stockStatus: '',
        isActive: '',
        isPerishable: '',
        minStock: '',
        maxStock: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 50
    },
    isLoading: false,
    error: null
};

// Reducer functions
const productReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_PRODUCTS':
            return {
                ...state,
                products: action.payload.products,
                pagination: action.payload.pagination,
                isLoading: false,
                error: null
            };
        case 'SET_STATS':
            return { ...state, stats: action.payload };
        case 'SET_CATEGORIES':
            return { ...state, categories: action.payload };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.payload } };
        default:
            return state;
    }
};

// Create Context
const ProductContext = createContext();

// Provider Component
export const ProductProvider = ({ children }) => {
    const [state, dispatch] = useReducer(productReducer, initialState);
    let isAuthenticated = false;
    try {
        const auth = useAuth();
        isAuthenticated = auth?.isAuthenticated;
    } catch (e) {
        isAuthenticated = false;
    }

    // Fetch Products based on current filters
    const fetchProducts = useCallback(async (overrideFilters = null) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            // Allow bypassing state filters if specific ones are passed
            const queryParams = overrideFilters || state.filters;

            // Clean empty params before sending
            const cleanParams = Object.fromEntries(
                Object.entries(queryParams).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );

            const data = await productService.getAllProducts(cleanParams);

            dispatch({ type: 'SET_PRODUCTS', payload: data });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch products' });
            toast.error('Failed to load products');
        }
    }, [state.filters]);

    const fetchStats = useCallback(async (overrideFilters = null) => {
        try {
            const queryParams = overrideFilters || state.filters;
            const cleanParams = Object.fromEntries(
                Object.entries(queryParams).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );
            const data = await productService.getProductStats(cleanParams);
            dispatch({ type: 'SET_STATS', payload: data.stats });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, [state.filters]);

    // Fetch Categories
    const fetchCategories = useCallback(async () => {
        try {
            const data = await categoryService.getAllCategories();
            dispatch({ type: 'SET_CATEGORIES', payload: data });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    // Auto-refetch when filters mutate
    useEffect(() => {
        if (isAuthenticated) {
            fetchProducts();
            fetchStats();
        }
    }, [state.filters, fetchProducts, fetchStats, isAuthenticated]);

    // Initial silent loads for stats and categories
    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchCategories();
        }
    }, [fetchStats, fetchCategories, isAuthenticated]);

    // Helper functions interacting directly with API
    const createProduct = async (productData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await productService.createProduct(productData);
            toast.success('Product created successfully');

            // Revalidate
            await fetchProducts();
            await fetchStats();
            return data.product;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to create product' });
            throw error;
        }
    };

    const updateProduct = async (id, productData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await productService.updateProduct(id, productData);
            toast.success('Product updated successfully');

            // Revalidate
            await fetchProducts();
            await fetchStats();
            return data.product;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update product' });
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await productService.deleteProduct(id);
            toast.success('Product deactivated successfully'); // Soft delete message

            // Revalidate
            await fetchProducts();
            await fetchStats();
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to deactivate product' });
            throw error;
        }
    };

    return (
        <ProductContext.Provider value={{
            ...state,
            dispatch, // Exposed if manual dispatch is needed
            setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
            fetchProducts,
            fetchStats,
            fetchCategories,
            createProduct,
            updateProduct,
            deleteProduct
        }}>
            {children}
        </ProductContext.Provider>
    );
};

// Custom Hook
export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

// Alias for flexibility
export const useProduct = useProducts;
