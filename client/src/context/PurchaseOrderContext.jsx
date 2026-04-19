import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const PurchaseOrderContext = createContext();

export const usePurchaseOrders = () => {
    return useContext(PurchaseOrderContext);
};

export const PurchaseOrderProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [stats, setStats] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Only fetch globally relevant data on mount if Admin/Manager and authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchStats();
            if (user.role === 'ADMIN' || user.role === 'MANAGER') {
                fetchRecommendations();
            }
        }
    }, [isAuthenticated, user]);

    const fetchPOs = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await purchaseOrderService.getAllPOs(params);
            setPurchaseOrders(data.purchaseOrders);
            setPagination(data.pagination);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch purchase orders');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await purchaseOrderService.getPOStats();
            setStats(data);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch PO stats');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchRecommendations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await purchaseOrderService.getAIRecommendations();
            setRecommendations(data.recommendations);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch recommendations');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Helpers that automatically trigger a refetch of stats and PO list after completion
    const refreshData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchPOs(),
                (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) ? fetchRecommendations() : Promise.resolve()
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const createPO = async (poData) => {
        try {
            const data = await purchaseOrderService.createPO(poData);
            toast.success(data.message || 'Purchase Order created!');
            await refreshData();
            return data;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create PO');
            throw err;
        }
    };

    const approvePO = async (id, data) => {
        try {
            const res = await purchaseOrderService.approvePO(id, data);
            toast.success(res.message || 'PO Approved successfully');
            await refreshData();
            return res;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve PO');
            throw err;
        }
    };

    const rejectPO = async (id, data) => {
        try {
            const res = await purchaseOrderService.rejectPO(id, data);
            toast.success('PO Rejected successfully');
            await refreshData();
            return res;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject PO');
            throw err;
        }
    };

    const markDispatched = async (id) => {
        try {
            const res = await purchaseOrderService.markDispatched(id);
            toast.success('PO marked as Dispatched');
            await refreshData();
            return res;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark PO as dispatched');
            throw err;
        }
    };

    const markReceived = async (id, data) => {
        try {
            const res = await purchaseOrderService.markReceived(id, data);
            toast.success(res.message || 'Stock received and updated!');
            await refreshData();
            return res;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark PO as received');
            throw err;
        }
    };

    const cancelPO = async (id, data) => {
        try {
            const res = await purchaseOrderService.cancelPO(id, data);
            toast.success('PO Cancelled successfully');
            await refreshData();
            return res;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel PO');
            throw err;
        }
    };

    const value = {
        purchaseOrders,
        pagination,
        stats,
        recommendations,
        isLoading,
        error,
        fetchPOs,
        fetchStats,
        fetchRecommendations,
        createPO,
        approvePO,
        rejectPO,
        markDispatched,
        markReceived,
        cancelPO
    };

    return (
        <PurchaseOrderContext.Provider value={value}>
            {children}
        </PurchaseOrderContext.Provider>
    );
};
