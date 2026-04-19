import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowUpCircle, CheckCircle, Search, Package2, AlertCircle } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { useProducts } from '../../context/ProductContext';

const StockInModal = ({ isOpen, onClose, initialProduct = null, onSuccess }) => {
    const { performStockIn, isLoading } = useTransaction();
    const { products, fetchProducts } = useProducts();

    const [selectedProduct, setSelectedProduct] = useState(initialProduct);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [quantity, setQuantity] = useState('');
    const [referenceType, setReferenceType] = useState('MANUAL');
    const [referenceId, setReferenceId] = useState('');
    const [note, setNote] = useState('');

    const [successState, setSuccessState] = useState(null);

    // Fetch products if no initial product
    useEffect(() => {
        if (isOpen && !initialProduct && products.length === 0) {
            fetchProducts({ limit: 100 });
        }
    }, [isOpen, initialProduct, products.length, fetchProducts]);

    useEffect(() => {
        if (isOpen) {
            setSelectedProduct(initialProduct);
            setQuantity('');
            setReferenceType('MANUAL');
            setReferenceId('');
            setNote('');
            setSuccessState(null);
            setSearchQuery('');
            setShowDropdown(false);
        }
    }, [isOpen, initialProduct]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products.slice(0, 10);
        const lowerSearch = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.sku.toLowerCase().includes(lowerSearch)
        ).slice(0, 10);
    }, [products, searchQuery]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSearchQuery('');
        setShowDropdown(false);
    };

    const parsedQty = parseInt(quantity, 10) || 0;
    const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
    const newStock = currentStock + parsedQty;
    const reorderLevel = selectedProduct ? selectedProduct.reorderLevel : 0;
    const maxStockLevel = selectedProduct ? selectedProduct.maxStockLevel : Infinity;

    // Recalculate status live
    let newStatus = 'IN_STOCK';
    let statusColor = 'text-green-400';
    if (newStock === 0) {
        newStatus = 'OUT_OF_STOCK';
        statusColor = 'text-red-400';
    } else if (newStock <= reorderLevel) {
        newStatus = 'LOW_STOCK';
        statusColor = 'text-amber-400';
    } else if (newStock > maxStockLevel) {
        newStatus = 'OVERSTOCKED';
        statusColor = 'text-blue-400';
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        if (parsedQty <= 0) return;

        try {
            const res = await performStockIn({
                productId: selectedProduct._id,
                quantity: parsedQty,
                referenceType,
                referenceId,
                note
            });

            // Show success state
            setSuccessState({
                productName: selectedProduct.name,
                before: currentStock,
                after: newStock
            });

            if (onSuccess) onSuccess(res);

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            // Error handled in context
        }
    };

    if (!isOpen) return null;

    const getRefLabel = () => {
        if (referenceType === 'PURCHASE_ORDER') return 'PO Number';
        if (referenceType === 'RETURN') return 'RMA / Return Number';
        return 'Reference Number';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <ArrowUpCircle className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Record Stock In</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-black/20 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {successState ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
                        <h3 className="text-2xl font-bold text-white">Stock Updated!</h3>
                        <p className="text-slate-300">
                            <span className="font-medium text-white">{successState.productName}</span>: {successState.before} → <span className="text-emerald-400 font-bold">{successState.after} PCS</span>
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        {/* Form Area */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-white/5 space-y-6">

                            {/* Product Info / Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Product</label>
                                {selectedProduct ? (
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between items-center relative group">
                                        <div className="flex gap-4 items-center">
                                            {selectedProduct.imageUrl ? (
                                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-12 h-12 rounded-lg object-cover bg-slate-800" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                                                    <Package2 className="w-6 h-6 text-slate-500" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-white">{selectedProduct.name}</h4>
                                                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-indigo-500/20 text-indigo-300">{selectedProduct.sku}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {selectedProduct.categoryId?.name || 'Category'} | {selectedProduct.vendorId?.name || 'Vendor'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">{selectedProduct.currentStock}</div>
                                            <div className="text-xs text-slate-400 uppercase">Current</div>
                                        </div>
                                        {!initialProduct && (
                                            <button
                                                onClick={() => setSelectedProduct(null)}
                                                className="absolute -top-2 -right-2 bg-slate-700 hover:bg-slate-600 text-white p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search product by name or SKU..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowDropdown(true);
                                                }}
                                                onFocus={() => setShowDropdown(true)}
                                            />
                                        </div>
                                        {showDropdown && (
                                            <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                                {filteredProducts.length > 0 ? (
                                                    filteredProducts.map(p => (
                                                        <div
                                                            key={p._id}
                                                            onClick={() => handleProductSelect(p)}
                                                            className="flex items-center justify-between p-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 last:border-0"
                                                        >
                                                            <div>
                                                                <div className="font-semibold text-white text-sm">{p.name}</div>
                                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-medium text-white">{p.currentStock} {p.unit}</div>
                                                                <div className="text-[10px] text-slate-500">In Stock</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-slate-400 text-sm">No products found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <form id="stockInForm" onSubmit={handleSubmit} className="space-y-4">
                                {/* Quantity */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-300">Quantity Added <span className="text-red-400">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        disabled={!selectedProduct}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="0"
                                    />
                                    {parsedQty > 0 && selectedProduct && (
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                                            <ArrowUpCircle className="w-3.5 h-3.5" />
                                            <span>New total will be: {newStock} {selectedProduct.unit}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Reference Type */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-300">Reference Type <span className="text-red-400">*</span></label>
                                        <select
                                            value={referenceType}
                                            onChange={(e) => setReferenceType(e.target.value)}
                                            required
                                            disabled={!selectedProduct}
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                                        >
                                            <option value="MANUAL">Manual Entry</option>
                                            <option value="PURCHASE_ORDER">Purchase Order</option>
                                            <option value="RETURN">Return</option>
                                            <option value="ADJUSTMENT">Adjustment</option>
                                        </select>
                                    </div>

                                    {/* Reference ID */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-300">{getRefLabel()}</label>
                                        <input
                                            type="text"
                                            disabled={!selectedProduct}
                                            value={referenceId}
                                            onChange={(e) => setReferenceId(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-sm font-medium text-slate-300">Note</label>
                                    <textarea
                                        maxLength="200"
                                        rows="2"
                                        disabled={!selectedProduct}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 resize-none"
                                        placeholder="Add remarks..."
                                    />
                                    <div className="absolute bottom-2 right-3 text-xs text-slate-500">
                                        {note.length}/200
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Live Preview Panel (Desktop: Right side / Mobile: Bottom) */}
                        <div className="w-full md:w-64 bg-slate-800/80 p-6 flex flex-col justify-center shrink-0">
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Movement Preview</h4>

                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Before:</span>
                                    <span className="text-white font-medium">{currentStock}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                                    <span className="text-slate-400">Change:</span>
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        +{parsedQty} <ArrowUpCircle className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-slate-400 text-sm">After:</span>
                                    <span className="text-white font-bold">{newStock}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="text-slate-400">Status:</span>
                                    <span className={`font-semibold flex items-center gap-1.5 ${statusColor}`}>
                                        <span className="w-2 h-2 rounded-full bg-current" />
                                        {newStatus.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            {selectedProduct && newStock > maxStockLevel && (
                                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-300 leading-relaxed">
                                        Warning: This stock in will exceed the defined maximum capacity ({maxStockLevel}).
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                {!successState && (
                    <div className="border-t border-white/10 p-4 bg-slate-900/50 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="stockInForm"
                            disabled={!selectedProduct || parsedQty <= 0 || isLoading}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Confirm Stock In'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockInModal;
