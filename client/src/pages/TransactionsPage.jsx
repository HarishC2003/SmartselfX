import React, { useState, useEffect, useMemo } from 'react';
import {
    Download, ArrowUpCircle, ArrowDownCircle, Search, FilterX, Eye,
    RefreshCw, Calendar, ArrowRight, Activity, X, Package2, Clock,
    User, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';
import { useAuth } from '../hooks/useAuth';
import StockInModal from '../components/transactions/StockInModal';
import StockOutModal from '../components/transactions/StockOutModal';
import api from '../services/authService';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', options)} · ${date.toLocaleTimeString('en-US', timeOptions)}`;
};

const getRefColor = (type) => {
    const colors = {
        PURCHASE_ORDER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        SALES: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        MANUAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        RETURN: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        ADJUSTMENT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        DAMAGED: 'bg-red-500/10 text-red-400 border-red-500/20',
        EXPIRED: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    };
    return colors[type] || colors.MANUAL;
};

const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const isIN = transaction.type === 'IN';
    const qtyColor = isIN ? 'text-emerald-400' : 'text-rose-400';
    const badgeColor = isIN ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    const Icon = isIN ? ArrowUpCircle : ArrowDownCircle;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-white">Transaction Details</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Transaction ID</div>
                            <div className="font-mono text-sm text-slate-300">{transaction._id}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">Date & Time</div>
                            <div className="text-sm text-slate-300">{formatDate(transaction.timestamp)}</div>
                        </div>
                    </div>

                    {/* Product Card */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            <Package2 className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">{transaction.productId?.name || 'Unknown Product'}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{transaction.productId?.sku || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Movement Visualization */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-slate-400">Movement Verification</span>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${badgeColor}`}>
                                <Icon className="w-3.5 h-3.5" />
                                {transaction.type}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 uppercase mb-1">Before</div>
                                <div className="text-2xl font-bold text-white">{transaction.previousStock}</div>
                            </div>

                            <div className="flex-1 flex flex-col items-center px-4">
                                <div className={`text-lg font-bold ${qtyColor} mb-2 flex items-center gap-1`}>
                                    {isIN ? '+' : '-'}{transaction.quantity}
                                </div>
                                <div className="w-full h-px bg-slate-700 relative flex items-center justify-center">
                                    <ArrowRight className="absolute w-4 h-4 text-slate-500 right-0 bg-slate-800 rounded-full" />
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-xs text-slate-500 uppercase mb-1">After</div>
                                <div className="text-2xl font-bold text-white">{transaction.newStock}</div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Reference Type</div>
                            <div className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${getRefColor(transaction.referenceType)}`}>
                                {transaction.referenceType.replace(/_/g, ' ')}
                            </div>
                        </div>
                        <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Reference ID</div>
                            <div className="font-mono text-sm text-slate-300 truncate">
                                {transaction.referenceId || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-2 bg-slate-900/30 rounded-lg p-3 border border-slate-800 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                {transaction.handledBy?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Handled By</div>
                                <div className="text-sm font-medium text-slate-300">
                                    {transaction.handledBy?.name || 'Unknown User'}
                                    <span className="text-xs text-slate-500 ml-2">({transaction.handledBy?.role || 'User'})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    {transaction.note && (
                        <div>
                            <div className="text-xs font-medium text-slate-400 mb-2">Remarks</div>
                            <p className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                {transaction.note}
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/5 p-4 bg-slate-900 flex justify-between items-center shrink-0">
                    <span className="text-xs text-slate-500 italic">This transaction is immutable and cannot be edited.</span>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function TransactionsPage() {
    const { user } = useAuth();
    const { transactions, pagination, summary, isLoading, fetchTransactions, fetchSummary } = useTransaction();

    // UI State
    const [isStockInModalOpen, setStockInModalOpen] = useState(false);
    const [isStockOutModalOpen, setStockOutModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [handlers, setHandlers] = useState([]);

    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    // Filters Setup
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const todayStr = new Date().toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        search: '',
        type: '',
        referenceType: '',
        handledBy: '',
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: todayStr
    });

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Initial Fetch for summary (Today)
    useEffect(() => {
        if (isAdminOrManager) {
            fetchSummary({ startDate: todayStr, endDate: todayStr }).catch(() => {});
        }
        if (user?.role === 'ADMIN') {
            api.get('/users').then(res => setHandlers(res.data.users || [])).catch(() => { });
        }
    }, [fetchSummary, todayStr, isAdminOrManager, user?.role]);

    // Fetch transactions when filters / page changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions({ ...filters, page, limit });
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, page, limit, fetchTransactions]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            referenceType: '',
            handledBy: '',
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: todayStr
        });
        setPage(1);
    };

    const handleExport = () => {
        // Implement CSV Export (mocking for now with toast)
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Preparing export...',
                success: 'Transactions exported successfully!',
                error: 'Export failed.'
            }
        );
    };

    const netMovement = (summary?.totalIn || 0) - (summary?.totalOut || 0);

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Stock Transactions</h1>
                    <p className="text-slate-400 mt-1">Complete inventory movement history</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isAdminOrManager && (
                        <>
                            <button
                                onClick={() => setStockInModalOpen(true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                <ArrowUpCircle className="w-4 h-4" /> Stock In
                            </button>
                            <button
                                onClick={() => setStockOutModalOpen(true)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-rose-500/20"
                            >
                                <ArrowDownCircle className="w-4 h-4" /> Stock Out
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {isAdminOrManager && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Stock In Today</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{summary?.totalIn || 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Stock Out Today</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{summary?.totalOut || 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <ArrowDownCircle className="w-6 h-6 text-rose-400" />
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Net Movement</p>
                            <h3 className={`text-2xl font-bold mt-1 ${netMovement > 0 ? 'text-emerald-400' : netMovement < 0 ? 'text-rose-400' : 'text-white'}`}>
                                {netMovement > 0 ? '+' : ''}{netMovement}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Transactions Today</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{summary?.totalTransactions || 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-[#1E293B] border border-white/5 rounded-xl shadow-xl overflow-hidden flex flex-col">

                {/* Filter Bar */}
                <div className="p-4 border-b border-white/5 bg-slate-800/30">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search products..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors"
                            />
                        </div>

                        {/* Type Toggle */}
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                            {['', 'IN', 'OUT'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleFilterChange({ target: { name: 'type', value: type } })}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${filters.type === type ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {type || 'All'}
                                </button>
                            ))}
                        </div>

                        {/* Reference Type Select */}
                        <select
                            name="referenceType"
                            value={filters.referenceType}
                            onChange={handleFilterChange}
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        >
                            <option value="">All References</option>
                            <option value="PURCHASE_ORDER">Purchase Order</option>
                            <option value="MANUAL">Manual</option>
                            <option value="SALES">Sales</option>
                            <option value="RETURN">Return</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="EXPIRED">Expired</option>
                        </select>

                        {/* Handler Select */}
                        {user?.role === 'ADMIN' && (
                            <select
                                name="handledBy"
                                value={filters.handledBy}
                                onChange={handleFilterChange}
                                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none max-w-[150px]"
                            >
                                <option value="">All Users</option>
                                {handlers.map(h => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="bg-transparent text-sm text-white outline-none [&::-webkit-calendar-picker-indicator]:opacity-50"
                            />
                            <span className="text-slate-500">→</span>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="bg-transparent text-sm text-white outline-none [&::-webkit-calendar-picker-indicator]:opacity-50"
                            />
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={clearFilters}
                            title="Clear Filters"
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <FilterX className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/80 border-b border-white/10 text-xs uppercase text-slate-400 tracking-wider">
                                <th className="px-6 py-4 font-semibold w-12">#</th>
                                <th className="px-6 py-4 font-semibold">Date & Time</th>
                                <th className="px-6 py-4 font-semibold">Product</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold text-center">Movement</th>
                                <th className="px-6 py-4 font-semibold">Reference</th>
                                <th className="px-6 py-4 font-semibold">Handled By</th>
                                <th className="px-6 py-4 font-semibold w-24 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        </div>
                                        <p className="text-slate-400">Loading transactions...</p>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-0 py-8">
                                        <EmptyState
                                            icon={RefreshCw}
                                            title="No transactions found"
                                            subtitle={filters.search || filters.type ? "Try adjusting your filters" : "Record your first stock movement"}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx, idx) => {
                                    const isIN = tx.type === 'IN';
                                    const QtyIcon = isIN ? ArrowUpCircle : ArrowDownCircle;
                                    const qtyColor = isIN ? 'text-emerald-400' : 'text-rose-400';
                                    const badgeColor = isIN ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                                    return (
                                        <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {(pagination.page - 1) * pagination.limit + idx + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-300" title={tx.timestamp}>
                                                    {formatDate(tx.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[250px]">
                                                <div className="font-semibold text-white truncate" title={tx.productId?.name}>
                                                    {tx.productId?.name || 'Unknown Product'}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5" title={tx.productId?.sku}>
                                                    {tx.productId?.sku || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${badgeColor}`}>
                                                    <QtyIcon className="w-3.5 h-3.5" />
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="text-sm font-medium text-slate-400">{tx.previousStock}</div>
                                                    <div className={`flex flex-col items-center ${qtyColor}`}>
                                                        <span className="text-xs font-bold -mb-1">{isIN ? '+' : '-'}{tx.quantity}</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-sm font-bold text-white">{tx.newStock}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${getRefColor(tx.referenceType)}`}>
                                                    {tx.referenceType.replace(/_/g, ' ')}
                                                </span>
                                                {tx.note && (
                                                    <p className="text-xs text-slate-500 truncate max-w-[150px] mt-1" title={tx.note}>
                                                        {tx.note}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                                        {tx.handledBy?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-sm text-slate-300 truncate max-w-[100px]">
                                                        {tx.handledBy?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && transactions.length > 0 && (
                    <div className="border-t border-white/5 p-4 bg-slate-800/30 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            Showing <span className="text-white font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-white font-medium">{pagination.total}</span> transactions
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5 outline-none focus:border-indigo-500"
                            >
                                <option value="20">20 per page</option>
                                <option value="50">50 per page</option>
                                <option value="100">100 per page</option>
                            </select>

                            <div className="flex items-center gap-1">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-3 text-sm font-medium text-white">{pagination.page} / {pagination.totalPages}</div>
                                <button
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <StockInModal
                isOpen={isStockInModalOpen}
                onClose={() => setStockInModalOpen(false)}
                onSuccess={() => fetchTransactions({ ...filters, page, limit })}
            />

            <StockOutModal
                isOpen={isStockOutModalOpen}
                onClose={() => setStockOutModalOpen(false)}
                onSuccess={() => fetchTransactions({ ...filters, page, limit })}
            />

            <TransactionDetailModal
                transaction={selectedTx}
                onClose={() => setSelectedTx(null)}
            />
        </div>
    );
}

