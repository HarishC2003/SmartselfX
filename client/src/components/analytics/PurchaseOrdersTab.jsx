import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AlertCircle, Bot, User, Star } from 'lucide-react';

const SkeletonCard = ({ h = "h-64" }) => (
    <div className={`bg-surface border border-white/5 rounded-xl p-5 animate-pulse ${h}`}></div>
);

const PurchaseOrdersTab = () => {
    const { poReport, isLoading, error, fetchPOReport } = useAnalytics();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-slate-400 bg-surface rounded-xl border border-white/5">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p>Failed to load purchase order data.</p>
                <button onClick={fetchPOReport} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90">Retry</button>
            </div>
        );
    }

    if (isLoading.po || !poReport) {
        return (
            <div className="space-y-6">
                <SkeletonCard h="h-80" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard h="h-48" /><SkeletonCard h="h-48" />
                </div>
                <SkeletonCard h="h-96" />
            </div>
        );
    }

    const { timeline, vendorPerformance, statusFunnel, aiVsManual } = poReport;
    
    // Sort funnel correctly
    const funnelSteps = ['PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED'];
    const sortedFunnel = statusFunnel
        .filter(s => funnelSteps.includes(s.status))
        .sort((a,b) => funnelSteps.indexOf(a.status) - funnelSteps.indexOf(b.status))
        .map(s => ({
            name: s.status,
            value: s.count,
            fill: s.status === 'RECEIVED' ? '#10B981' : s.status === 'APPROVED' ? '#3B82F6' : '#64748B'
        }));

    const lostOrders = statusFunnel.find(s => s.status === 'REJECTED')?.count || 0;
    const cancelledOrders = statusFunnel.find(s => s.status === 'CANCELLED')?.count || 0;

    const renderStars = (onTime, approval) => {
        const score = (onTime + approval) / 2;
        const total = Math.round(score / 20); // 1-5
        
        return (
            <div className="flex text-yellow-400 text-xs">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < total ? "currentColor" : "none"} strokeOpacity={i < total ? 0 : 1} stroke="currentColor" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ROW 1: PO Timeline */}
            <div className="bg-surface border border-white/10 rounded-xl p-5 h-[400px]">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center justify-between">
                    PO Value & Volume History
                </h3>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => '$'+v} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="totalValue" name="PO Value ($)" fill="url(#colorVal)" stroke="#6366F1" strokeWidth={2} />
                        <Area yAxisId="right" type="monotone" dataKey="poCount" name="PO Count" fill="url(#colorCount)" stroke="#38BDF8" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* ROW 2: AI vs Manual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10"><Bot size={120} /></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20"><Bot size={20} className="text-white" /></div>
                        <h3 className="text-xl font-bold text-indigo-100">AI Suggested POs</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                            <p className="text-xs font-medium text-indigo-300 uppercase mb-1">Total Volume</p>
                            <p className="text-2xl font-bold text-white">{aiVsManual.aiSuggestedCount} <span className="text-sm font-normal text-indigo-300 ml-1">orders</span></p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-indigo-300 uppercase mb-1">Capital Investment</p>
                            <p className="text-2xl font-bold text-emerald-400">₹{aiVsManual.aiSuggestedValue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-indigo-300 uppercase mb-1">Vendor Approval</p>
                            <p className="text-2xl font-bold text-white">{aiVsManual.aiApprovalRate.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-indigo-300 uppercase mb-1">Est. Savings</p>
                            <p className="text-xl font-bold text-indigo-200">₹{(aiVsManual.aiSavingsEstimate || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5"><User size={120} /></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-slate-700 rounded-lg"><User size={20} className="text-slate-300" /></div>
                        <h3 className="text-xl font-bold text-slate-200">Manual Procurement</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Total Volume</p>
                            <p className="text-2xl font-bold text-white">{aiVsManual.manualCount} <span className="text-sm font-normal text-slate-500 ml-1">orders</span></p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Capital Investment</p>
                            <p className="text-2xl font-bold text-white">₹{aiVsManual.manualValue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Vendor Approval</p>
                            <p className="text-2xl font-bold text-white">{aiVsManual.manualApprovalRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3 & 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vendor Performance */}
                <div className="lg:col-span-2 bg-surface border border-white/10 rounded-xl p-5 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center justify-between">
                        Top Vendor Performance
                    </h3>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Vendor</th>
                                    <th className="px-4 py-3 text-right">Value</th>
                                    <th className="px-4 py-3 text-right">Approval %</th>
                                    <th className="px-4 py-3 text-right">On-Time %</th>
                                    <th className="px-4 py-3 text-right">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {vendorPerformance.slice(0,10).map((v, i) => (
                                    <tr key={v.vendorId} className="hover:bg-white/5 text-slate-300">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-200">{v.vendorName}</div>
                                            <div className="text-xs text-slate-500 font-medium">{v.totalPOs} Orders • {v.avgDeliveryDays > 0 ? v.avgDeliveryDays.toFixed(1) : 0}d avg delivery</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">₹{v.totalValue.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">{v.approvalRate.toFixed(1)}%</td>
                                        <td className={`px-4 py-3 text-right font-bold ${v.onTimeRate >= 90 ? 'text-emerald-400' : v.onTimeRate < 70 ? 'text-red-400' : 'text-amber-400'}`}>
                                            {v.onTimeRate.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end">
                                            {renderStars(v.onTimeRate, v.approvalRate)}
                                        </td>
                                    </tr>
                                ))}
                                {vendorPerformance.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No vendor data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status Funnel */}
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                        Conversion Funnel
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        {sortedFunnel.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }} />
                                    <Funnel
                                        dataKey="value"
                                        data={sortedFunnel}
                                        isAnimationActive
                                    >
                                        <LabelList position="right" fill="#F8FAFC" stroke="none" dataKey="name" fontSize={12} />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500 text-sm">No funnel data available.</p>
                        )}
                    </div>
                    {(lostOrders > 0 || cancelledOrders > 0) && (
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                            <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
                                <p className="text-xs font-medium text-red-400 uppercase mb-1">Rejected</p>
                                <p className="text-xl font-bold text-red-300">{lostOrders}</p>
                            </div>
                            <div className="bg-amber-500/10 rounded-lg p-3 text-center border border-amber-500/20">
                                <p className="text-xs font-medium text-amber-500 uppercase mb-1">Cancelled</p>
                                <p className="text-xl font-bold text-amber-400">{cancelledOrders}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrdersTab;
