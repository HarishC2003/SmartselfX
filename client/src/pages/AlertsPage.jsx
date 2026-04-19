import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '@/context/AlertContext';
import { Bell, CheckCircle, Package2, ShoppingCart, Filter, RefreshCw, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import CreatePOModal from '@/components/purchaseOrders/CreatePOModal';
import EmptyState from '@/components/ui/EmptyState';

export default function AlertsPage() {
    const navigate = useNavigate();
    const { alerts, unreadCount, fetchAlerts, markAllRead, markRead, dismiss, isLoading } = useAlert();

    // Filters
    const [activeTab, setActiveTab] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        let params = { page, limit };
        if (activeTab === 'Unread') {
            params.isRead = false;
        } else if (activeTab === 'Critical') {
            params.severity = 'CRITICAL';
        } else if (activeTab === 'High') {
            params.severity = 'HIGH';
        } else if (activeTab === 'Low Stock') {
            params.type = 'LOW_STOCK';
        } else if (activeTab === 'Out of Stock') {
            params.type = 'OUT_OF_STOCK';
        }

        fetchAlerts(params);
    }, [activeTab, page, fetchAlerts]);

    const handleCreatePO = (product) => {
        setSelectedProduct({
            _id: product._id,
            name: product.name,
            sku: product.sku,
            costPrice: product.costPrice,
            supplierName: product.supplierName,
            vendorId: product.vendorId,
            reorderQuantity: product.reorderQuantity || 50
        });
        setIsCreateModalOpen(true);
    };

    const getSeverityIcon = (sev) => {
        if (sev === 'CRITICAL') return ShieldAlert;
        if (sev === 'HIGH') return AlertTriangle;
        return Bell;
    };

    const getSeverityStyles = (sev) => {
        switch (sev) {
            case 'CRITICAL': return { border: 'border-l-rose-500', icon: 'text-rose-400', badge: 'text-rose-400 bg-rose-500/10' };
            case 'HIGH': return { border: 'border-l-amber-500', icon: 'text-amber-400', badge: 'text-amber-400 bg-amber-500/10' };
            case 'MEDIUM': return { border: 'border-l-yellow-400', icon: 'text-yellow-400', badge: 'text-yellow-400 bg-yellow-500/10' };
            default: return { border: 'border-l-blue-400', icon: 'text-blue-400', badge: 'text-blue-400 bg-blue-500/10' };
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Bell className="w-8 h-8 text-indigo-400" />
                        Alerts & Notifications
                    </h1>
                    <p className="text-slate-400 mt-1">Manage system alerts and automated inventory warnings</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllRead()}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
                        >
                            <CheckCircle className="w-4 h-4" /> Mark All Read
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-[#1E293B] border border-white/5 rounded-xl p-2 flex flex-wrap gap-1 shadow-lg overflow-x-auto custom-scrollbar">
                {['All', 'Unread', 'Critical', 'High', 'Low Stock', 'Out of Stock'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        {tab}
                        {tab === 'Unread' && unreadCount > 0 && (
                            <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="space-y-4 min-h-[400px]">
                {isLoading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p>Loading alerts...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title="No active alerts"
                        subtitle={`Your inventory is healthy! There are no ${activeTab !== 'All' ? activeTab.toLowerCase() : ''} notifications requiring your attention at this time.`}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {alerts.map(alert => {
                            const styles = getSeverityStyles(alert.severity);
                            const Icon = getSeverityIcon(alert.severity);

                            return (
                                <div
                                    key={alert._id}
                                    className={`bg-[#1E293B] rounded-xl border border-l-4 border-y-white/5 border-r-white/5 shadow-xl transition-all ${styles.border} ${!alert.isRead ? 'bg-slate-800/60' : ''}`}
                                >
                                    <div className="p-5">
                                        {/* Alert Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-slate-900`}>
                                                    <Icon className={`w-5 h-5 ${styles.icon}`} />
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
                                                    <span className={`px-2 py-0.5 rounded font-bold ${styles.badge}`}>
                                                        ● {alert.severity}
                                                    </span>
                                                    <span className="text-slate-400 font-mono">·</span>
                                                    <span className="font-semibold text-slate-300">
                                                        {alert.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-slate-400 font-mono">·</span>
                                                    <span className="text-slate-500">
                                                        {timeAgo(alert.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                {!alert.isRead && (
                                                    <button
                                                        onClick={() => markRead(alert._id)}
                                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => dismiss(alert._id)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Dismiss Alert"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Alert Content */}
                                        <div className="ml-[3.25rem]">
                                            {alert.productId ? (
                                                <div className="mb-3">
                                                    <h3 className={`text-lg ${!alert.isRead ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                                                        {alert.productId.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                                                        <span>SKU: {alert.productId.sku}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <h3 className="text-lg font-medium text-slate-200 mb-3">System Alert</h3>
                                            )}

                                            <p className="text-sm text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-4 leading-relaxed">
                                                {alert.message}
                                            </p>

                                            {/* Metrics & Actions row */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-700/50">

                                                {alert.currentStock !== undefined && (
                                                    <div className="flex items-center gap-4 text-sm bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800 inline-flex self-start">
                                                        <div>
                                                            <span className="text-slate-500 mr-2">Current Stock:</span>
                                                            <span className={`font-bold ${alert.currentStock === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                                                                {alert.currentStock}
                                                            </span>
                                                        </div>
                                                        <div className="w-px h-4 bg-slate-700" />
                                                        <div>
                                                            <span className="text-slate-500 mr-2">Reorder Level:</span>
                                                            <span className="font-bold text-slate-300">
                                                                {alert.reorderLevel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                    {alert.productId && (
                                                        <button
                                                            onClick={() => {
                                                                if (!alert.isRead) markRead(alert._id);
                                                                navigate(`/products/${alert.productId._id}`);
                                                            }}
                                                            className="flex-1 sm:flex-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Package2 className="w-4 h-4 text-slate-400" /> View Product
                                                        </button>
                                                    )}

                                                    {alert.type === 'OUT_OF_STOCK' || alert.type === 'LOW_STOCK' ? (
                                                        <button
                                                            onClick={() => handleCreatePO(alert.productId)}
                                                            className="flex-1 sm:flex-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                                        >
                                                            <ShoppingCart className="w-4 h-4" /> Create PO
                                                        </button>
                                                    ) : null}
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination: Load More */}
                        {alerts.length >= page * limit && (
                            <div className="flex justify-center pt-6">
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-6 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Load More Alerts
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Create PO Modal */}
            <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                prefilledProduct={selectedProduct}
            />
        </div>
    );
}
