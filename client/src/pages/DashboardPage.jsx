import React, { useState, useEffect } from 'react';
import {
    Package, AlertTriangle, ShoppingCart, Target, Users, Brain,
    ArrowDownToLine, ArrowUpFromLine, FileText, Bell, Store, Check,
    Truck, ArrowRightLeft, TrendingUp, TrendingDown, BarChart3,
    Activity, Clock, Zap, ChevronRight, ArrowUpRight, Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Link, Navigate } from 'react-router-dom';
import { transactionService } from '@/services/transactionService';
import api from '@/services/authService';
import StockInModal from '@/components/transactions/StockInModal';
import StockOutModal from '@/components/transactions/StockOutModal';
import { useForecast } from '@/context/ForecastContext';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import StockMovementChart from '@/components/charts/StockMovementChart';
import ChartCard from '@/components/charts/ChartCard';

/* ──────────────────────────────────────────────
   ADMIN DASHBOARD — Premium Production Design
   ────────────────────────────────────────────── */

const AdminDashboard = () => {
    const { user } = useAuth();
    const { executiveSummary, transactionReport, isLoading: isLoadingAnalytics } = useAnalytics();
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        transactionService.getAllTransactions({ limit: 6 }).then(res => setRecentTransactions(res.transactions || []));
        api.get('/alerts', { params: { limit: 5, isDismissed: false } }).then(res => setRecentAlerts(res.data.alerts || res.data));
        api.get('/users').then(res => setUserCount(res.data?.users?.length || 0)).catch(() => setUserCount(0));
    }, []);

    const inv = executiveSummary?.inventory || {};
    const po = executiveSummary?.purchaseOrders || {};
    const fc = executiveSummary?.forecast || {};
    const alertCount = executiveSummary?.alerts?.unresolvedCount || recentAlerts.length;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="space-y-8">

            {/* ── Hero header with greeting ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f3a] via-[#1e2746] to-[#162033] border border-white/[0.06] p-8">
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }} />
                {/* Accent orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/8 rounded-full blur-2xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-400 tracking-wide uppercase mb-1">{greeting},</p>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{user?.name || 'Admin'}</h1>
                        <p className="text-slate-400 mt-2 text-[15px] leading-relaxed max-w-xl">
                            Here's what's happening across your inventory today. Stay on top of stock levels, orders, and alerts.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Primary KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Products', value: inv.totalProducts || 0, icon: Layers, gradient: 'from-indigo-500/10 to-indigo-500/5', iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400', borderColor: 'border-indigo-500/20' },
                    { label: 'Stock Value', value: `₹${(inv.totalStockValue || 0).toLocaleString()}`, icon: TrendingUp, gradient: 'from-emerald-500/10 to-emerald-500/5', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
                    { label: 'Low Stock', value: inv.lowStockCount || 0, icon: AlertTriangle, gradient: 'from-amber-500/10 to-amber-500/5', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20', pulse: (inv.lowStockCount || 0) > 0 },
                    { label: 'Out of Stock', value: inv.outOfStockCount || 0, icon: Package, gradient: 'from-rose-500/10 to-rose-500/5', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400', borderColor: 'border-rose-500/20', pulse: (inv.outOfStockCount || 0) > 0 },
                ].map((kpi, i) => (
                    <div key={i} className={`relative group rounded-2xl bg-gradient-to-br ${kpi.gradient} border ${kpi.borderColor} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${kpi.iconBg} ring-1 ring-white/[0.06]`}>
                                <kpi.icon className={`w-[18px] h-[18px] ${kpi.iconColor} ${kpi.pulse ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>
                        <p className="text-[26px] font-bold text-white tracking-tight leading-none">{kpi.value}</p>
                        <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-wider">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Secondary KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Team Members', value: userCount, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10', link: '/users' },
                    { label: 'Pending POs', value: po.pendingCount || 0, icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-500/10', link: '/purchase-orders' },
                    { label: 'AI Confidence', value: `${(fc.avgConfidenceScore || 0).toFixed(1)}%`, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10', link: '/forecast' },
                    { label: 'Active Alerts', value: alertCount, icon: Bell, color: 'text-rose-400', bg: 'bg-rose-500/10', link: '/alerts', pulse: alertCount > 0 },
                ].map((item, i) => (
                    <Link key={i} to={item.link} className="group">
                        <div className="rounded-2xl bg-[#161d2f] border border-white/[0.05] p-5 flex items-center gap-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-[#1a2338]">
                            <div className={`p-2.5 rounded-xl ${item.bg} shrink-0`}>
                                <item.icon className={`w-5 h-5 ${item.color} ${item.pulse ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[22px] font-bold text-white leading-none">{item.value}</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-1.5 uppercase tracking-wider">{item.label}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Charts & Activity ── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Stock Movement Chart — wider */}
                <div className="xl:col-span-3 rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <BarChart3 className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Stock Movement</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Last 30 days trend</p>
                            </div>
                        </div>
                        <Link to="/transactions/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
                            View Analytics <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-6">
                        <StockMovementChart data={transactionReport?.timeline?.slice(-30) || []} height={280} />
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="xl:col-span-2 rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Latest stock movements</p>
                            </div>
                        </div>
                        <Link to="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {recentTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Activity className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.04]">
                                {recentTransactions.map(tx => (
                                    <div key={tx._id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                            tx.type === 'IN'
                                                ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                                                : 'bg-rose-500/10 ring-1 ring-rose-500/20'
                                        }`}>
                                            {tx.type === 'IN'
                                                ? <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                                                : <ArrowUpFromLine className="w-4 h-4 text-rose-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{tx.productId?.name || 'Unknown'}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {tx.handledBy?.name && <span className="ml-1">· {tx.handledBy.name}</span>}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-sm font-bold tabular-nums ${
                                                tx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                                {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Alerts preview strip ── */}
            {recentAlerts.length > 0 && (
                <div className="rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/10">
                                <Bell className="w-4 h-4 text-rose-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
                        </div>
                        <Link to="/alerts" className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {recentAlerts.slice(0, 3).map(alert => (
                            <div key={alert._id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    alert.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                    alert.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300 truncate">{alert.message}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                    alert.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' :
                                    alert.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>{alert.severity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────────
   MANAGER DASHBOARD
   ────────────────────────────────────────────── */

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ lowStockCount: 0, outOfStockCount: 0 });
    const [pendingCount, setPendingCount] = useState(0);
    const [todayTxCount, setTodayTxCount] = useState(0);
    const [recentTx, setRecentTx] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    const [isStockInOpen, setIsStockInOpen] = useState(false);
    const [isStockOutOpen, setIsStockOutOpen] = useState(false);

    useEffect(() => {
        api.get('/products/stats').then(res => setStats(res.data?.stats || {}));
        api.get('/purchase-orders/stats').then(res => setPendingCount(res.data?.byStatus?.PENDING || 0));
        api.get('/transactions/summary?groupBy=day').then(res => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayData = res.data?.summary?.byDate?.find(d => d.date === todayStr);
            setTodayTxCount(todayData?.transactionCount || 0);
        });
        transactionService.getAllTransactions({ limit: 5 }).then(res => setRecentTx(res.transactions || []));
        api.get('/products', { params: { stockStatus: 'LOW_STOCK', limit: 5 } }).then(res => setLowStockProducts(res.data?.products || []));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f3a] via-[#1e2746] to-[#162033] border border-white/[0.06] p-8">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl" />
                <div className="relative">
                    <p className="text-sm font-medium text-slate-400 tracking-wide uppercase mb-1">{greeting},</p>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{user?.name || 'Manager'}</h1>
                    <p className="text-slate-400 mt-2 text-[15px]">Manage your inventory operations and keep stock levels optimal.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Restock Needed', value: stats.lowStockCount || 0, icon: Package, gradient: 'from-amber-500/10 to-amber-500/5', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20', pulse: (stats.lowStockCount || 0) > 0 },
                    { label: 'Out of Stock', value: stats.outOfStockCount || 0, icon: AlertTriangle, gradient: 'from-rose-500/10 to-rose-500/5', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400', borderColor: 'border-rose-500/20', pulse: (stats.outOfStockCount || 0) > 0 },
                    { label: 'Pending POs', value: pendingCount, icon: ShoppingCart, gradient: 'from-indigo-500/10 to-indigo-500/5', iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400', borderColor: 'border-indigo-500/20' },
                    { label: "Today's Moves", value: todayTxCount, icon: ArrowRightLeft, gradient: 'from-emerald-500/10 to-emerald-500/5', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
                ].map((kpi, i) => (
                    <div key={i} className={`rounded-2xl bg-gradient-to-br ${kpi.gradient} border ${kpi.borderColor} p-5 transition-all duration-300 hover:scale-[1.02]`}>
                        <div className={`p-2.5 rounded-xl ${kpi.iconBg} inline-flex mb-4`}>
                            <kpi.icon className={`w-[18px] h-[18px] ${kpi.iconColor} ${kpi.pulse ? 'animate-pulse' : ''}`} />
                        </div>
                        <p className="text-[26px] font-bold text-white tracking-tight leading-none">{kpi.value}</p>
                        <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-wider">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setIsStockInOpen(true)} className="group rounded-2xl bg-[#161d2f] border border-emerald-500/20 p-5 flex flex-col items-center gap-3 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5">
                    <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                        <ArrowDownToLine className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Stock IN</span>
                </button>
                <button onClick={() => setIsStockOutOpen(true)} className="group rounded-2xl bg-[#161d2f] border border-rose-500/20 p-5 flex flex-col items-center gap-3 transition-all hover:border-rose-500/40 hover:bg-rose-500/5">
                    <div className="p-3 rounded-xl bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                        <ArrowUpFromLine className="w-6 h-6 text-rose-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Stock OUT</span>
                </button>
                <Link to="/purchase-orders?new=true" className="group rounded-2xl bg-[#161d2f] border border-amber-500/20 p-5 flex flex-col items-center gap-3 transition-all hover:border-amber-500/40 hover:bg-amber-500/5">
                    <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Create PO</span>
                </Link>
                <Link to="/alerts" className="group rounded-2xl bg-[#161d2f] border border-indigo-500/20 p-5 flex flex-col items-center gap-3 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5">
                    <div className="p-3 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                        <Bell className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">View Alerts</span>
                </Link>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock */}
                <div className="rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="w-4 h-4 text-amber-400" /></div>
                            <h3 className="text-sm font-semibold text-white">Low Stock — Action Required</h3>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {lowStockProducts.map(p => (
                            <div key={p._id} className="flex items-center justify-between bg-amber-500/[0.04] border border-amber-500/20 p-4 rounded-xl">
                                <div>
                                    <h4 className="font-semibold text-white text-sm">{p.name}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Stock: <span className="text-amber-400 font-semibold">{p.currentStock}</span> · Reorder: {p.reorderLevel}</p>
                                </div>
                                <Link to={`/purchase-orders?new=true&productId=${p._id}`}>
                                    <Button size="sm" variant="secondary" className="text-xs">Order</Button>
                                </Link>
                            </div>
                        ))}
                        {lowStockProducts.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">All stock levels healthy ✓</p>}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10"><ArrowRightLeft className="w-4 h-4 text-emerald-400" /></div>
                            <h3 className="text-sm font-semibold text-white">Today's Activity</h3>
                        </div>
                        <Link to="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {recentTx.map(tx => (
                            <div key={tx._id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    tx.type === 'IN' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                }`}>
                                    {tx.type === 'IN' ? <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{tx.productId?.name}</p>
                                    <p className="text-[11px] text-slate-500">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <span className={`text-sm font-bold tabular-nums ${tx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                </span>
                            </div>
                        ))}
                        {recentTx.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No transactions today</p>}
                    </div>
                </div>
            </div>

            <StockInModal isOpen={isStockInOpen} onClose={() => setIsStockInOpen(false)} />
            <StockOutModal isOpen={isStockOutOpen} onClose={() => setIsStockOutOpen(false)} />
        </div>
    );
};

/* ──────────────────────────────────────────────
   VENDOR DASHBOARD
   ────────────────────────────────────────────── */

const VendorDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ pending: 0, approved: 0, dispatched: 0, total: 0 });
    const [pendingPOs, setPendingPOs] = useState([]);
    const [myProducts, setMyProducts] = useState([]);

    useEffect(() => {
        api.get('/purchase-orders/stats').then(res => {
            const byStatus = res.data?.byStatus || {};
            setStats({
                pending: byStatus.PENDING || 0,
                approved: byStatus.APPROVED || 0,
                dispatched: byStatus.DISPATCHED || 0,
                total: res.data?.totalPOs || 0
            });
        });
        api.get('/purchase-orders', { params: { status: 'PENDING', limit: 10 } }).then(res => setPendingPOs(res.data?.purchaseOrders || []));
        api.get('/products', { params: { limit: 10 } }).then(res => setMyProducts(res.data?.products || []));
    }, []);

    const handleAction = async (id, action) => {
        try {
            await api.patch(`/purchase-orders/${id}/${action}`, action === 'approve' ? { expectedDeliveryDate: new Date() } : { rejectionReason: 'Cannot fulfill' });
            const updated = pendingPOs.filter(po => po._id !== id);
            setPendingPOs(updated);
        } catch (e) { console.error('Failed action', e); }
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f3a] via-[#1e2746] to-[#162033] border border-white/[0.06] p-8">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />
                <div className="relative">
                    <p className="text-sm font-medium text-slate-400 tracking-wide uppercase mb-1">{greeting},</p>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{user?.name || 'Vendor'}</h1>
                    <p className="text-slate-400 mt-2 text-[15px]">Manage your orders and track your assigned products.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Awaiting Response', value: stats.pending, icon: Bell, gradient: 'from-amber-500/10 to-amber-500/5', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20', pulse: stats.pending > 0 },
                    { label: 'Approved', value: stats.approved, icon: Check, gradient: 'from-emerald-500/10 to-emerald-500/5', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
                    { label: 'Dispatched', value: stats.dispatched, icon: Truck, gradient: 'from-indigo-500/10 to-indigo-500/5', iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400', borderColor: 'border-indigo-500/20' },
                    { label: 'Total Orders', value: stats.total, icon: Store, gradient: 'from-cyan-500/10 to-cyan-500/5', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', borderColor: 'border-cyan-500/20' },
                ].map((kpi, i) => (
                    <div key={i} className={`rounded-2xl bg-gradient-to-br ${kpi.gradient} border ${kpi.borderColor} p-5 transition-all duration-300 hover:scale-[1.02]`}>
                        <div className={`p-2.5 rounded-xl ${kpi.iconBg} inline-flex mb-4`}>
                            <kpi.icon className={`w-[18px] h-[18px] ${kpi.iconColor} ${kpi.pulse ? 'animate-pulse' : ''}`} />
                        </div>
                        <p className="text-[26px] font-bold text-white tracking-tight leading-none">{kpi.value}</p>
                        <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-wider">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending POs */}
                <div className="rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10"><ShoppingCart className="w-4 h-4 text-amber-400" /></div>
                            <h3 className="text-sm font-semibold text-white">Action Required</h3>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {pendingPOs.map(po => (
                            <div key={po._id} className="bg-amber-500/[0.04] border border-amber-500/20 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-xs font-mono text-slate-400">{po.poNumber}</span>
                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Pending</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-white">{po.productId?.name}</p>
                                <p className="text-xs text-slate-400 mt-1">Qty: <strong className="text-white">{po.quantity}</strong> · ₹{po.totalAmount}</p>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" onClick={() => handleAction(po._id, 'approve')} className="bg-emerald-600 hover:bg-emerald-700 text-xs">Approve</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleAction(po._id, 'reject')} className="text-xs">Reject</Button>
                                </div>
                            </div>
                        ))}
                        {pendingPOs.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">No pending orders ✓</p>}
                    </div>
                </div>

                {/* Products */}
                <div className="rounded-2xl bg-[#161d2f] border border-white/[0.05] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10"><Package className="w-4 h-4 text-indigo-400" /></div>
                            <h3 className="text-sm font-semibold text-white">My Products</h3>
                        </div>
                        <Link to="/vendor-portal/my-stock" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {myProducts.map(p => (
                            <div key={p._id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-white">{p.name}</p>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                                </div>
                                <span className="text-sm font-bold text-slate-300 tabular-nums bg-white/[0.04] px-3 py-1 rounded-lg">{p.currentStock}</span>
                            </div>
                        ))}
                        {myProducts.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No products assigned yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   PAGE ROUTER
   ────────────────────────────────────────────── */

const DashboardPage = () => {
    const { user } = useAuth();
    if (user?.role === 'ADMIN') return <div className="p-6 md:p-8 max-w-[1400px] mx-auto"><AdminDashboard /></div>;
    if (user?.role === 'MANAGER') return <div className="p-6 md:p-8 max-w-[1400px] mx-auto"><ManagerDashboard /></div>;
    if (user?.role === 'VENDOR') return <div className="p-6 md:p-8 max-w-[1400px] mx-auto"><VendorDashboard /></div>;
    return null;
};

export default DashboardPage;
