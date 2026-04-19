import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../ui/Loader';
import Sidebar from '../layout/Sidebar';
import Navbar from '../layout/Navbar';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (isLoading) {
        return <Loader fullScreen />;
    }

    if (!isAuthenticated) {
        // Redirect to login while saving the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        if (user?.role === 'VENDOR') return <Navigate to="/vendor-portal" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex h-screen bg-background text-text overflow-hidden">
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-10 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col w-full lg:pl-64 overflow-hidden relative">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default ProtectedRoute;
