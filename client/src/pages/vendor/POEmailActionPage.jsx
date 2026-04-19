import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Truck } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

const POEmailActionPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');
    const isApprove = location.pathname.includes('/approve');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [po, setPo] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form States
    const [expectedDate, setExpectedDate] = useState('');
    const [vendorNote, setVendorNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing secure token. Please return to your email and click the link again.');
            setIsLoading(false);
            return;
        }

        const fetchDetails = async () => {
            try {
                const data = await purchaseOrderService.getPOById(id, token);
                setPo(data);

                if (data.status !== 'PENDING') {
                    setError(`This PO has already been ${data.status.toLowerCase()}.`);
                } else {
                    // Pre-calculate natural shipping offset if they want to approve
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + 3); // 3 day lead default
                    setExpectedDate(data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString().split('T')[0] : defaultDate.toISOString().split('T')[0]);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to authenticate this request. The token may have expired.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id, token]);

    const handleApprove = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await purchaseOrderService.approvePO(id, { expectedDeliveryDate: expectedDate, vendorNote }, token);
            setSuccessMsg('✅ Order Approved! The Manager has been notified and expects delivery.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve PO. Ensure the date is valid and token is active.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await purchaseOrderService.rejectPO(id, { rejectionReason }, token);
            setSuccessMsg('PO Rejected. The Manager has been notified with your reason.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject PO.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Loader fullScreen text="Verifying Secure Token..." />;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface border border-white/5 shadow-2xl rounded-2xl overflow-hidden relative">

                {/* Visual Header */}
                <div className={`h-2 w-full ${isApprove ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                <div className="p-8">

                    {/* Header Block */}
                    <div className="text-center mb-8">
                        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isApprove ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {isApprove ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isApprove ? 'Approve Purchase Order' : 'Reject Purchase Order'}
                        </h1>
                        <p className="text-slate-400">
                            {po?.poNumber || 'Loading securely...'}
                        </p>
                    </div>

                    {/* Content Router */}
                    {error ? (
                        <div className="text-center space-y-6">
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6">
                                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                                <p className="text-rose-400 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 mx-auto justify-center transition-colors"
                            >
                                Login to Vendor Portal <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : successMsg ? (
                        <div className="text-center space-y-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                <p className="text-emerald-400 font-medium leading-relaxed">{successMsg}</p>
                            </div>
                            <button
                                onClick={() => navigate('/vendor-portal')}
                                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-colors font-medium"
                            >
                                Go to Vendor Portal
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={isApprove ? handleApprove : handleReject} className="space-y-6">

                            {/* Intelligent Summary Block */}
                            {po && (
                                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm mb-6">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Order Ledger Summary</h3>
                                    <div className="grid grid-cols-2 gap-y-3">
                                        <div className="text-slate-400">Product:</div>
                                        <div className="text-white font-medium text-right">{po.productId?.name}</div>
                                        <div className="text-slate-400">Req. Quantity:</div>
                                        <div className="text-white font-medium text-right">{po.quantity}</div>
                                        <div className="text-slate-400 pt-2 border-t border-slate-700/50">Total Amount:</div>
                                        <div className="text-emerald-400 font-bold text-right pt-2 border-t border-slate-700/50">${po.totalAmount?.toFixed(2)}</div>
                                    </div>
                                </div>
                            )}

                            {isApprove ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-indigo-400" /> Promised Delivery Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={expectedDate}
                                            onChange={(e) => setExpectedDate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-2">When can you realistically land this payload at our facility?</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Notice to Facility Manager (Optional)</label>
                                        <textarea
                                            rows="2"
                                            placeholder="e.g., Shipping via air freight instead of ground..."
                                            value={vendorNote}
                                            onChange={(e) => setVendorNote(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 font-bold tracking-wide transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Confirming...' : 'Accept & Approve Order'} <CheckCircle className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-rose-400" /> Reason for Rejection *
                                        </label>
                                        <textarea
                                            required
                                            rows="3"
                                            placeholder="Explain why this PO cannot be fulfilled... (Item discontinued, out of stock, price mismatch?)"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !rejectionReason.trim()}
                                        className="w-full px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 font-bold tracking-wide transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Rejecting...' : 'Submit Rejection'} <XCircle className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default POEmailActionPage;
