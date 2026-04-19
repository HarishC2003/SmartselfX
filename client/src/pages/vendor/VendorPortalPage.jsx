import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { useDeclarations } from '@/context/DeclarationContext';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, Truck, Package, XCircle, FileText, Search, MoreVertical, Calendar, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const VendorPortalPage = () => {
    const { user } = useAuth();
    const {
        purchaseOrders, pagination, stats, isLoading,
        fetchPOs, fetchStats, approvePO, rejectPO, markDispatched
    } = usePurchaseOrders();
    const { myDeclarations, pendingAssignments, summary: declSummary } = useDeclarations();
    
    const totalZeroStock = myDeclarations.filter(d => d.availableQty === 0).length;

    const [filters, setFilters] = useState({
        status: '', search: '', page: 1, limit: 10
    });

    // Special local fetching state for the top priority PENDING action cards
    const [pendingPOs, setPendingPOs] = useState([]);
    const [isPendingLoading, setIsPendingLoading] = useState(true);

    const [activeMenuId, setActiveMenuId] = useState(null);

    // Form inputs state mapped by PO ID for inline handling
    const [actionData, setActionData] = useState({});
    
    const [confirmState, setConfirmState] = useState({ isOpen: false, poId: null });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    useEffect(() => {
        fetchPOs(filters);
        fetchStats();
    }, [filters, fetchPOs, fetchStats]);

    useEffect(() => {
        // Sync the high-priority "Action Required" list whenever general POs list changes
        if (purchaseOrders) {
            setPendingPOs(purchaseOrders.filter(po => po.status === 'PENDING'));
            setIsPendingLoading(false);
        }
    }, [purchaseOrders]);

    const refreshPending = async () => {
        await fetchPOs(filters);
        await fetchStats();
    };

    const handleActionChange = (poId, field, value) => {
        setActionData(prev => ({
            ...prev,
            [poId]: {
                ...prev[poId],
                [field]: value
            }
        }));
    };

    // Card Inline Mode state: 'APPROVE', 'REJECT', null
    const [activeInlineMode, setActiveInlineMode] = useState({});

    const submitApprove = async (poId) => {
        const data = actionData[poId] || {};
        if (!data.expectedDeliveryDate) return toast.error("Expected delivery date is required");
        try {
            await approvePO(poId, { expectedDeliveryDate: data.expectedDeliveryDate, vendorNote: data.vendorNote });
            refreshPending();
            setActiveInlineMode(prev => ({ ...prev, [poId]: null }));
        } catch (err) { }
    };

    const submitReject = async (poId) => {
        const data = actionData[poId] || {};
        if (!data.rejectionReason) return toast.error("Rejection reason is required");
        try {
            await rejectPO(poId, { rejectionReason: data.rejectionReason });
            refreshPending();
            setActiveInlineMode(prev => ({ ...prev, [poId]: null }));
        } catch (err) { }
    };

    const handleMarkDispatched = (poId) => {
        setConfirmState({ isOpen: true, poId });
    };

    const executeDispatch = async () => {
        try {
            await markDispatched(confirmState.poId);
        } catch (err) { }
        setConfirmState({ isOpen: false, poId: null });
    };

    // Format utility
    const getStatusColor = (status) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-700 text-slate-300';
            case 'PENDING': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'DISPATCHED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'RECEIVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'REJECTED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'CANCELLED': return 'bg-slate-800 text-slate-500 border-slate-700 line-through';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 pb-32" onClick={() => setActiveMenuId(null)}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user?.name || user?.company || 'Vendor'}</h1>
                    <p className="text-slate-400 mt-2">Manage all procurement flows dispatched directly to you.</p>
                </div>
            </div>

            {/* VENDOR DECLARATION SUMMARY ROW */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-gradient-to-r from-indigo-900/40 to-slate-800 rounded-xl border border-indigo-500/20 shadow-md">
                <div>
                    <h2 className="text-lg font-bold text-white mb-1">Your Stock Declarations</h2>
                    <p className="text-slate-400 text-sm flex gap-4">
                        <span className="flex items-center gap-1"><Package className="w-4 h-4 text-indigo-400"/> {declSummary?.total || 0} Products Declared</span>
                        <span className="flex items-center gap-1"><span className="text-indigo-400 font-bold">₹</span> {declSummary?.totalValue?.toLocaleString('en-IN') || 0} Total Value</span>
                    </p>
                </div>
                <Link to="/vendor-portal/my-stock" className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    Manage My Stock <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* NEW ASSIGNMENTS ALERT */}
            {pendingAssignments?.length > 0 && (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-emerald-400 font-bold text-lg">New Product Assignments</h3>
                            <p className="text-slate-400 text-sm">Admin has assigned {pendingAssignments.length} new products to you. Please provide your stock details to list them.</p>
                        </div>
                    </div>
                    <Link to="/vendor-portal/my-stock?view=assigned" className="whitespace-nowrap px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                        View & Declare Stock
                    </Link>
                </div>
            )}
            
            {/* ZERO STOCK WARNING */}
            {totalZeroStock > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <div>
                            <p className="text-rose-400 font-semibold">Stock Warning</p>
                            <p className="text-rose-500/80 text-sm">{totalZeroStock} of your declared products show 0 available units. Update your stock so managers can plan orders accurately.</p>
                        </div>
                    </div>
                    <Link to="/vendor-portal/my-stock" className="text-rose-400 text-sm font-medium hover:text-rose-300 whitespace-nowrap">
                        Update Now →
                    </Link>
                </div>
            )}


            {/* KEY METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-amber-500/20 shadow-sm shadow-amber-500/10">
                    <p className="text-sm font-medium text-amber-500 flex items-center gap-2 mb-2"><Clock className="w-4 h-4" /> Awaiting Response</p>
                    <p className="text-3xl font-black text-amber-400">{stats?.byStatus?.PENDING || 0}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-green-500/20">
                    <p className="text-sm font-medium text-green-500 flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4" /> Approved</p>
                    <p className="text-3xl font-black text-green-400">{stats?.byStatus?.APPROVED || 0}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-500 flex items-center gap-2 mb-2"><Truck className="w-4 h-4" /> Dispatched</p>
                    <p className="text-3xl font-black text-blue-400">{stats?.byStatus?.DISPATCHED || 0}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <p className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-2"><Package className="w-4 h-4" /> Total Tracking</p>
                    <p className="text-3xl font-black text-white">{stats?.totalPOs || 0}</p>
                </div>
            </div>

            {/* PENDING ACTIONS (High Priority) */}
            {pendingPOs.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-amber-500/10 border-l-4 border-amber-500 px-4 py-3 rounded-r-xl flex items-center shadow-inner">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0 mr-3" />
                        <div>
                            <h2 className="text-amber-400 font-bold tracking-wide">Action Required</h2>
                            <p className="text-amber-300/80 text-sm">You have {pendingPOs.length} purchase orders awaiting review. Please approve or reject immediately.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {pendingPOs.map(po => {
                            const mode = activeInlineMode[po._id];
                            const localData = actionData[po._id] || {};

                            // Prep defaulting 3 days if empty
                            const initDefaultDate = () => {
                                const d = new Date(); d.setDate(d.getDate() + 3);
                                return d.toISOString().split('T')[0];
                            };

                            return (
                                <div key={po._id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl flex flex-col">
                                    <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-start">
                                        <div>
                                            <h3 className="font-mono text-indigo-400 font-bold">{po.poNumber}</h3>
                                            <p className="text-xs text-slate-500 mt-1">Sent: {new Date(po.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="px-2 py-1 text-[10px] font-bold uppercase rounded border bg-amber-500/20 text-amber-500 border-amber-500/30 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> PENDING
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-slate-900 rounded border border-slate-700 flex items-center justify-center shrink-0">
                                                <Package className="w-6 h-6 text-slate-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-lg font-bold text-white leading-tight">{po.productId?.name}</p>
                                                <div className="grid grid-cols-2 gap-y-2 mt-3 text-sm">
                                                    <div className="text-slate-400">Order Qty:</div>
                                                    <div className="text-white font-black">{po.quantity}</div>
                                                    <div className="text-slate-400">Total Price:</div>
                                                    <div className="text-emerald-400 font-bold">₹{po.totalAmount?.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {po.internalNote && (
                                            <div className="mt-5 p-3 bg-slate-900/50 rounded flex gap-3 text-sm border-l-2 border-indigo-500">
                                                <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                                <div className="italic text-slate-300">"{po.internalNote}" <span className="text-xs font-bold text-indigo-400/50 uppercase ml-2">— Manager</span></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footers */}
                                    {!mode ? (
                                        <div className="p-4 border-t border-slate-700 flex gap-3 bg-slate-900">
                                            <button
                                                onClick={() => {
                                                    setActiveInlineMode(prev => ({ ...prev, [po._id]: 'REJECT' }));
                                                }}
                                                className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Reject Order
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleActionChange(po._id, 'expectedDeliveryDate', initDefaultDate());
                                                    setActiveInlineMode(prev => ({ ...prev, [po._id]: 'APPROVE' }));
                                                }}
                                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-emerald-600/20"
                                            >
                                                Approve Order
                                            </button>
                                        </div>
                                    ) : mode === 'APPROVE' ? (
                                        <div className="p-5 border-t border-emerald-500/30 bg-emerald-900/10">
                                            <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Confirm Promise of Delivery</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Expected Delivery Date *</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={localData.expectedDeliveryDate || ''}
                                                        onChange={(e) => handleActionChange(po._id, 'expectedDeliveryDate', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Vendor Notice (Optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Any internal shipment tracking info..."
                                                        value={localData.vendorNote || ''}
                                                        onChange={(e) => handleActionChange(po._id, 'vendorNote', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button onClick={() => setActiveInlineMode(prev => ({ ...prev, [po._id]: null }))} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                                                    <button onClick={() => submitApprove(po._id)} className="px-4 py-1.5 bg-emerald-600 text-white font-medium rounded-md text-sm border border-emerald-500 shadow-md">Confirm Approval</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-5 border-t border-rose-500/30 bg-rose-900/10">
                                            <h4 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2"><XCircle className="w-4 h-4" /> Confirm Rejection</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Reason for Rejection *</label>
                                                    <textarea
                                                        required
                                                        rows="2"
                                                        placeholder="Item out of stock, delayed, or unknown..."
                                                        value={localData.rejectionReason || ''}
                                                        onChange={(e) => handleActionChange(po._id, 'rejectionReason', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm resize-none"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button onClick={() => setActiveInlineMode(prev => ({ ...prev, [po._id]: null }))} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                                                    <button onClick={() => submitReject(po._id)} className="px-4 py-1.5 bg-rose-600 text-white font-medium rounded-md text-sm border border-rose-500 shadow-md">Submit Rejection</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TABBED TABLE FILTER BAR */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm pt-4 mt-8">

                <div className="px-6 flex overflow-x-auto gap-4 border-b border-slate-700/50 custom-scrollbar">
                    {['', 'PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'REJECTED'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleFilterChange('status', tab)}
                            className={`px-4 py-3 font-bold text-sm uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${filters.status === tab ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab === '' ? 'ALL ORDERS' : tab}
                        </button>
                    ))}
                </div>

                <div className="p-4 flex gap-4 bg-slate-900/40 border-b border-slate-700">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search order ID or items..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-700 uppercase text-[10px] font-bold tracking-wider text-slate-400">
                                <th className="p-4">PO Number</th>
                                <th className="p-4">Product Name</th>
                                <th className="p-4">Qty</th>
                                <th className="p-4">Value</th>
                                <th className="p-4">Delivery Plan</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {isLoading && purchaseOrders.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-slate-400">Syncing with facility logic...</td></tr>
                            ) : purchaseOrders.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-slate-400 bg-slate-900/20 italic">No purchase orders found matching internal registry.</td></tr>
                            ) : (
                                purchaseOrders.map((po) => (
                                    <tr key={po._id} className="hover:bg-slate-700/30 transition-colors pointer-events-auto">
                                        <td className="p-4 font-mono font-medium text-indigo-300">{po.poNumber}</td>
                                        <td className="p-4 text-white font-medium">{po.productId?.name}</td>
                                        <td className="p-4 text-slate-300 font-bold">{po.quantity}</td>
                                        <td className="p-4 text-emerald-400 font-medium">₹{po.totalAmount?.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-slate-400 text-xs">
                                            {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded border tracking-wide whitespace-nowrap ${getStatusColor(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {po.status === 'APPROVED' ? (
                                                <button
                                                    onClick={() => handleMarkDispatched(po._id)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs shadow-md border border-blue-500 whitespace-nowrap flex items-center gap-1 ml-auto"
                                                >
                                                    <Truck className="w-3 h-3" /> Mark Dispatched
                                                </button>
                                            ) : (
                                                <button className="px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs opacity-50 cursor-not-allowed whitespace-nowrap font-medium ml-auto">
                                                    Action Locked
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog 
                isOpen={confirmState.isOpen}
                title="Mark Shipped"
                message="Are you sure this order has been physically dispatched from your facility?"
                confirmLabel="Yes, Mark Shipped"
                confirmColor="bg-blue-600 hover:bg-blue-500"
                onConfirm={executeDispatch}
                onCancel={() => setConfirmState({ isOpen: false, poId: null })}
            />
        </div>
    );
};

export default VendorPortalPage;
