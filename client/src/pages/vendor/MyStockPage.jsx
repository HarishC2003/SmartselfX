import React, { useState, useEffect } from 'react';
import { useDeclarations } from '../../context/DeclarationContext';
import { Package, Search, Edit2, Info, Plus, Hash, Trash2, X, ChevronRight, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DeclarationModal from '../../components/vendor/DeclarationModal';
import { formatRelativeTime } from '../../utils/formatters';
import { useSearchParams } from 'react-router-dom';

const QuickQtyPopover = ({ declaration, onUpdate, onClose }) => {
    const [qty, setQty] = useState(declaration.availableQty);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const parsedQty = parseInt(qty, 10);
        if (isNaN(parsedQty) || parsedQty < 0) return;

        setLoading(true);
        try {
            await onUpdate(declaration._id, parsedQty);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute right-0 top-10 w-64 bg-slate-800 shadow-xl rounded-xl border border-white/10 p-4 z-10 animate-fade-in-up">
            <h4 className="text-sm font-semibold text-white mb-1">Update Available Qty</h4>
            <p className="text-xs text-slate-400 mb-3 truncate">{declaration.productName}</p>
            
            <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Current: {declaration.availableQty} {declaration.unit}</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={qty} 
                        onChange={e => setQty(e.target.value)}
                        min="0"
                        className="w-full p-2 text-sm bg-slate-900 border border-white/10 rounded focus:ring-2 focus:ring-indigo-500 text-white" 
                        autoFocus
                    />
                </div>
            </div>
            
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={onClose} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSave} isLoading={loading}>Save</Button>
            </div>
        </div>
    );
};

const MyStockPage = () => {
    const { 
        myDeclarations, 
        pendingAssignments,
        summary, 
        isLoading, 
        addDeclaration, 
        updateDeclaration, 
        deleteDeclaration, 
        updateQtyOnly,
        rejectAssignment
    } = useDeclarations();
    
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view');

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeclaration, setEditingDeclaration] = useState(null);
    const [showBanner, setShowBanner] = useState(true);
    
    const [qtyPopoverId, setQtyPopoverId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const filteredDeclarations = myDeclarations.filter(d => 
        d.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (declaration = null) => {
        setEditingDeclaration(declaration);
        setIsModalOpen(true);
    };

    const handleAcceptAssignment = (product) => {
        // Pre-fill declaration data from the assigned product
        setEditingDeclaration({
            productName: product.name,
            sku: product.sku,
            unit: product.unit || 'PCS',
            availableQty: 0,
            unitPrice: product.costPrice || 0,
            description: product.description || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        if (editingDeclaration && editingDeclaration._id) {
            await updateDeclaration(editingDeclaration._id, data);
        } else {
            await addDeclaration(data);
        }
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteDeclaration(deleteId);
            setDeleteId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectReason.trim()) return;
        setIsRejecting(true);
        try {
            await rejectAssignment(rejectId, rejectReason);
            setRejectId(null);
            setRejectReason('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-400" />
                        My Stock Declarations
                    </h1>
                    <p className="text-slate-400 mt-1">Declare what products you have so managers can assign you easily.</p>
                </div>
                <Button onClick={() => openModal()} className="shadow-md shadow-indigo-500/20 shadow-indigo-500/10">
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
            </div>

            {/* PENDING ASSIGNMENTS SECTION */}
            {pendingAssignments?.length > 0 && (
                <div className={`space-y-4 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl transition-all duration-500 ${initialView === 'assigned' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Pending Assignments</h2>
                                <p className="text-sm text-slate-400">Products assigned to you by Admin. Complete details to accept.</p>
                            </div>
                        </div>
                        <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {pendingAssignments.length} New
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {pendingAssignments.map(product => (
                            <div key={product._id} className="bg-slate-800/50 border border-white/5 p-4 rounded-xl hover:border-emerald-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0 pr-2">
                                        <h4 className="font-semibold text-white truncate" title={product.name}>{product.name}</h4>
                                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">{product.sku}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] py-0 h-5 border-white/10 text-slate-400">
                                        {product.categoryId?.name || 'N/A'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-xs text-slate-400 italic">
                                        Suggested Price: ₹{product.costPrice}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => setRejectId(product._id)} 
                                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs h-8 px-3 rounded-lg border border-transparent hover:border-rose-500/20"
                                        >
                                            Reject
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleAcceptAssignment(product)} 
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-lg shadow-lg shadow-emerald-500/10"
                                        >
                                            Accept & Declare
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Banner */}
            {showBanner && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 flex gap-3 relative animate-fade-in shadow-sm">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
                    <div>
                        <p className="font-medium text-sm text-indigo-300">How this works</p>
                        <p className="text-sm text-indigo-200/80">
                            These declarations help SmartShelfX managers find you when creating their product catalogs. 
                            Keep your quantities updated for accurate purchase order planning.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowBanner(false)} 
                        className="absolute right-2 top-2 p-1 text-indigo-400/50 hover:text-indigo-300 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1E293B] rounded-xl shadow-sm border border-white/5 p-6 flex items-center gap-4 hover:border-indigo-500/30 transition-all cursor-default">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-400">Total Products Declared</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white">{summary.total}</p>
                    </div>
                </div>
                <div className="bg-[#1E293B] rounded-xl shadow-sm border border-white/5 p-6 flex items-center gap-4 hover:border-emerald-500/30 transition-all cursor-default">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <span className="text-xl font-bold">₹</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-400">Total Stock Value</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white">₹{summary.totalValue?.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-[#1E293B] rounded-xl shadow-sm border border-white/5 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-semibold text-white">All Stock Declarations</h3>
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-white/5 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {filteredDeclarations.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={Package}
                                title={searchTerm ? "No products found" : "You haven't declared any stock yet."}
                                description={searchTerm ? `No results for "${searchTerm}"` : "Add the products you supply so managers can easily find and assign you when building the product catalog."}
                                action={!searchTerm && (
                                    <Button onClick={() => openModal()} variant="primary" className="mt-4">
                                        <Plus className="w-4 h-4 mr-2" /> Add Your First Product
                                    </Button>
                                )}
                            />
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/50 border-b border-white/5 text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Product & SKU</th>
                                    <th className="px-6 py-4 font-semibold">Price</th>
                                    <th className="px-6 py-4 font-semibold">Available Stock</th>
                                    <th className="px-6 py-4 font-semibold">Total Value</th>
                                    <th className="px-6 py-4 font-semibold">Last Updated</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredDeclarations.map(dec => (
                                    <tr key={dec._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-semibold text-white">{dec.productName}</div>
                                            <div className="text-xs font-mono text-slate-500 mt-0.5">{dec.sku}</div>
                                            {dec.description && (
                                                <div className="text-xs text-slate-400 mt-1 truncate max-w-[200px]" title={dec.description}>
                                                    {dec.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-medium text-white">₹{dec.unitPrice.toLocaleString('en-IN')}</div>
                                            <div className="text-xs text-slate-400">per {dec.unit}</div>
                                        </td>
                                        <td className="px-6 py-4 align-top relative">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    dec.availableQty === 0 ? 'danger' :
                                                    dec.availableQty < 10 ? 'warning' : 'success'
                                                }>
                                                    {dec.availableQty} {dec.unit}
                                                </Badge>
                                                {dec.availableQty === 0 && <span className="text-rose-500 font-bold text-xs ml-1">OUT OF STOCK</span>}
                                            </div>
                                            
                                            {qtyPopoverId === dec._id && (
                                                <QuickQtyPopover 
                                                    declaration={dec} 
                                                    onUpdate={updateQtyOnly} 
                                                    onClose={() => setQtyPopoverId(null)} 
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-top font-medium text-slate-200">
                                            ₹{(dec.availableQty * dec.unitPrice).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 align-top text-slate-400">
                                            {formatRelativeTime(dec.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 align-top text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" onClick={() => setQtyPopoverId(dec._id)} title="Update Quantity" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                                                    <Hash className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => openModal(dec)} title="Edit Details" className="text-slate-400 hover:bg-white/10 hover:text-white">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => setDeleteId(dec._id)} title="Remove Product">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <DeclarationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                declarationToEdit={editingDeclaration}
            />

            <ConfirmDialog 
                isOpen={!!deleteId}
                title="Remove Stock Declaration"
                message="Are you sure you want to remove this product from your declared stock? Managers will no longer see that you supply this product."
                confirmText="Yes, Remove"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                variant="danger"
            />

            {/* Reject Assignment Modal */}
            {rejectId && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">Reject Assignment</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Please provide a reason why you cannot supply this product. This will be visible to Admins and Managers.
                            </p>
                            
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rejection Reason *</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Out of production, insufficient stock, pricing mismatch..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all resize-none h-32"
                                autoFocus
                            />
                        </div>
                        
                        <div className="p-4 bg-slate-950/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setRejectId(null)} className="text-slate-400 hover:text-white">
                                Cancel
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={handleReject} 
                                isLoading={isRejecting}
                                disabled={!rejectReason.trim()}
                                className="bg-rose-600 hover:bg-rose-500 px-6 shadow-lg shadow-rose-900/20"
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyStockPage;
