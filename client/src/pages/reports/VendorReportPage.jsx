import React from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, DollarSign, Clock, XCircle, Bot, User, Star } from 'lucide-react';
import DateRangePicker from '../../components/charts/DateRangePicker';
import ExportButton from '../../components/charts/ExportButton';
import KPICard from '../../components/charts/KPICard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, FunnelChart, Funnel, LabelList } from 'recharts';

const VendorReportPage = () => {
    const { user } = useAuth();
    const { 
        dateRange, 
        setDateRange, 
        exportReport, 
        poReport,
        isLoading
    } = useAnalytics();

    if (isLoading.po || !poReport) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#020617] flex justify-center items-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400">Loading Vendor Report...</p>
                </div>
            </div>
        );
    }

    const { timeline, vendorPerformance, statusFunnel, aiVsManual } = poReport;

    const totalPOs = aiVsManual.aiSuggestedCount + aiVsManual.manualCount;
    const totalSpend = aiVsManual.aiSuggestedValue + aiVsManual.manualValue;
    const avgDeliveryDays = totalPOs > 0 
        ? vendorPerformance.reduce((acc, v) => acc + (v.avgDeliveryDays * v.totalPOs), 0) / totalPOs 
        : 0;

    const rejectedCount = statusFunnel.find(s => s.status === 'REJECTED')?.count || 0;
    const rejectionRate = totalPOs > 0 ? (rejectedCount / totalPOs) * 100 : 0;
    const aiSuggestedPct = totalPOs > 0 ? (aiVsManual.aiSuggestedCount / totalPOs) * 100 : 0;

    const funnelSteps = ['PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED'];
    const sortedFunnel = statusFunnel
        .filter(s => funnelSteps.includes(s.status))
        .sort((a,b) => funnelSteps.indexOf(a.status) - funnelSteps.indexOf(b.status))
        .map(s => ({
            name: s.status,
            value: s.count,
            fill: s.status === 'RECEIVED' ? '#10B981' : s.status === 'APPROVED' ? '#3B82F6' : '#64748B'
        }));

    const cancelledOrders = statusFunnel.find(s => s.status === 'CANCELLED')?.count || 0;

    const renderStars = (onTime, approval) => {
        const score = (onTime + approval) / 2;
        const total = Math.round(score / 20); // 1-5
        return (
            <div className="flex text-yellow-400 pt-1">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < total ? "currentColor" : "none"} strokeOpacity={i < total ? 0 : 1} stroke="currentColor" />
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-[#020617] animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link to="/analytics" className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                            Vendor & Purchase Order Report
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Generated: {new Date().toLocaleString()} by {user?.name || 'Admin'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <DateRangePicker 
                        value={dateRange} 
                        onChange={(range) => setDateRange(range.startDate, range.endDate)} 
                    />
                    <ExportButton 
                        onExcelExport={() => exportReport('purchase-orders', 'excel')}
                        onPDFExport={() => exportReport('purchase-orders', 'pdf')}
                        isLoading={isLoading.export}
                    />
                </div>
            </div>

            {/* SECTION 1: PO Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <KPICard 
                    title="Total POs" 
                    value={totalPOs.toLocaleString()} 
                    icon={ShoppingCart} 
                    color="#6366F1" 
                />
                <KPICard 
                    title="Total Spend" 
                    value={`₹${totalSpend.toLocaleString()}`} 
                    icon={DollarSign} 
                    color="#22C55E" 
                />
                <KPICard 
                    title="Avg Delivery Days" 
                    value={`${avgDeliveryDays.toFixed(1)}d`} 
                    icon={Clock} 
                    color="#0EA5E9" 
                />
                <KPICard 
                    title="Rejection Rate" 
                    value={`${rejectionRate.toFixed(1)}%`} 
                    icon={XCircle} 
                    color="#EF4444" 
                />
                <KPICard 
                    title="AI Suggested %" 
                    value={`${aiSuggestedPct.toFixed(1)}%`} 
                    icon={Bot} 
                    color="#8B5CF6" 
                />
            </div>

            {/* SECTION 2: AI Impact Card */}
            <div className="bg-gradient-to-r from-indigo-900/80 to-slate-900 border border-indigo-500/30 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pt-4 pr-4"><Bot size={150} /></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20"><Bot size={24} className="text-white" /></div>
                    <h3 className="text-2xl font-bold text-indigo-100">AI Restock Impact</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 w-full xl:w-4/5 pt-2 border-t border-indigo-500/20 mt-4">
                    <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">Total PO Volume</p>
                        <p className="font-bold text-white flex items-end gap-2">
                            <span className="text-2xl">AI: {aiVsManual.aiSuggestedCount}</span>
                            <span className="text-sm text-slate-400 pb-1">vs Manual: {aiVsManual.manualCount}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">Vendor Approval Rate</p>
                        <p className="font-bold text-white flex items-end gap-2">
                            <span className="text-2xl text-emerald-400">AI: {aiVsManual.aiApprovalRate.toFixed(0)}%</span>
                            <span className="text-sm text-slate-400 pb-1">vs Manual: {aiVsManual.manualApprovalRate.toFixed(0)}%</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">Capital Investment</p>
                        <p className="font-bold text-white flex items-end gap-2">
                            <span className="text-xl">₹{aiVsManual.aiSuggestedValue.toLocaleString()}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-300 mb-2">Est. Savings</p>
                        <p className="font-bold text-white flex items-end gap-2">
                            <span className="text-2xl text-amber-400">₹{(aiVsManual.aiSavingsEstimate || 0).toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 3 & 4: Vendor Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Vendor Scorecards */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white">Vendor Performance Scorecards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendorPerformance.map((v) => (
                            <div key={v.vendorId} className="bg-[#1E293B] border border-white/10 rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded-full">
                                            <User size={20} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-200">{v.vendorName}</h4>
                                            <p className="text-xs text-slate-500">ID: {v.vendorId}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {renderStars(v.onTimeRate, v.approvalRate)}
                                    </div>
                                </div>
                                
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">POs Issued</span>
                                        <span className="font-bold text-slate-200">{v.totalPOs} <span className="text-emerald-400 text-xs ml-1">(₹{v.totalValue.toLocaleString()})</span></span>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Approval Rate ({v.approvalRate.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${v.approvalRate}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">On-Time Rate ({v.onTimeRate.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${v.onTimeRate}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                                        <span className="text-slate-400">Avg Delivery</span>
                                        <span className="font-bold text-slate-300">{v.avgDeliveryDays > 0 ? v.avgDeliveryDays.toFixed(1) : '-'} days</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {vendorPerformance.length === 0 && (
                        <div className="p-10 text-center text-slate-500 bg-[#1E293B] rounded-xl border border-white/5">
                            No vendor data available for the selected period.
                        </div>
                    )}
                </div>

                {/* Radar Chart & Funnel */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Radar Chart */}
                    <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 h-[400px]">
                        <h3 className="text-lg font-bold text-slate-200 mb-2">Vendor Comparison</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <RadarChart data={vendorPerformance.slice(0, 5)}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="vendorName" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748B' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} />
                                <Radar name="Approval Rate" dataKey="approvalRate" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.4} />
                                <Radar name="On-Time Rate" dataKey="onTimeRate" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                                <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '12px' }}/>
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Status Funnel */}
                    <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 h-[400px]">
                        <h3 className="text-lg font-bold text-slate-200 mb-2">PO Status Conversion</h3>
                        <div className="h-48 flex items-center justify-center mt-4">
                            {sortedFunnel.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <FunnelChart>
                                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC' }} />
                                        <Funnel
                                            dataKey="value"
                                            data={sortedFunnel}
                                            isAnimationActive
                                        >
                                            <LabelList position="right" fill="#F8FAFC" stroke="none" dataKey="name" fontSize={11} />
                                        </Funnel>
                                    </FunnelChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-slate-500 text-sm">No funnel data available.</p>
                            )}
                        </div>
                        {(rejectedCount > 0 || cancelledOrders > 0) && (
                            <div className="mt-8 pt-4 border-t border-white/5 flex gap-4">
                                <div className="flex-1 bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
                                    <p className="text-xs font-medium text-red-500 uppercase mb-1">Rejected</p>
                                    <p className="text-xl font-bold text-red-400">{rejectedCount}</p>
                                </div>
                                <div className="flex-1 bg-amber-500/10 rounded-lg p-3 text-center border border-amber-500/20">
                                    <p className="text-xs font-medium text-amber-500 uppercase mb-1">Cancelled</p>
                                    <p className="text-xl font-bold text-amber-400">{cancelledOrders}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 6: Monthly PO vs Spend Table */}
            <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-6">Execution Ledger</h3>
                <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Period</th>
                                <th className="px-4 py-3 text-right">PO Count</th>
                                <th className="px-4 py-3 text-right">Total Invested</th>
                                <th className="px-4 py-3 text-right">Received Val</th>
                                <th className="px-4 py-3 text-right">Rejected</th>
                                <th className="px-4 py-3 text-right">Pending Val</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {timeline.map((period, idx) => {
                                const isCurrent = idx === timeline.length - 1;
                                return (
                                    <tr key={idx} className={`${isCurrent ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-white/5'} text-slate-300`}>
                                        <td className="px-4 py-3 font-bold flex items-center gap-2">
                                            {isCurrent && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                                            {period.period}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{period.poCount}</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-400">₹{period.totalValue?.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 text-right">₹{period.receivedValue?.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 text-right text-red-400 font-bold">{period.rejectedCount || 0}</td>
                                        <td className="px-4 py-3 text-right text-amber-400">₹{period.pendingValue?.toLocaleString() || 0}</td>
                                    </tr>
                                );
                            })}
                            {timeline.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No execution data within this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorReportPage;
