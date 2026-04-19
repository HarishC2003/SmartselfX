import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import declarationService from '../services/declarationService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const DeclarationContext = createContext();

export const useDeclarations = () => useContext(DeclarationContext);

export const DeclarationProvider = ({ children }) => {
    const { user } = useAuth();
    const [myDeclarations, setMyDeclarations] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [summary, setSummary] = useState({ total: 0, totalValue: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
    const [error, setError] = useState(null);

    const fetchPendingAssignments = useCallback(async () => {
        if (user?.role !== 'VENDOR') return;
        setIsLoadingAssignments(true);
        try {
            const data = await declarationService.getAssignedProducts();
            setPendingAssignments(data.products);
        } catch (err) {
            console.error("Failed to fetch pending assignments", err);
        } finally {
            setIsLoadingAssignments(false);
        }
    }, [user]);

    const fetchMyDeclarations = useCallback(async (params = {}) => {
        if (user?.role !== 'VENDOR') return;
        
        setIsLoading(true);
        setError(null);
        try {
            const data = await declarationService.getMyDeclarations(params);
            setMyDeclarations(data.declarations);
            setPagination(data.pagination);
            setSummary(data.summary);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch declarations');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addDeclaration = async (data) => {
        try {
            await declarationService.addDeclaration(data);
            await fetchMyDeclarations({ page: pagination.page }); // Refresh
            await fetchPendingAssignments(); // Refresh assignments too
            toast.success('Stock declaration added successfully.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add declaration');
            throw err;
        }
    };

    const updateDeclaration = async (id, data) => {
        try {
            await declarationService.updateDeclaration(id, data);
            await fetchMyDeclarations({ page: pagination.page }); // Refresh
            toast.success('Declaration updated.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update declaration');
            throw err;
        }
    };

    const updateQtyOnly = async (id, qty) => {
        try {
            // Optimistic Update
            setMyDeclarations(prev => prev.map(d => 
                d._id === id ? { ...d, availableQty: qty } : d
            ));
            
            const res = await declarationService.updateQtyOnly(id, qty);
            
            // Recalculate Summary optimistically
            setSummary(prev => {
                const updatedList = myDeclarations.map(d => d._id === id ? { ...d, availableQty: qty } : d);
                const totalValue = updatedList.reduce((sum, item) => sum + (item.availableQty * item.unitPrice), 0);
                return { ...prev, totalValue };
            });

            toast.success(`Updated to ${qty} units.`);
            return res;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update quantity');
            await fetchMyDeclarations({ page: pagination.page }); // Rollback
            throw err;
        }
    };

    const deleteDeclaration = async (id) => {
        try {
            await declarationService.deleteDeclaration(id);
            await fetchMyDeclarations({ page: 1 }); // Refresh
            toast.success('Declaration removed.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove declaration');
            throw err;
        }
    };

    const rejectAssignment = async (productId, reason) => {
        try {
            await declarationService.rejectAssignment(productId, reason);
            await fetchPendingAssignments(); // Refresh
            toast.success('Assignment rejected.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject assignment');
            throw err;
        }
    };

    // Load definitions initially on mount if user is a vendor
    useEffect(() => {
        if (user?.role === 'VENDOR') {
            fetchMyDeclarations();
            fetchPendingAssignments();
        }
    }, [user, fetchMyDeclarations]);

    const value = {
        myDeclarations,
        pendingAssignments,
        pagination,
        summary,
        isLoading,
        isLoadingAssignments,
        error,
        fetchMyDeclarations,
        fetchPendingAssignments,
        addDeclaration,
        updateDeclaration,
        updateQtyOnly,
        deleteDeclaration,
        rejectAssignment
    };

    return (
        <DeclarationContext.Provider value={value}>
            {children}
        </DeclarationContext.Provider>
    );
};
