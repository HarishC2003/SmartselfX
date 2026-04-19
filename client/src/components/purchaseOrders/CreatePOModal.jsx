import React, { useState, useEffect } from 'react';
import { X, Package, User, Plus, Minus, ShoppingCart, Search, CheckCircle, Brain, Calendar } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreatePOModal = ({
    isOpen,
    onClose,
    prefilledProduct = null,
    suggestedByAI = false,
    prefilledQuantity = null,
    forecastDataId = null
}) => {
    const { products, fetchProducts } = useProducts();
    const { createPO } = usePurchaseOrders();
    const navigate = useNavigate();

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Form State
    const [quantity, setQuantity] = useState(1);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [internalNote, setInternalNote] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Initialize state
    useEffect(() => {
        if (isOpen) {
            if (prefilledProduct) {
                setSelectedProduct(prefilledProduct);
                setQuantity(prefilledQuantity || prefilledProduct.reorderQuantity || 1);
            } else {
                fetchProducts({ limit: 100 }); // Load products for dropdown
            }

            // Set default delivery date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setExpectedDeliveryDate(tomorrow.toISOString().split('T')[0]);
        } else {
            // Reset
            setSelectedProduct(null);
            setQuantity(1);
            setInternalNote('');
            setSearchTerm('');
            setSuccessData(null);
        }
    }, [isOpen, prefilledProduct, prefilledQuantity]);

    // Derived values
    const unitPrice = selectedProduct?.costPrice || 0;
    const totalAmount = unitPrice * quantity;
    const maxAllowed = selectedProduct?.maxStockLevel ? Math.max(0, selectedProduct.maxStockLevel - selectedProduct.currentStock) : 9999;

    const filteredProducts = products.filter(p => p.isActive && p.vendorId && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleQtyChange = (newQty) => {
        if (newQty < 1) newQty = 1;
        if (newQty > maxAllowed && maxAllowed > 0) newQty = maxAllowed;
        setQuantity(newQty);
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setQuantity(product.reorderQuantity || 1);
        setShowDropdown(false);
        setSearchTerm('');
    };

    const handleSubmit = async (submitStatus) => {
        if (!selectedProduct) return toast.error('Please select a product');
        if (quantity < 1) return toast.error('Quantity must be at least 1');

        setIsSubmitting(true);
        try {
            const data = await createPO({
                productId: selectedProduct._id || selectedProduct.id, // Support different object formats
                quantity,
                expectedDeliveryDate,
                internalNote,
                suggestedByAI,
                forecastDataId,
                status: submitStatus // 'DRAFT' or 'PENDING'
            });

            setSuccessData({
                poNumber: data.po.poNumber,
                vendorName: selectedProduct.vendorId?.name || selectedProduct.vendorName,
                status: submitStatus
            });

        } catch (error) {
            // Error is handled by context toast usually, but we keep modal open
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (successData) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-8 text-center">
                    <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Purchase Order Created!</h2>
                    <p className="text-slate-300 mb-8 leading-relaxed">
                        {successData.status === 'DRAFT'
                            ? `Draft PO ${successData.poNumber} has been saved locally.`
                            : `✅ PO ${successData.poNumber} created and sent to ${successData.vendorName} for approval.`
                        }
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/purchase-orders');
                            }}
                            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            View Purchase Orders
                        </button>
                        <button
                            onClick={() => {
                                setSuccessData(null);
                                if (!prefilledProduct) setSelectedProduct(null);
                            }}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8">

                {/* Header */}
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-indigo-400" />
                        Create Purchase Order
                        {suggestedByAI && (
                            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30 font-bold flex items-center gap-1 uppercase tracking-wider">
                                <Brain className="w-3 h-3" /> AI Suggested
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 min-h-[500px]">

                    {/* LEFT COLUMN: Read-only Info */}
                    <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-700 bg-slate-800/50 p-6 space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Select Product</label>
                            {prefilledProduct ? (
                                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center">
                                        <Package className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{selectedProduct?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">SKU: {selectedProduct?.sku}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onFocus={() => setShowDropdown(true)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    {showDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredProducts.length > 0 ? filteredProducts.map(p => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => handleSelectProduct(p)}
                                                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{p.name}</p>
                                                        <p className="text-xs text-indigo-400">{p.sku}</p>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded">Stock: {p.currentStock}</span>
                                                </div>
                                            )) : (
                                                <div className="p-3 text-sm text-slate-500 text-center">No active products with vendors found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedProduct && (
                            <>
                                {/* Product Summary Card */}
                                <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Inventory Status</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Current Stock</p>
                                            <p className="text-lg font-bold text-white">{selectedProduct.currentStock} {selectedProduct.unit}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Reorder Level</p>
                                            <p className="text-lg font-bold text-slate-300">{selectedProduct.reorderLevel}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Max Capacity</p>
                                            <p className="text-sm font-medium text-slate-300">{selectedProduct.maxStockLevel || 'None'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Category</p>
                                            <p className="text-sm font-medium text-indigo-400">{typeof selectedProduct.category === 'object' ? selectedProduct.category.name : 'Unknown'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor Card */}
                                <div className="bg-indigo-900/20 rounded-xl border border-indigo-500/30 p-4 flex items-start gap-4">
                                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-indigo-300 mb-1">Assigned Vendor</h3>
                                        <p className="text-sm text-white font-medium">{selectedProduct.vendorId?.name || selectedProduct.vendorName || 'Unknown Vendor'}</p>
                                        <p className="text-xs text-indigo-400/70 mt-0.5">{selectedProduct.vendorId?.email || 'No email on file'}</p>
                                        <div className="mt-2 text-[10px] text-indigo-400/50 uppercase font-bold tracking-wider">
                                            PO will be routed to this entity
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {!selectedProduct && (
                            <div className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl flex items-center justify-center p-6 text-center text-slate-500">
                                Select a product to view inventory and vendor routing details.
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Form */}
                    <div className="w-full md:w-7/12 p-6 flex flex-col justify-between relative">
                        {/* Overlay if no product to block form actions */}
                        {!selectedProduct && <div className="absolute inset-0 z-10 bg-slate-800/40 backdrop-blur-[1px]"></div>}

                        <div className="space-y-6">
                            {/* Qty & Cost row */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Order Quantity *</label>
                                    <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                                        <button
                                            type="button"
                                            onClick={() => handleQtyChange(quantity - 1)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={maxAllowed}
                                            value={quantity}
                                            onChange={(e) => handleQtyChange(Number(e.target.value))}
                                            className="flex-1 text-center bg-transparent text-white font-bold text-lg outline-none w-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleQtyChange(quantity + 1)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1.5 text-right font-medium">Max Limit: {maxAllowed}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit Price</label>
                                    <div className="bg-slate-900/50 rounded-lg border border-slate-700 flex items-center h-12 px-4 cursor-not-allowed">
                                        <span className="text-slate-400 font-medium">$ {unitPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1.5 text-right font-medium">Locked to system cost</div>
                                </div>
                            </div>

                            {/* Live Amount Math Panel */}
                            <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 flex justify-between items-center shadow-inner">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                                <span className="text-3xl font-black text-emerald-400">${totalAmount.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={expectedDeliveryDate}
                                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Internal Note / Instructions (Optional)</label>
                                    <textarea
                                        maxLength="500"
                                        rows="3"
                                        value={internalNote}
                                        onChange={(e) => setInternalNote(e.target.value)}
                                        placeholder="Add instructions for vendor..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                                    />
                                    <div className="text-right text-xs text-slate-500 mt-1">{internalNote.length}/500</div>
                                </div>
                            </div>

                            {/* ASCII Preview styling */}
                            {selectedProduct && (
                                <div className="bg-[#0A0F1C] border border-slate-800 rounded p-4 font-mono text-xs text-emerald-500/70 shadow-inner">
                                    PO-Preview<br />
                                    Product:  {selectedProduct.name}<br />
                                    Qty:      {quantity} units<br />
                                    Amount:   ${totalAmount.toFixed(2)}<br />
                                    Vendor:   {selectedProduct.vendorId?.name || selectedProduct.vendorName}<br />
                                    <span className="text-indigo-400/80">📧 Trigger: PENDING → EMAIL TO VENDOR</span>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-6 mt-6 border-t border-slate-700 flex flex-wrap-reverse md:flex-wrap items-center justify-end gap-3 w-full">
                            <button
                                onClick={onClose}
                                className="w-full md:w-auto px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmit('DRAFT')}
                                disabled={isSubmitting || !selectedProduct}
                                className="w-full md:w-auto px-5 py-2.5 text-sm font-medium text-indigo-300 bg-indigo-900/20 hover:bg-indigo-900/40 rounded-lg transition-colors border border-indigo-500/30 whitespace-nowrap"
                            >
                                Save as Draft
                            </button>
                            <button
                                onClick={() => handleSubmit('PENDING')}
                                disabled={isSubmitting || !selectedProduct}
                                className="w-full md:w-auto px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>Send to Vendor <span className="text-lg leading-none">→</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePOModal;
