import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { useAuth } from '../hooks/useAuth';
import ExecutiveTab from '../components/analytics/ExecutiveTab';
import InventoryHealthTab from '../components/analytics/InventoryHealthTab';
import TransactionsTab from '../components/analytics/TransactionsTab';
import PurchaseOrdersTab from '../components/analytics/PurchaseOrdersTab';
import CategoriesTab from '../components/analytics/CategoriesTab';
import { BarChart3, Calendar, FileText, Download, Mail, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import analyticsService from '../services/analyticsService';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const AnalyticsPage = () => {
    const { user } = useAuth();
    const { 
        dateRange, 
        setDateRange, 
        exportReport, 
        fetchExecutiveSummary, 
        fetchInventoryHealth, 
        fetchTransactionReport, 
        fetchPOReport, 
        fetchCategoryReport,
        isLoading
    } = useAnalytics();

    const [activeTab, setActiveTab] = useState('executive');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Refresh all
    const handleRefresh = () => {
        fetchExecutiveSummary();
        fetchInventoryHealth();
        fetchTransactionReport();
        fetchPOReport();
        fetchCategoryReport();
    };

    // Date Range Presets
    const setPreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setDateRange(start.toISOString(), end.toISOString());
        setShowDatePicker(false);
    };

    const setThisYear = () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        setDateRange(start.toISOString(), end.toISOString());
        setShowDatePicker(false);
    };

    const handleSendWeeklyReport = () => {
        setShowExportOptions(false);
        setShowConfirm(true);
    };

    const confirmSendWeeklyReport = async () => {
        setSendingEmail(true);
        try {
            await analyticsService.sendWeeklyReport({ recipients: [] });
            toast.success('Weekly report sent successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send report');
        } finally {
            setSendingEmail(false);
            setShowConfirm(false);
        }
    };

    const formatDateRangeLabel = () => {
        if (!dateRange.startDate || !dateRange.endDate) return 'Select Date Range';
        const s = new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const e = new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        return `${s} – ${e}`;
    };

    const TABS = [
        { id: 'executive', label: 'Executive', icon: '📈' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'transactions', label: 'Transactions', icon: '🔄' },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: '🛒' },
        { id: 'categories', label: 'Categories', icon: '🏷️' }
    ];

    const isAnyLoading = Object.values(isLoading).some(val => val);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-[#020617] animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                        <BarChart3 className="mr-3 text-indigo-500" size={32} />
                        Analytics & Reports
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm italic">
                        Business intelligence powered by real inventory data
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative">
                    {/* Date Range Picker Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-2 bg-surface hover:bg-white/5 border border-white/10 text-slate-200 text-sm rounded-lg px-4 py-2 transition-colors"
                        >
                            <Calendar size={16} className="text-indigo-400" />
                            <span className="font-medium whitespace-nowrap">{formatDateRangeLabel()}</span>
                        </button>
                        
                        {showDatePicker && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden text-sm slide-in-from-top-2">
                                <button onClick={() => setPreset(0)} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 border-b border-white/5">Today</button>
                                <button onClick={() => setPreset(7)} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 border-b border-white/5">Last 7 Days</button>
                                <button onClick={() => setPreset(30)} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 border-b border-white/5">Last 30 Days</button>
                                <button onClick={() => setPreset(90)} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 border-b border-white/5">Last 90 Days</button>
                                <button onClick={() => setThisYear()} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5">This Year</button>
                            </div>
                        )}
                    </div>

                    {/* Export Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowExportOptions(!showExportOptions)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg px-4 py-2 font-medium transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <Download size={16} /> Export
                            <ChevronDown size={14} className="ml-1 opacity-70" />
                        </button>
                        
                        {showExportOptions && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden text-sm slide-in-from-top-2">
                                <button 
                                    onClick={() => { exportReport(activeTab === 'executive' ? 'full' : activeTab, 'excel'); setShowExportOptions(false); }}
                                    className="w-full flex items-center gap-3 text-left px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-emerald-400 border-b border-white/5 transition-colors"
                                    disabled={isLoading.export}
                                >
                                    <FileText size={16} /> Export as Excel
                                </button>
                                <button 
                                    onClick={() => { exportReport(activeTab === 'executive' ? 'full' : activeTab, 'pdf'); setShowExportOptions(false); }}
                                    className="w-full flex items-center gap-3 text-left px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-red-400 border-b border-white/5 transition-colors"
                                    disabled={isLoading.export}
                                >
                                    <FileText size={16} /> Export as PDF
                                </button>
                                {user?.role === 'ADMIN' && (
                                    <button 
                                        onClick={handleSendWeeklyReport}
                                        disabled={sendingEmail}
                                        className="w-full flex items-center gap-3 text-left px-4 py-3 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                                    >
                                        <Mail size={16} /> {sendingEmail ? 'Sending...' : 'Send Weekly Report (Email)'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleRefresh}
                        className={`p-2.5 bg-surface border border-white/10 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors ${isAnyLoading ? 'animate-spin border-indigo-500/50 text-indigo-400' : ''}`}
                        disabled={isAnyLoading}
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' 
                            : 'bg-surface text-slate-400 border border-white/5 hover:bg-white/5 hover:text-slate-200'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
                {activeTab === 'executive' && <ExecutiveTab />}
                {activeTab === 'inventory' && <InventoryHealthTab />}
                {activeTab === 'transactions' && <TransactionsTab />}
                {activeTab === 'purchase-orders' && <PurchaseOrdersTab />}
                {activeTab === 'categories' && <CategoriesTab />}
            </div>
            
            {/* Click Outside Overlay for Dropdowns */}
            {(showDatePicker || showExportOptions) && (
                <div 
                    className="fixed inset-0 z-40 transition-opacity bg-black/10"
                    onClick={() => { setShowDatePicker(false); setShowExportOptions(false); }}
                />
            )}

            <ConfirmDialog 
                isOpen={showConfirm}
                title="Send Weekly Report"
                message="Are you sure you want to send the weekly inventory report to all administrators now?"
                confirmLabel="Yes, Send Report"
                onConfirm={confirmSendWeeklyReport}
                onCancel={() => setShowConfirm(false)}
                isLoading={sendingEmail}
            />
        </div>
    );
};

export default AnalyticsPage;
