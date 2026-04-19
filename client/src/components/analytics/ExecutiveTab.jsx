import React from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar, FunnelChart, Funnel, LabelList } from 'recharts';
import { Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

const COLORS = {
    IN_STOCK: '#10B981', // green
    LOW_STOCK: '#F59E0B', // amber
    OUT_OF_STOCK: '#EF4444', // red
    OVERSTOCKED: '#3B82F6' // blue
};

const SkeletonCard = () => (
    <div className="bg-surface border border-white/5 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-white/10 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-1/4"></div>
    </div>
);

const ExecutiveTab = () => {
    const { executiveSummary, transactionReport, isLoading, error, fetchExecutiveSummary } = useAnalytics();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-slate-400 bg-surface rounded-xl border border-white/5">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <p>Failed to load executive summary data.</p>
                <button onClick={fetchExecutiveSummary} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90">Retry</button>
            </div>
        );
    }

    if (isLoading.executive || isLoading.transactions || !executiveSummary || !transactionReport) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 h-80 bg-surface rounded-xl border border-white/5 animate-pulse"></div>
                    <div className="lg:col-span-2 h-80 bg-surface rounded-xl border border-white/5 animate-pulse"></div>
                </div>
            </div>
        );
    }

    const { inventory, po, alerts, forecast } = executiveSummary;
    const poData = executiveSummary.purchaseOrders;

    const stockHealthData = [
        { name: 'Healthy', value: inventory.healthyStockCount, color: COLORS.IN_STOCK },
        { name: 'Low Stock', value: inventory.lowStockCount, color: COLORS.LOW_STOCK },
        { name: 'Out of Stock', value: inventory.outOfStockCount, color: COLORS.OUT_OF_STOCK },
        { name: 'Overstocked', value: inventory.overstockedCount, color: COLORS.OVERSTOCKED }
    ].filter(d => d.value > 0);

    const funnelData = [
        { name: 'Pending', value: poData.pendingCount, fill: '#64748B' },
        { name: 'Approved', value: poData.approvedCount, fill: '#3B82F6' },
        { name: 'Received', value: poData.receivedCount, fill: '#10B981' }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ROW 1: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-400 uppercase">Total Stock</p>
                        <div className="p-2 bg-indigo-500/10 rounded-lg"><Package size={18} className="text-indigo-400" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{inventory.totalProducts} <span className="text-sm font-normal text-slate-400">products</span></h3>
                    <p className="text-xs text-indigo-400 mt-2 font-medium">Tracking {inventory.healthyStockCount} healthy items</p>
                </div>
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-400 uppercase">Stock Value</p>
                        <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign size={18} className="text-emerald-400" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">₹{inventory.totalStockValue.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Invested capital</p>
                </div>
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-400 uppercase">Retail Value</p>
                        <div className="p-2 bg-sky-500/10 rounded-lg"><TrendingUp size={18} className="text-sky-400" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">₹{inventory.totalRetailValue.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Expected revenue</p>
                </div>
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-400 uppercase">Est. Profit</p>
                        <div className="p-2 bg-amber-500/10 rounded-lg"><DollarSign size={18} className="text-amber-400" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">₹{inventory.potentialProfit.toLocaleString()}</h3>
                    <p className="text-xs text-emerald-400 mt-2 font-medium">
                        ● {inventory.totalRetailValue > 0 ? ((inventory.potentialProfit / inventory.totalRetailValue) * 100).toFixed(1) : 0}% margin
                    </p>
                </div>
            </div>

            {/* ROW 2: Stock Health & Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-surface border border-white/10 rounded-xl p-5 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Stock Health</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stockHealthData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stockHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
                                    itemStyle={{ color: '#F8FAFC' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-surface border border-white/10 rounded-xl p-5 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Stock Movement</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={transactionReport.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="totalIn" name="Stock In" stroke="#10B981" fillOpacity={1} fill="url(#colorIn)" />
                                <Area type="monotone" dataKey="totalOut" name="Stock Out" stroke="#EF4444" fillOpacity={1} fill="url(#colorOut)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ROW 3: POs & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Purchase Order Pipeline</h3>
                    <div className="h-48 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155' }} />
                                <Funnel
                                    dataKey="value"
                                    data={funnelData}
                                    isAnimationActive
                                >
                                    <LabelList position="right" fill="#F8FAFC" stroke="none" dataKey="name" />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-surface border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Alert Activity</h3>
                    <div className="grid grid-cols-2 gap-4 h-48">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex flex-col justify-center items-center text-center">
                            <h4 className="text-red-400 text-sm font-bold mb-1">Critical</h4>
                            <span className="text-3xl font-bold text-white">{alerts.criticalCount}</span>
                        </div>
                        <div className="bg-slate-800 border border-white/5 rounded-lg p-4 flex flex-col justify-center items-center text-center">
                            <h4 className="text-slate-400 text-sm font-bold mb-1">Unresolved</h4>
                            <span className="text-3xl font-bold text-white">{alerts.unresolvedCount}</span>
                        </div>
                        <div className="bg-slate-800 border border-white/5 rounded-lg p-4 flex flex-col justify-center items-center text-center">
                            <h4 className="text-slate-400 text-sm font-bold mb-1">Resolved</h4>
                            <span className="text-3xl font-bold text-white">{alerts.resolvedCount}</span>
                        </div>
                        <div className="bg-slate-800 border border-white/5 rounded-lg p-4 flex flex-col justify-center items-center text-center">
                            <h4 className="text-slate-400 text-sm font-bold mb-1">Total</h4>
                            <span className="text-3xl font-bold text-white">{alerts.totalAlerts}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 4: Forecast Summary */}
            <div className="bg-surface border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-200">AI Forecast Overview</h3>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20">
                        {forecast.productsForecasted} Formulations Tracked
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0F172A] p-4 rounded-lg flex flex-col text-center justify-center">
                         <span className="text-3xl font-bold text-red-400 mb-1">{forecast.criticalRiskCount}</span>
                         <span className="text-sm font-medium text-slate-400">Critical Stockout Risks</span>
                    </div>
                    <div className="bg-[#0F172A] p-4 rounded-lg flex flex-col text-center justify-center">
                         <span className="text-3xl font-bold text-amber-400 mb-1">{forecast.highRiskCount}</span>
                         <span className="text-sm font-medium text-slate-400">High Stockout Risks</span>
                    </div>
                    <div className="bg-[#0F172A] p-4 rounded-lg flex flex-col text-center justify-center">
                         <span className="text-3xl font-bold text-emerald-400 mb-1">{(forecast.avgConfidenceScore * 100).toFixed(0)}%</span>
                         <span className="text-sm font-medium text-slate-400">AI Average Confidence</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveTab;
