import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { alertService } from '../services/alertService';
import { useAuth } from '../hooks/useAuth';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    let isAuthenticated = false;
    try {
        const auth = useAuth();
        isAuthenticated = auth?.isAuthenticated;
    } catch (e) {
        isAuthenticated = false;
    }

    const fetchAlerts = useCallback(async (params = {}) => {
        setIsLoading(true);
        try {
            const data = await alertService.getAlerts(params);
            setAlerts(data.alerts || []);
            setUnreadCount(data.unreadCount || 0);
            return data;
        } catch (error) {
            console.error('Error fetching alerts:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const data = await alertService.getAlertCount();
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching alert count:', error);
        }
    }, [isAuthenticated]);

    const markRead = async (id) => {
        try {
            await alertService.markRead(id);
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));

            // Only decrement count if we have the alert loaded and it was previously unread
            const alert = alerts.find(a => a._id === id);
            if (alert && !alert.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                await fetchCount();
            }
        } catch (error) {
            console.error('Error marking alert read:', error);
            throw error;
        }
    };

    const markAllRead = async () => {
        try {
            await alertService.markAllRead();
            setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all alerts read:', error);
            throw error;
        }
    };

    const dismiss = async (id) => {
        try {
            await alertService.dismissAlert(id);
            setAlerts(prev => prev.filter(a => a._id !== id));
            await fetchCount();
        } catch (error) {
            console.error('Error dismissing alert:', error);
            throw error;
        }
    };

    // Poll getAlertCount every 60 seconds matching requirements natively handling token scopes strictly
    useEffect(() => {
        if (!isAuthenticated) return;

        // Initial Mount Call
        fetchCount();

        // 60-second polling interval
        const interval = setInterval(() => {
            fetchCount();
        }, 60000);

        return () => clearInterval(interval);
    }, [isAuthenticated, fetchCount]);

    return (
        <AlertContext.Provider value={{
            alerts,
            unreadCount,
            isLoading,
            fetchAlerts,
            fetchCount,
            markRead,
            markAllRead,
            dismiss
        }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);
