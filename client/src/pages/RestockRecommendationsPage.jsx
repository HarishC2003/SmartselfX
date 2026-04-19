import React, { useState, useEffect } from 'react';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { Package, RefreshCw, AlertTriangle, AlertCircle, CheckCircle, ShoppingCart, Eye, SkipForward, X, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import BulkPOModal from '@/components/purchaseOrders/BulkPOModal';

const RestockRecommendationsPage = () => {
    const { recommendations, isLoading, fetchRecommendations, createPO } = usePurchaseOrders();
    const [localRecs, setLocalRecs] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [skippedIds, setSkippedIds] = useState(new Set());
    const [isCreatingPO, setIsCreatingPO] = useState(false);

    // Modal state
    const [activeModal, setActiveModal] = useState(null); // 'SINGLE' or 'BULK'
    const [currentRec, setCurrentRec] = useState(null);
    const [modalData, setModalData] = useState({ expectedDeliveryDate: '', internalNote: '' });

    useEffect(() => {
        // Initialize local copy to track quantity edits without polluting context
        if (recommendations) {
            setLocalRecs(recommendations.map(r => ({ ...r, editQty: r.suggestedQty })));
        }
    }, [recommendations]);

    const handleRefresh = async () => {
        await fetchRecommendations();
    };

    const handleQtyChange = (recId, newQty) => {
        if (newQty < 1) newQty = 1;
        setLocalRecs(prev => prev.map(r => r.productId === recId ? { ...r, editQty: newQty } : r));
    };

    const toggleSelect = (recId) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(recId)) newSet.delete(recId);
        else newSet.add(recId);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        const selectableRecs = displayRecs.filter(r => r.hasVendor);
        if (selectedIds.size === selectableRecs.length && selectableRecs.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectableRecs.map(r => r.productId)));
        }
    };

    const handleSkip = (recId) => {
        setSkippedIds(prev => new Set(prev).add(recId));
        if (selectedIds.has(recId)) {
            const newSet = new Set(selectedIds);
            newSet.delete(recId);
            setSelectedIds(newSet);
        }
    };

    const openSingleModal = (rec) => {
        setCurrentRec(rec);
        // Default delivery date: today + leadTimeDays
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + (rec.leadTimeDays || 3));
        setModalData({
            expectedDeliveryDate: defaultDate.toISOString().split('T')[0],
            internalNote: `Auto-generated based on AI recommendation. Urgent Score: ${rec.urgencyScore}`
        });
        setActiveModal('SINGLE');
    };

    const openBulkModal = () => {
        if (selectedIds.size === 0) return;
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 5); // generic average 5 days for bulk
        setModalData({
            expectedDeliveryDate: defaultDate.toISOString().split('T')[0],
            internalNote: `Bulk generated tracking AI recommendations.`
        });
        setActiveModal('BULK');
    };

    const closeModals = () => {
        setActiveModal(null);
        setCurrentRec(null);
    };

    const submitSinglePO = async (e) => {
        e.preventDefault();
        setIsCreatingPO(true);
        try {
            await createPO({
                productId: currentRec.productId,
                quantity: currentRec.editQty,
                expectedDeliveryDate: modalData.expectedDeliveryDate,
                internalNote: modalData.internalNote,
                suggestedByAI: true,
                forecastDataId: currentRec.forecastDataId
            });
            handleSkip(currentRec.productId); // Hide from view after success
            closeModals();
        } finally {
            setIsCreatingPO(false);
        }
    };

    const submitBulkPOs = async (e) => {
        e.preventDefault();
        setIsCreatingPO(true);
        try {
            const targets = displayRecs.filter(r => selectedIds.has(r.productId));
            for (const target of targets) {
                await createPO({
                    productId: target.productId,
                    quantity: target.editQty,
                    expectedDeliveryDate: modalData.expectedDeliveryDate,
                    internalNote: modalData.internalNote,
                    suggestedByAI: true,
                    forecastDataId: target.forecastDataId
                });
                handleSkip(target.productId);
            }
            setSelectedIds(new Set());
            closeModals();
        } finally {
            setIsCreatingPO(false);
        }
    };

    const displayRecs = localRecs.filter(r => !skippedIds.has(r.productId));

    const criticalCount = displayRecs.filter(r => r.stockoutRisk === 'CRITICAL').length;
    const highCount = displayRecs.filter(r => r.stockoutRisk === 'HIGH').length;
    const activePOCount = displayRecs.filter(r => r.hasActivePO).length;

    const getBorderColor = (rec) => {
        if (rec.hasActivePO) return 'border-slate-600';
        if (rec.stockoutRisk === 'CRITICAL') return 'border-rose-500';
        if (rec.stockoutRisk === 'HIGH') return 'border-amber-500';
        return 'border-yellow-400';
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-4xl pr-1">🤖</span> AI Restock Recommendations
                    </h1>
                    <p className="text-slate-400 mt-2 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Powered by demand forecasting. Review and approve to generate POs.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Analysis
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-rose-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-rose-500/20 text-rose-500 rounded-lg">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Urgent (CRITICAL)</p>
                        <p className="text-2xl font-bold text-white">{criticalCount}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 text-amber-500 rounded-lg">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">High Priority</p>
                        <p className="text-2xl font-bold text-white">{highCount}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-4 opacity-75">
                    <div className="p-3 bg-slate-700 text-slate-400 rounded-lg">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Has Active PO (grayed)</p>
                        <p className="text-2xl font-bold text-white">{activePOCount}</p>
                    </div>
                </div>
            </div>

            {/* BULK ACTION BAR */}
            {displayRecs.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={selectedIds.size > 0 && selectedIds.size === displayRecs.filter(r => r.hasVendor).length}
                            onChange={toggleSelectAll}
                            className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
                        />
                        <span className="text-slate-300 font-medium">Select All ({displayRecs.length})</span>
                    </label>

                    {selectedIds.size > 0 && (
                        <button
                            onClick={() => setActiveModal('BULK')}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Generate POs for Selected ({selectedIds.size})
                        </button>
                    )}
                </div>
            )}

            {/* RECOMMENDATION CARDS */}
            {isLoading && localRecs.length === 0 ? (
                <div className="py-20 text-center text-slate-400">Loading AI mathematics...</div>
            ) : displayRecs.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-16 text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-medium text-white mb-2">✅ All products are well stocked!</h3>
                    <p className="text-slate-400">No recommendations at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {displayRecs.map((rec) => {
                        const isSelected = selectedIds.has(rec.productId);
                        const estCost = rec.editQty * rec.unitPrice;

                        return (
                            <div key={rec.productId}
                                className={`bg-slate-800 rounded-xl border-l-[6px] border ${getBorderColor(rec)} p-5 flex flex-col transition-all ${isSelected ? 'ring-2 ring-indigo-500 border-r border-y-indigo-500/50' : 'border-y border-r border-slate-700/50'} ${rec.hasActivePO ? 'opacity-60 grayscale-[30%]' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <input
                                            type="checkbox"
                                            disabled={!rec.hasVendor}
                                            checked={isSelected}
                                            onChange={() => toggleSelect(rec.productId)}
                                            className={`w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900 shrink-0 ${!rec.hasVendor ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        />

                                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 shrink-0 overflow-hidden">
                                            {rec.imageUrl ? (
                                                <img src={rec.imageUrl} alt={rec.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-500" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-white truncate pr-2">{rec.productName}</h3>
                                            <p className="text-sm text-slate-400 truncate">SKU: {rec.sku}</p>
                                            <p className="text-sm text-indigo-400 truncate">Vendor: {rec.vendorName}</p>
                                        </div>

                                        <div className="text-right shrink-0 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                                            <span className={`text-xs font-bold ${rec.urgencyScore >= 75 ? 'text-rose-500' : 'text-amber-500'}`}>URGENT</span>
                                            <div className="text-xl font-black text-white">{rec.urgencyScore}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 rounded-lg p-4 grid grid-cols-3 gap-4 mb-4 border border-slate-800">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">📦 Current</p>
                                        <p className="text-lg font-semibold text-slate-200">{rec.currentStock} units</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">📉 Risk</p>
                                        <p className="text-lg font-semibold text-slate-200">{rec.stockoutRisk}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">⏱️ Stockout in</p>
                                        <p className="text-lg font-semibold text-rose-400">{rec.daysUntilStockout.toFixed(1)} days</p>
                                    </div>
                                </div>

                                <div className="bg-indigo-900/20 text-indigo-300 border border-indigo-500/20 rounded-lg p-3 text-sm mb-5 flex items-start gap-3">
                                    <div className="mt-0.5">💡</div>
                                    <p className="italic leading-relaxed">"{rec.reason}"</p>
                                </div>

                                {rec.hasActivePO ? (
                                    <div className="mt-auto border-t border-slate-700 pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-md text-sm font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Active PO: {rec.activePONumber} ({rec.activePOStatus})
                                        </div>
                                        <button onClick={() => handleSkip(rec.productId)} className="text-slate-500 hover:text-white text-sm">Hide</button>
                                    </div>
                                ) : (
                                    <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-700 pt-4">
                                        <div className="flex items-center justify-between w-full sm:w-auto bg-slate-900 rounded-lg p-1 border border-slate-700">
                                            <button
                                                onClick={() => handleQtyChange(rec.productId, rec.editQty - 1)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <div className="w-16 text-center text-white font-medium">
                                                {rec.editQty}
                                            </div>
                                            <button
                                                onClick={() => handleQtyChange(rec.productId, rec.editQty + 1)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-right w-full sm:w-auto">
                                            <p className="text-xs text-slate-500">Est. Cost</p>
                                            <p className="text-base font-bold text-emerald-400">${estCost.toFixed(2)}</p>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <button
                                                onClick={() => handleSkip(rec.productId)}
                                                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-600"
                                                title="Skip for now"
                                            >
                                                <SkipForward className="w-5 h-5" />
                                            </button>
                                            <Link
                                                to={`/products/${rec.productId}?tab=forecast`}
                                                className="p-2 text-cyan-400 hover:bg-cyan-900/40 rounded-lg transition-colors border border-transparent hover:border-cyan-800"
                                                title="View Engine Math"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => openSingleModal(rec)}
                                                disabled={isCreatingPO || !rec.hasVendor}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border shadow-lg ${!rec.hasVendor ? 'bg-slate-700 border-slate-600 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/20'}`}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Create PO
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MULTI-MODAL LOGIC */}
            {activeModal === 'SINGLE' && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                Generate PO: {currentRec?.productName}
                            </h2>
                            <button onClick={closeModals} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitSinglePO} className="p-6 space-y-4">
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-slate-400">Order Quantity</p>
                                    <p className="text-xl font-bold text-white">{currentRec?.editQty} units</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400">Total Estimate</p>
                                    <p className="text-xl font-bold text-emerald-400">${(currentRec?.editQty * currentRec?.unitPrice).toFixed(2)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Expected Delivery Date (Request) *</label>
                                <input
                                    type="date"
                                    required
                                    value={modalData.expectedDeliveryDate}
                                    onChange={(e) => setModalData({ ...modalData, expectedDeliveryDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Internal Note / Vendor Instruction</label>
                                <textarea
                                    rows="3"
                                    value={modalData.internalNote}
                                    onChange={(e) => setModalData({ ...modalData, internalNote: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-700 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingPO}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors border border-indigo-500 flex items-center gap-2 disabled:opacity-70"
                                >
                                    {isCreatingPO ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                                    ) : (
                                        <><ShoppingCart className="w-4 h-4" /> Finalize PO</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BulkPOModal
                isOpen={activeModal === 'BULK'}
                onClose={closeModals}
                initialItems={displayRecs.filter(r => selectedIds.has(r.productId))}
                onSuccess={(results) => {
                    results.forEach(res => {
                        if (res.status === 'SUCCESS') handleSkip(res.id);
                    });
                    setSelectedIds(new Set());
                }}
            />
        </div>
    );
};

export default RestockRecommendationsPage;
