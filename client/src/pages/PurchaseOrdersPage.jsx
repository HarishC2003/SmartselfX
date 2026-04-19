import React, { useState, useEffect, useRef } from 'react';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { useAuth } from '@/hooks/useAuth';
import {
    ShoppingCart, Plus, Brain, Search, MapPin,
    Clock, CheckCircle, Truck, XCircle, AlertTriangle, ArrowRight,
    User, Package, Calendar, RefreshCw, MoreVertical, FileText, ChevronRight, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CreatePOModal from '@/components/purchaseOrders/CreatePOModal';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'bg-slate-700 text-slate-300 border-slate-600';
        case 'PENDING': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
        case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'DISPATCHED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'RECEIVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'REJECTED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        case 'CANCELLED': return 'bg-slate-800 text-slate-500 border-slate-700 line-through';
        default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
};

const PurchaseOrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        purchaseOrders, pagination, stats, isLoading,
        fetchPOs, fetchStats, markReceived, cancelPO, approvePO
    } = usePurchaseOrders();

    const [filters, setFilters] = useState({
        status: '', search: '', page: 1, limit: 10
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', poId: null, data: null });

    // Active dropdown index
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        fetchPOs(filters);
    }, [filters, fetchPOs]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
        setActiveMenuId(null);
    };

    const handleActionClick = (po, e) => {
        e.stopPropagation();
        if (activeMenuId === po._id) {
            setActiveMenuId(null);
        } else {
            setActiveMenuId(po._id);
        }
    };

    const openDetails = (po) => {
        setSelectedPO(po);
        setIsDetailModalOpen(true);
        setActiveMenuId(null);
    };

    const handleMarkReceived = (poId, qty) => {
        setActiveMenuId(null);
        setConfirmState({ isOpen: true, type: 'RECEIVE', poId, data: qty });
    };

    const handleCancelPO = (poId) => {
        setActiveMenuId(null);
        setConfirmState({ isOpen: true, type: 'CANCEL', poId, data: null });
    };

    const executeConfirm = async () => {
        const { type, poId, data } = confirmState;
        try {
            if (type === 'RECEIVE') {
                await markReceived(poId, { actualQuantityReceived: data });
            } else if (type === 'CANCEL') {
                await cancelPO(poId);
            }
        } catch (error) {
            toast.error(error.message || 'Action failed');
        } finally {
            setSelectedPO(null);
            setIsDetailModalOpen(false);
            setConfirmState({ ...confirmState, isOpen: false });
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const pipelineSteps = [
        { id: 'DRAFT', label: 'Draft', icon: FileText },
        { id: 'PENDING', label: 'Pending', icon: Clock },
        { id: 'APPROVED', label: 'Approved', icon: CheckCircle },
        { id: 'DISPATCHED', label: 'Dispatched', icon: Truck },
        { id: 'RECEIVED', label: 'Received', icon: MapPin }
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Purchase Orders</h1>
                    <p className="text-slate-400 mt-2">Manage procurement and vendor restocks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/purchase-orders/recommendations"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 rounded-lg font-medium border border-indigo-500/30 transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        <Brain className="w-4 h-4" /> AI Recommendations
                    </Link>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4" /> Create PO
                    </button>
                </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-400">Total POs</p>
                        <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.totalPOs || 0}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-amber-500">Pending</p>
                        <Clock className="w-4 h-4 text-amber-500/70" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.byStatus?.PENDING || 0}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-emerald-400">Approved/Transit</p>
                        <Truck className="w-4 h-4 text-emerald-500/70" />
                    </div>
                    <p className="text-2xl font-bold text-white">{(stats?.byStatus?.APPROVED || 0) + (stats?.byStatus?.DISPATCHED || 0)}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-400">This Month</p>
                        <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">${(stats?.thisMonthAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm bg-gradient-to-br from-indigo-900/20 to-slate-800">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-indigo-400">AI Suggested</p>
                        <Brain className="w-4 h-4 text-indigo-400/70" />
                    </div>
                    <p className="text-2xl font-bold text-indigo-50">{stats?.aiSuggestedCount || 0}</p>
                </div>
            </div>

            {/* PIPELINE & FILTERS */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">

                {/* Visual Pipeline Stepper */}
                <div className="p-1 px-[2%] bg-slate-900/30 border-b border-slate-700 hidden md:block">
                    <div className="flex items-center justify-between py-4">
                        {pipelineSteps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <button
                                    onClick={() => handleFilterChange('status', filters.status === step.id ? '' : step.id)}
                                    className={`flex flex-col items-center flex-1 gap-2 transition-transform hover:-translate-y-1 ${filters.status === step.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${filters.status === step.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-600 bg-slate-800 text-slate-400'}`}>
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-xs font-bold tracking-wider uppercase ${filters.status === step.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </button>
                                {idx < pipelineSteps.length - 1 && (
                                    <div className="flex-1 h-px bg-slate-700 relative -top-3">
                                        <ChevronRight className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-700" />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="p-4 flex gap-4 overflow-x-auto flex-wrap md:flex-nowrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search PO number or product..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none min-w-[150px]"
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="RECEIVED">Received</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className={`bg-slate-800 border border-slate-700 rounded-xl shadow-sm ${activeMenuId ? '' : 'overflow-hidden'}`}>
                <div className={`${activeMenuId ? '' : 'overflow-x-auto'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700 uppercase text-[10px] font-bold tracking-wider text-slate-400">
                                <th className="p-4">PO Number</th>
                                <th className="p-4">Product</th>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Total Amount</th>
                                <th className="p-4 text-center">AI</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Created Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {isLoading ? (
                                <tr><td colSpan="9" className="text-center py-12 text-slate-400">Loading purchase orders...</td></tr>
                            ) : purchaseOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-0 py-8">
                                        <EmptyState 
                                            icon={ShoppingCart} 
                                            title="No purchase orders found." 
                                            subtitle="Try adjusting your filters or create a new order." 
                                        />
                                    </td>
                                </tr>
                            ) : (
                                purchaseOrders.map((po) => (
                                    <tr key={po._id} className="hover:bg-slate-700/20 transition-colors group cursor-pointer" onClick={() => openDetails(po)}>
                                        <td className="p-4 font-mono font-medium text-indigo-300">
                                            {po.poNumber}
                                        </td>
                                        <td className="p-4 text-white font-medium flex items-center gap-2">
                                            <Package className="w-4 h-4 text-slate-500" />
                                            {po.productId?.name}
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {po.vendorId?.company || po.vendorId?.name}
                                        </td>
                                        <td className="p-4 text-slate-300 font-medium">
                                            {po.quantity} {po.productId?.unit}
                                        </td>
                                        <td className="p-4 text-emerald-400 font-medium">
                                            ${po.totalAmount?.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {po.suggestedByAI ? <Brain className="w-4 h-4 text-indigo-400 mx-auto" /> : <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border ${getStatusColor(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 text-xs">
                                            {new Date(po.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right relative">
                                            <div className="relative inline-block text-left" onClick={(e) => handleActionClick(po, e)}>
                                                <button className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                                {activeMenuId === po._id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden text-sm">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openDetails(po); }}
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 flex items-center gap-2"
                                                        >
                                                            <FileText className="w-4 h-4" /> View Details
                                                        </button>

                                                        {(po.status === 'APPROVED' || po.status === 'DISPATCHED') && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleMarkReceived(po._id, po.quantity); }}
                                                                className="w-full text-left px-4 py-2 hover:bg-slate-700 text-emerald-400 flex items-center gap-2 border-t border-slate-700"
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Mark Received
                                                            </button>
                                                        )}

                                                        {['DRAFT', 'PENDING'].includes(po.status) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancelPO(po._id);
                                                                }}
                                                                className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 border-t border-slate-700"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Cancel PO
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-900/30">
                        <span className="text-sm text-slate-400">
                            Showing page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => handleFilterChange('page', pagination.page - 1)}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 disabled:opacity-50 hover:bg-slate-700"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => handleFilterChange('page', pagination.page + 1)}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 disabled:opacity-50 hover:bg-slate-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DETAILS MODAL */}
            {isDetailModalOpen && selectedPO && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                    {selectedPO.poNumber}
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusColor(selectedPO.status)}`}>
                                        {selectedPO.status}
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Created on {new Date(selectedPO.createdAt).toLocaleString()} by {selectedPO.createdBy?.name || 'System'}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Timeline */}
                        <div className="p-6 bg-slate-900 border-b border-slate-700 overflow-x-auto">
                            <div className="flex items-center justify-between min-w-[600px] gap-2">
                                <div className={`flex flex-col items-center flex-1`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedPO.createdAt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>1</div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-300">Drafted</span>
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-700 mt-[-20px]"></div>
                                <div className={`flex flex-col items-center flex-1`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedPO.sentToVendorAt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>2</div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-300">Pending</span>
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-700 mt-[-20px]"></div>
                                <div className={`flex flex-col items-center flex-1`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedPO.approvedAt || selectedPO.rejectedAt ? (selectedPO.rejectedAt ? 'bg-rose-500 text-white border-rose-500' : 'bg-green-500 text-white border-green-500') : 'bg-slate-800 border-slate-600 text-slate-500'}`}>3</div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-300">{selectedPO.rejectedAt ? 'Rejected' : 'Approved'}</span>
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-700 mt-[-20px]"></div>
                                <div className={`flex flex-col items-center flex-1`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedPO.dispatchedAt ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>4</div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-300">Shipped</span>
                                </div>
                                <div className="h-0.5 flex-1 bg-slate-700 mt-[-20px]"></div>
                                <div className={`flex flex-col items-center flex-1`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedPO.receivedAt ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>5</div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-300">Received</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col md:flex-row p-6 gap-6">

                            {/* LEFT */}
                            <div className="w-full md:w-1/2 space-y-4">
                                <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Product Information</h3>
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-slate-800 rounded border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {selectedPO.productId?.image ? (
                                                <img src={selectedPO.productId.image} alt={selectedPO.productId.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-white leading-tight">{selectedPO.productId?.name}</p>
                                            <p className="text-xs text-indigo-400 mt-1">{selectedPO.productId?.sku}</p>
                                            <Link to={`/products/${selectedPO.productId?._id}`} className="text-xs text-indigo-500 hover:text-indigo-400 mt-2 inline-block border-b border-indigo-500/30">View Catalog Page →</Link>
                                        </div>
                                    </div>
                                    {selectedPO.suggestedByAI && (
                                        <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg flex items-start gap-2 text-sm text-indigo-300">
                                            <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p>This Purchase Order was intelligently mapped by the SmartShelfX demand forecasting engine.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Vendor Details</h3>
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <div className="text-slate-400">Company:</div>
                                        <div className="text-white font-medium">{selectedPO.vendorId?.company || selectedPO.vendorId?.name}</div>
                                        <div className="text-slate-400">Email:</div>
                                        <div className="text-indigo-400">{selectedPO.vendorId?.email}</div>
                                        <div className="text-slate-400">Notified:</div>
                                        <div className="text-slate-300">{selectedPO.emailSentToVendor ? '✅ Yes' : '❌ No'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT */}
                            <div className="w-full md:w-1/2 space-y-4">
                                <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Order Ledger</h3>
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <div className="text-slate-400">Quantity Ordered:</div>
                                        <div className="text-white font-bold">{selectedPO.quantity} <span className="text-xs font-normal text-slate-500">{selectedPO.productId?.unit}</span></div>

                                        <div className="text-slate-400">Unit Cost:</div>
                                        <div className="text-white">${selectedPO.unitPrice?.toFixed(2)}</div>

                                        <div className="text-slate-400 pt-2 border-t border-slate-700/50">Total Amount:</div>
                                        <div className="text-emerald-400 font-bold text-lg pt-1 border-t border-slate-700/50">${selectedPO.totalAmount?.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Logistics & Notes</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Expected Delivery:</span>
                                            <span className="text-white">{selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString() : 'Pending Confirmation'}</span>
                                        </div>
                                        {(selectedPO.internalNote || selectedPO.vendorNote) && <div className="h-px w-full bg-slate-700/50 my-2"></div>}
                                        {selectedPO.internalNote && (
                                            <div>
                                                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Internal Note (To Vendor)</span>
                                                <p className="text-slate-300 italic">"{selectedPO.internalNote}"</p>
                                            </div>
                                        )}
                                        {selectedPO.vendorNote && (
                                            <div className="mt-2">
                                                <span className="text-xs text-indigo-400 uppercase tracking-wider block mb-1">Vendor Reply Note</span>
                                                <p className="text-slate-300">"{selectedPO.vendorNote}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedPO.rejectionReason && (
                                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                                        <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Rejection Reason</h3>
                                        <p className="text-rose-400 text-sm">"{selectedPO.rejectionReason}"</p>
                                    </div>
                                )}

                                {selectedPO.stockTransactionId && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Stock Arrived & Recorded</h3>
                                            <p className="text-emerald-400/80 text-xs">Ledger entry successfully written to inventory.</p>
                                        </div>
                                        <Link to="/transactions" className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded text-xs font-bold border border-emerald-500/30 transition-colors">
                                            View Tx
                                        </Link>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-600 font-medium">Close</button>

                            {['APPROVED', 'DISPATCHED'].includes(selectedPO.status) && (
                                <button
                                    onClick={() => handleMarkReceived(selectedPO._id, selectedPO.quantity)}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium border border-emerald-500 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark Received
                                </button>
                            )}

                            {['DRAFT', 'PENDING'].includes(selectedPO.status) && (
                                                <button
                                                    onClick={() => handleCancelPO(selectedPO._id)}
                                                    className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/40 rounded-lg transition-colors font-medium flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" /> Cancel PO
                                                </button>
                                            )}

                        </div>
                    </div>
                </div>
            )}

            <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <ConfirmDialog 
                isOpen={confirmState.isOpen}
                title={confirmState.type === 'RECEIVE' ? 'Confirm Stock Receipt' : 'Cancel Purchase Order'}
                message={confirmState.type === 'RECEIVE' ? 'Are you sure you want to mark this shipment as received? This will permanently add stock to your inventory and cannot be undone.' : 'WARNING: Cancelling this PO stops all tracking and invalidates any vendor approvals. Are you sure?'}
                confirmLabel={confirmState.type === 'RECEIVE' ? 'Yes, Receive Stock' : 'Yes, Cancel PO'}
                confirmColor={confirmState.type === 'RECEIVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}
                onConfirm={executeConfirm}
                onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
            />
        </div>
    );
};

export default PurchaseOrdersPage;
