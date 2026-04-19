import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { forecastService } from '../services/forecastService';
import { useAuth } from '../hooks/useAuth';

export const ForecastContext = createContext();

export const ForecastProvider = ({ children }) => {
    const [forecasts, setForecasts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    let isAuthenticated = false;
    let userRole = null;
    try {
        const auth = useAuth();
        isAuthenticated = auth?.isAuthenticated;
        userRole = auth?.user?.role;
    } catch (e) {
        isAuthenticated = false;
    }

    /**
     * Fetch all product forecasts with optional filters
     */
    const fetchAllForecasts = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await forecastService.getAllForecasts(params);
            setForecasts(data.forecasts || []);
            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch forecasts';
            setError(message);
            console.error('ForecastContext fetchAllForecasts Error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Fetch global forecasting summary
     */
    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await forecastService.getForecastSummary();
            setSummary(data.summary || null);
            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch forecast summary';
            setError(message);
            console.error('ForecastContext fetchSummary Error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Manually trigger a forecast refresh for a product
     */
    const refreshProductForecast = async (productId) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await forecastService.refreshForecast(productId);

            // Optionally update local state if the list contains this product
            if (data.success && data.forecast) {
                setForecasts(prev => prev.map(f =>
                    f.productId._id === productId
                        ? { ...f, ...data.forecast, productId: f.productId } // keep the populated productId object
                        : f
                ));
            }

            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to refresh forecast';
            setError(message);
            console.error('ForecastContext refreshProductForecast Error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && ['ADMIN', 'MANAGER'].includes(userRole)) {
            fetchSummary();
        }
    }, [fetchSummary, isAuthenticated, userRole]);

    return (
        <ForecastContext.Provider value={{
            forecasts,
            summary,
            isLoading,
            error,
            fetchAllForecasts,
            fetchSummary,
            refreshProductForecast
        }}>
            {children}
        </ForecastContext.Provider>
    );
};

export const useForecast = () => {
    const context = useContext(ForecastContext);
    if (!context) {
        throw new Error('useForecast must be used within a ForecastProvider');
    }
    return context;
};
