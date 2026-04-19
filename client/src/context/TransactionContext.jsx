import React, { createContext, useContext, useState, useCallback } from 'react';
import { transactionService } from '../services/transactionService';
import { productService } from '../services/productService';
import { AlertContext } from './AlertContext';
import toast from 'react-hot-toast';

export const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Context bridge referencing local UI tree
    const alertContext = useContext(AlertContext);

    const fetchTransactions = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await transactionService.getAllTransactions(params);
            setTransactions(data.transactions || []);
            if (data.pagination) setPagination(data.pagination);
            return data;
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await transactionService.getTransactionSummary(params);
            setSummary(data.summary || null);
            return data;
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Encapsulated refetch logic fired upon any structural inventory adjustments
    const handleTransactionSuccess = async () => {
        try {
            // Trigger UI cache sync
            await productService.getProductStats();

            // Auto trigger bell notification syncing strictly resolving alerts
            if (alertContext && alertContext.fetchCount) {
                await alertContext.fetchCount();
            }
        } catch (err) {
            console.error('Error during post-transaction sync:', err);
        }
    };

    const performStockIn = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await transactionService.stockIn(data);
            toast.success(res.message || 'Stock added successfully');
            await handleTransactionSuccess();
            return res;
        } catch (err) {
            let msg = 'Error processing Stock IN';
            if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
            toast.error(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const performStockOut = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await transactionService.stockOut(data);
            toast.success(res.message || 'Stock removed successfully');
            await handleTransactionSuccess();
            return res;
        } catch (err) {
            let msg = 'Error processing Stock OUT';
            if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
            toast.error(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            pagination,
            summary,
            isLoading,
            error,
            fetchTransactions,
            fetchSummary,
            performStockIn,
            performStockOut
        }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransaction = () => useContext(TransactionContext);
