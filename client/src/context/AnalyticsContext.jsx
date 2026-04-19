import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import { useAuth } from '../hooks/useAuth'; // Added this
import { toast } from 'react-hot-toast';

const AnalyticsContext = createContext();

export const useAnalytics = () => useContext(AnalyticsContext);

export const AnalyticsProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth(); // Get user from auth context
    // Defaults to last 30 days
    const [dateRange, setDateRangeState] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        endDate: new Date().toISOString()
    });
    const [groupBy, setGroupByState] = useState('day');
    
    const [executiveSummary, setExecutiveSummary] = useState(null);
    const [inventoryHealth, setInventoryHealth] = useState(null);
    const [transactionReport, setTransactionReport] = useState(null);
    const [poReport, setPoReport] = useState(null);
    const [categoryReport, setCategoryReport] = useState(null);
    
    const [isLoading, setIsLoading] = useState({
        executive: false,
        health: false,
        transactions: false,
        po: false,
        categories: false,
        export: false
    });
    const [error, setError] = useState(null);

    const setDateRange = (startDate, endDate) => {
        setDateRangeState({ startDate, endDate });
    };

    const setGroupBy = (value) => {
        setGroupByState(value);
    };

    const fetchExecutiveSummary = useCallback(async () => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return;
        setIsLoading(prev => ({ ...prev, executive: true }));
        try {
            const res = await analyticsService.getExecutiveSummary(dateRange);
            setExecutiveSummary(res.data);
            setError(null);
        } catch (err) {
            console.error('Executive summary fetch failed:', err);
            // Only set error if it's not a cancelled request or 401 (which we handle centrally)
            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to fetch executive summary');
            }
        } finally {
            setIsLoading(prev => ({ ...prev, executive: false }));
        }
    }, [dateRange, user]);

    const fetchInventoryHealth = useCallback(async () => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return;
        setIsLoading(prev => ({ ...prev, health: true }));
        try {
            const res = await analyticsService.getInventoryHealth(dateRange);
            setInventoryHealth(res.data);
            setError(null);
        } catch (err) {
            console.error('Inventory health fetch failed:', err);
            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to fetch inventory health');
            }
        } finally {
            setIsLoading(prev => ({ ...prev, health: false }));
        }
    }, [dateRange, user]);

    const fetchTransactionReport = useCallback(async () => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return;
        setIsLoading(prev => ({ ...prev, transactions: true }));
        try {
            const res = await analyticsService.getTransactionReport({ ...dateRange, groupBy });
            setTransactionReport(res.data);
            setError(null);
        } catch (err) {
            console.error('Transaction report fetch failed:', err);
            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to fetch transaction report');
            }
        } finally {
            setIsLoading(prev => ({ ...prev, transactions: false }));
        }
    }, [dateRange, groupBy, user]);

    const fetchPOReport = useCallback(async () => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return;
        setIsLoading(prev => ({ ...prev, po: true }));
        try {
            const res = await analyticsService.getPurchaseOrderReport(dateRange);
            setPoReport(res.data);
            setError(null);
        } catch (err) {
            console.error('PO report fetch failed:', err);
            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to fetch PO report');
            }
        } finally {
            setIsLoading(prev => ({ ...prev, po: false }));
        }
    }, [dateRange, user]);

    const fetchCategoryReport = useCallback(async () => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return;
        setIsLoading(prev => ({ ...prev, categories: true }));
        try {
            const res = await analyticsService.getCategoryReport(dateRange);
            setCategoryReport(res.data);
            setError(null);
        } catch (err) {
            console.error('Category report fetch failed:', err);
            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to fetch category report');
            }
        } finally {
            setIsLoading(prev => ({ ...prev, categories: false }));
        }
    }, [dateRange, user]);

    const exportReport = async (type, format) => {
        setIsLoading(prev => ({ ...prev, export: true }));
        try {
            const params = { report: type, ...dateRange };
            if (format === 'excel' || format === 'xlsx') {
                await analyticsService.exportExcel(params);
                toast.success('Excel report downloaded successfully');
            } else if (format === 'pdf') {
                await analyticsService.exportPDF(params);
                toast.success('PDF report downloaded successfully');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to export report');
        } finally {
            setIsLoading(prev => ({ ...prev, export: false }));
        }
    };

    // Refetch when date range or grouping changes, or when user logs in
    useEffect(() => {
        if (isAuthenticated && user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
            fetchExecutiveSummary();
            fetchInventoryHealth();
            fetchTransactionReport();
            fetchPOReport();
            fetchCategoryReport();
        }
    }, [dateRange, groupBy, isAuthenticated, user, fetchExecutiveSummary, fetchInventoryHealth, fetchTransactionReport, fetchPOReport, fetchCategoryReport]);

    const value = {
        executiveSummary,
        inventoryHealth,
        transactionReport,
        poReport,
        categoryReport,
        dateRange,
        groupBy,
        isLoading,
        error,
        setDateRange,
        setGroupBy,
        fetchExecutiveSummary,
        fetchInventoryHealth,
        fetchTransactionReport,
        fetchPOReport,
        fetchCategoryReport,
        exportReport
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
};
