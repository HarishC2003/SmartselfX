import React, { useState, useEffect } from 'react';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import {
    X, ShoppingCart, Package, Building, User, Trash2,
    ArrowRight, ArrowLeft, CheckCircle, Loader2, AlertTriangle, PlayCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BulkPOModal = ({ isOpen, onClose, initialItems = [], onSuccess }) => {
    const { createPO } = usePurchaseOrders();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [items, setItems] = useState([]);
    const [globalNote, setGlobalNote] = useState('');
    const [globalDeliveryDate, setGlobalDeliveryDate] = useState('');

    // Processing state
    const [processingResults, setProcessingResults] = useState([]); // array of { id, status: 'PENDING'|'SUCCESS'|'ERROR', poNumber, productName, vendorName, error }
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setGlobalNote('');

            // Set default delivery date (+5 days)
            const d = new Date();
            d.setDate(d.getDate() + 5);
            setGlobalDeliveryDate(d.toISOString().split('T')[0]);

            // Map initial items
            setItems(initialItems.map(item => ({
                id: item.productId,
                productName: item.productName,
                vendorId: item.vendorId,
                vendorName: item.vendorName || item.company,
                unitPrice: item.unitPrice || 0,
                qty: item.suggestedQty || item.editQty || 1,
                forecastDataId: item.forecastDataId
            })));
            setProcessingResults([]);
        }
    }, [isOpen, initialItems]);

    // Derived Data
    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const uniqueVendors = [...new Set(items.map(i => i.vendorId))];

    // Group items by vendor for Step 2
    const vendorGroups = items.reduce((acc, item) => {
        if (!acc[item.vendorId]) {
            acc[item.vendorId] = { vendorName: item.vendorName, items: [] };
        }
        acc[item.vendorId].items.push(item);
        return acc;
    }, {});

    const handleQtyChange = (id, newQty) => {
        if (newQty < 1) newQty = 1;
        setItems(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
    };

    const handleRemove = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
        if (items.length <= 1) onClose(); // close if all removed
    };

    const handleProcessAll = async () => {
        if (!globalDeliveryDate) {
            return toast.error("Please provide a global Expected Delivery Date");
        }

        setStep(3);
        setIsProcessing(true);

        const results = items.map(item => ({
            id: item.id,
            productName: item.productName,
            vendorName: item.vendorName,
            status: 'PENDING',
            poNumber: null,
            error: null
        }));

        setProcessingResults(results);

        // Process sequentially to prevent document unique PO increment collisions
        const finalResults = [...results];

        for (let i = 0; i < items.length; i++) {
            const currentItem = items[i];

            try {
                // Wait briefly between calls if needed, backend hooks should handle it synchronously per request
                const res = await createPO({
                    productId: currentItem.id,
                    quantity: currentItem.qty,
                    expectedDeliveryDate: globalDeliveryDate,
                    internalNote: globalNote,
                    suggestedByAI: !!currentItem.forecastDataId,
                    forecastDataId: currentItem.forecastDataId,
                    status: 'PENDING'
                });

                finalResults[i] = {
                    ...finalResults[i],
                    status: 'SUCCESS',
                    poNumber: res.po.poNumber
                };
            } catch (err) {
                finalResults[i] = {
                    ...finalResults[i],
                    status: 'ERROR',
                    error: err.response?.data?.message || 'Failed to generate'
                };
            }

            // Update UI after each iteration
            setProcessingResults([...finalResults]);
        }

        setIsProcessing(false);
        setStep(4);
        if (onSuccess) onSuccess(finalResults);
    };

    const handleClose = () => {
        if (isProcessing) return; // prevent closing during API calls
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col">

                {/* Modal Header */}
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Package className="w-5 h-5 text-indigo-400" />
                        Bulk Create Purchase Orders
                    </h2>
                    {!isProcessing && (
                        <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Stepper Logic */}
                <div className="flex bg-slate-900 border-b border-slate-700 p-4 shrink-0 overflow-x-auto justify-center md:items-center">
                    <div className="flex items-center min-w-[500px] justify-center text-sm font-medium">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-current bg-slate-900">1</div> Review
                        </div>
                        <div className={`w-8 h-px mx-2 ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-current bg-slate-900">2</div> Configure
                        </div>
                        <div className={`w-8 h-px mx-2 ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-current bg-slate-900">3</div> Processing
                        </div>
                        <div className={`w-8 h-px mx-2 ${step >= 4 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-current bg-slate-900">4</div> Done
                        </div>
                    </div>
                </div>

                {/* MODAL CONTENT BODY */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar max-h-[60vh]">

                    {/* STEP 1: REVIEW */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Review Selected AI Recommendations</h3>
                                    <p className="text-indigo-300 text-sm">Creating {items.length} POs across {uniqueVendors.length} vendors</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Estimated Value</p>
                                    <p className="text-2xl font-black text-emerald-400">${totalAmount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                                <table className="w-full text-left bg-slate-800/50">
                                    <thead className="bg-slate-900 border-b border-slate-700 text-xs uppercase text-slate-400 font-bold">
                                        <tr>
                                            <th className="p-3">Product</th>
                                            <th className="p-3">Vendor</th>
                                            <th className="p-3">Unit Price</th>
                                            <th className="p-3 w-32">Suggest Qty</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                            <th className="p-3 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700 text-sm">
                                        {items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-800">
                                                <td className="p-3 font-medium text-white max-w-[200px] truncate" title={item.productName}>{item.productName}</td>
                                                <td className="p-3 text-slate-300">{item.vendorName}</td>
                                                <td className="p-3 text-slate-400">${item.unitPrice.toFixed(2)}</td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.qty}
                                                        onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                </td>
                                                <td className="p-3 text-right text-emerald-400 font-medium">
                                                    ${(item.unitPrice * item.qty).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleRemove(item.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-slate-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONFIGURE */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-white mb-4">Confirm Logistics & Vendors</h3>

                            <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl space-y-4 shadow-inner">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Vendors to be Endorsed:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(vendorGroups).map(([vid, group]) => (
                                        <div key={vid} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                            <Building className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-slate-200">{group.vendorName}</p>
                                                <p className="text-xs text-indigo-300">{group.items.length} {group.items.length === 1 ? 'Product' : 'Products'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Global Expected Delivery Date *</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={globalDeliveryDate}
                                        onChange={(e) => setGlobalDeliveryDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">This request date will be globally applied to all {items.length} Purchase Orders.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Global Action Note (Optional)</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Add instructions attached to ALL generated POs..."
                                        value={globalNote}
                                        onChange={(e) => setGlobalNote(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">The system will additionally flag these documents as 'AI Requested' automatically.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PROCESSING */}
                    {step === 3 && (
                        <div className="py-8">
                            <div className="text-center mb-8">
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Deploying Network Contracts</h3>
                                <p className="text-slate-400">Please do not close this window. Executing {items.length} synchronous requests...</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-sm max-h-[300px] overflow-y-auto">
                                {processingResults.map((result, idx) => (
                                    <div key={idx} className={`p-3 border-b border-slate-800 last:border-0 flex items-center gap-3 ${result.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-900/10' :
                                            result.status === 'ERROR' ? 'text-rose-400 bg-rose-900/10' :
                                                'text-slate-400'
                                        }`}>
                                        {result.status === 'PENDING' ? <PlayCircle className="w-4 h-4 text-indigo-400 animate-pulse" /> :
                                            result.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> :
                                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                        }
                                        <div className="flex-1 truncate">
                                            {result.status === 'SUCCESS' && <span className="font-bold mr-2 text-white">{result.poNumber}</span>}
                                            {result.productName} <span className="text-slate-500 opacity-60">→ {result.vendorName}</span>
                                            {result.status === 'ERROR' && <span className="block text-xs text-rose-500 mt-1">Fault: {result.error}</span>}
                                        </div>
                                        <div className="shrink-0 text-xs font-bold uppercase tracking-widest">
                                            {result.status === 'PENDING' ? <span className="text-indigo-400">Creating...</span> : result.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: DONE */}
                    {step === 4 && (
                        <div className="py-8 text-center px-4">
                            <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-white mb-2">Automated Procurement Finalized!</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                                {processingResults.filter(r => r.status === 'SUCCESS').length} out of {items.length} Purchase Orders successfully published to external SMTP gateways.
                            </p>

                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-left max-w-lg mx-auto mb-8 shadow-inner">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between">
                                    <span>Generated Ledger</span>
                                    <span className="text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
                                </h3>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                    {processingResults.filter(r => r.status === 'SUCCESS').map((r, i) => (
                                        <div key={i} className="flex justify-between text-sm font-medium font-mono text-slate-300">
                                            <span>{r.poNumber}</span>
                                            <span className="text-slate-500 truncate max-w-[200px] text-right" title={r.productName}>{r.productName}</span>
                                        </div>
                                    ))}
                                    {processingResults.filter(r => r.status === 'ERROR').map((r, i) => (
                                        <div key={`err-${i}`} className="flex justify-between text-sm font-medium font-mono text-rose-400 border-l-2 border-rose-500 pl-2">
                                            <span>Failed PO</span>
                                            <span className="truncate max-w-[200px] text-right" title={r.error}>{r.error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER CONTROLS */}
                <div className="p-5 border-t border-slate-700 bg-slate-900/90 flex justify-between shrink-0">
                    <div className="w-1/3">
                        {step === 2 && (
                            <button onClick={() => setStep(1)} disabled={isProcessing} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end w-2/3">
                        {step < 3 && (
                            <button onClick={handleClose} className="px-5 py-2.5 text-slate-400 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-700">
                                Cancel
                            </button>
                        )}

                        {step === 1 && (
                            <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-indigo-600/20">
                                Configure <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 2 && (
                            <button onClick={handleProcessAll} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 font-bold transition-colors shadow-lg shadow-indigo-600/30">
                                <ShoppingCart className="w-4 h-4" /> Generate {items.length} POs
                            </button>
                        )}

                        {step === 4 && (
                            <>
                                <button onClick={handleClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-600">
                                    Close Window
                                </button>
                                <button onClick={() => { handleClose(); navigate('/purchase-orders'); }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors shadow-lg">
                                    View PO Dashboard
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BulkPOModal;
