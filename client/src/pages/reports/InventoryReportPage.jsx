import React, { useState } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useAuth } from '../../hooks/useAuth';
import { Package, DollarSign, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import DateRangePicker from '../../components/charts/DateRangePicker';
import ExportButton from '../../components/charts/ExportButton';
import KPICard from '../../components/charts/KPICard';
import StockStatusDonut from '../../components/charts/StockStatusDonut';

const InventoryReportPage = () => {
    const { user } = useAuth();
    const { 
        dateRange, 
        setDateRange, 
        exportReport, 
        executiveSummary,
        inventoryHealth,
        isLoading
    } = useAnalytics();

    const [actionTab, setActionTab] = useState('fast'); // fast, slow, dead, expiry

    if (isLoading.health || isLoading.executive || !executiveSummary || !inventoryHealth) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#020617] flex justify-center items-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400">Loading Inventory Health Report...</p>
                </div>
            </div>
        );
    }

    const { inventory } = executiveSummary;
    const { 
        categoryBreakdown, 
        fastMovingProducts, 
        slowMovingProducts, 
        deadStockProducts, 
        expiryRisk,
        topValueProducts = [] // default if not present in API
    } = inventoryHealth;

    const stockHealthData = [
        { status: 'IN_STOCK', name: 'Healthy', value: inventory.healthyStockCount },
        { status: 'LOW_STOCK', name: 'Low Stock', value: inventory.lowStockCount },
        { status: 'OUT_OF_STOCK', name: 'Out of Stock', value: inventory.outOfStockCount },
        { status: 'OVERSTOCKED', name: 'Overstocked', value: inventory.overstockedCount }
    ].filter(d => d.value > 0);

    const totalStockItems = stockHealthData.reduce((sum, item) => sum + item.value, 0);

    // Calculate percentages for the table
    const statusDistribution = stockHealthData.map(item => ({
        ...item,
        percentage: totalStockItems > 0 ? (item.value / totalStockItems) * 100 : 0
    }));

    const getStatusColor = (status) => {
        switch(status) {
            case 'IN_STOCK': return 'bg-emerald-500';
            case 'LOW_STOCK': return 'bg-amber-500';
            case 'OUT_OF_STOCK': return 'bg-red-500';
            case 'OVERSTOCKED': return 'bg-indigo-500';
            default: return 'bg-slate-500';
        }
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
                            Inventory Health Report
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
                        onExcelExport={() => exportReport('inventory', 'excel')}
                        onPDFExport={() => exportReport('inventory', 'pdf')}
                        isLoading={isLoading.export}
                    />
                </div>
            </div>

            {/* SECTION 1: Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <KPICard 
                    title="Total Products" 
                    value={inventory.totalProducts} 
                    icon={Package} 
                    color="#6366F1" 
                />
                <KPICard 
                    title="Stock Value" 
                    value={`₹${inventory.totalStockValue.toLocaleString()}`} 
                    icon={DollarSign} 
                    color="#22C55E" 
                />
                <KPICard 
                    title="Retail Value" 
                    value={`₹${inventory.totalRetailValue.toLocaleString()}`} 
                    icon={TrendingUp} 
                    color="#0EA5E9" 
                />
                <KPICard 
                    title="Profit Margin" 
                    value={`${inventory.totalRetailValue > 0 ? ((inventory.potentialProfit / inventory.totalRetailValue) * 100).toFixed(1) : 0}%`}
                    subtitle={`₹${inventory.potentialProfit.toLocaleString()} Est. Profit`}
                    icon={TrendingUp} 
                    color="#8B5CF6" 
                />
                <KPICard 
                    title="Low Stock" 
                    value={inventory.lowStockCount} 
                    icon={AlertTriangle} 
                    color="#F59E0B" 
                />
                <KPICard 
                    title="Out of Stock" 
                    value={inventory.outOfStockCount} 
                    icon={AlertTriangle} 
                    color="#EF4444" 
                />
            </div>

            {/* SECTION 2: Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-200 mb-6">Status Breakdown</h3>
                    <div className="h-64">
                        <StockStatusDonut data={stockHealthData} />
                    </div>
                </div>

                <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 lg:col-span-2 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-6">Distribution Summary</h3>
                    <div className="flex-1 overflow-x-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Count</th>
                                    <th className="px-4 py-3 text-right">% of Total</th>
                                    <th className="px-4 py-3 w-1/3">Distribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {statusDistribution.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 text-slate-200">
                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">{item.value.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">{item.percentage.toFixed(1)}%</td>
                                        <td className="px-4 py-3">
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${getStatusColor(item.status)}`} 
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Category Breakdown Table */}
            <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-6">Categories Overview</h3>
                <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">Products</th>
                                <th className="px-4 py-3 text-right">Stock Value</th>
                                <th className="px-4 py-3 text-right">Low Stock</th>
                                <th className="px-4 py-3 text-right">Out of Stock</th>
                                <th className="px-4 py-3">Top Product</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {categoryBreakdown.map((cat, idx) => (
                                <tr key={idx} className="hover:bg-white/5 text-slate-300">
                                    <td className="px-4 py-3 font-bold flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color || '#6366F1' }}></div>
                                        {cat.categoryName || cat.name}
                                    </td>
                                    <td className="px-4 py-3 text-right">{cat.productCount}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-400">₹{cat.totalStockValue?.toLocaleString() || 0}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${cat.lowStockCount > 0 ? 'text-amber-400 bg-amber-500/10' : ''}`}>
                                        {cat.lowStockCount}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${cat.outOfStockCount > 0 ? 'text-red-400 bg-red-500/10' : ''}`}>
                                        {cat.outOfStockCount}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">
                                        {cat.topProduct ? (
                                            <span className="truncate block max-w-[200px]" title={cat.topProduct.name}>
                                                {cat.topProduct.name}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {categoryBreakdown.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No category data</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 4: Top 10 Value Products */}
            {topValueProducts && topValueProducts.length > 0 && (
                <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-6 text-emerald-400 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Top 10 High-Value Assets
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 w-16">Rank</th>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Current Stock</th>
                                    <th className="px-4 py-3 text-right">Unit Cost</th>
                                    <th className="px-4 py-3 text-right">Stock Value</th>
                                    <th className="px-4 py-3 w-48">Health</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topValueProducts.slice(0, 10).map((p, idx) => {
                                    const healthPct = Math.min(100, Math.max(0, (p.currentStock / (p.reorderLevel * 2 || 10)) * 100));
                                    const isLow = p.currentStock <= p.reorderLevel;
                                    const isOOS = p.currentStock === 0;
                                    return (
                                        <tr key={p.sku || idx} className="hover:bg-white/5 text-slate-300">
                                            <td className="px-4 py-3 font-bold text-slate-500">#{idx + 1}</td>
                                            <td className="px-4 py-3 font-bold text-slate-200">{p.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${isOOS ? 'text-red-400' : isLow ? 'text-amber-400' : ''}`}>
                                                {p.currentStock}
                                            </td>
                                            <td className="px-4 py-3 text-right">₹{p.costPrice?.toLocaleString() || 0}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-400">₹{p.stockValue?.toLocaleString() || 0}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${isOOS ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                            style={{ width: `${healthPct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-[10px] w-12 text-right ${isOOS ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {isOOS ? 'OOS' : isLow ? 'LOW' : 'OK'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECTION 5: Products Requiring Action */}
            <div className="bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-slate-200">Products Requiring Action</h3>
                </div>
                
                {/* Action Tabs */}
                <div className="flex border-b border-[#334155] bg-[#0F172A]">
                    <button 
                        onClick={() => setActionTab('fast')}
                        className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${actionTab === 'fast' ? 'border-amber-500 text-amber-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        🔥 Fast Moving ({fastMovingProducts.length})
                    </button>
                    <button 
                        onClick={() => setActionTab('slow')}
                        className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${actionTab === 'slow' ? 'border-indigo-400 text-indigo-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        🐌 Slow Moving ({slowMovingProducts.length})
                    </button>
                    <button 
                        onClick={() => setActionTab('dead')}
                        className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${actionTab === 'dead' ? 'border-slate-400 text-slate-200 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        💀 Dead Stock ({deadStockProducts.length})
                    </button>
                    <button 
                        onClick={() => setActionTab('expiry')}
                        className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${actionTab === 'expiry' ? 'border-red-500 text-red-500 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        ⚠️ Expiry Risk ({(expiryRisk || []).length})
                    </button>
                </div>

                <div className="p-6 overflow-x-auto">
                    {/* FAST MOVING */}
                    {actionTab === 'fast' && (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Avg Out/Day</th>
                                    <th className="px-4 py-3 text-right">Est. Days Left</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#334155]">
                                {fastMovingProducts.map(p => (
                                    <tr key={p.sku} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                                        <td className="px-4 py-3 text-right font-bold text-amber-500">{p.avgDailyOut?.toFixed(1) || 0}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${p.daysUntilStockout < 7 ? 'text-red-400' : 'text-amber-400'}`}>
                                            {p.daysUntilStockout} days
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/20">
                                                Create PO
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {fastMovingProducts.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No fast moving products identified.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* SLOW MOVING */}
                    {actionTab === 'slow' && (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Total Out</th>
                                    <th className="px-4 py-3 text-right">Stock Val</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#334155]">
                                {slowMovingProducts.map(p => (
                                    <tr key={p.sku} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-400">{p.totalOutQty}</td>
                                        <td className="px-4 py-3 text-right text-slate-300">₹{p.stockValue?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="px-3 py-1.5 bg-[#334155] hover:bg-[#475569] text-white rounded text-xs font-semibold transition-colors">
                                                Review Strategy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {slowMovingProducts.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No slow moving products identified.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* DEAD STOCK */}
                    {actionTab === 'dead' && (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Age (Days)</th>
                                    <th className="px-4 py-3 text-right">Stock Value</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#334155]">
                                {deadStockProducts.map(p => (
                                    <tr key={p.sku} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-400">{p.daysSinceLastMovement}</td>
                                        <td className="px-4 py-3 text-right text-slate-300">₹{p.stockValue?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right flex gap-2 justify-end">
                                            <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors">
                                                Create Promotion
                                            </button>
                                            <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded text-xs font-semibold transition-colors">
                                                Deactivate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {deadStockProducts.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No dead stock identified.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* EXPIRY RISK */}
                    {actionTab === 'expiry' && (
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-[#0F172A] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Days Left</th>
                                    <th className="px-4 py-3 text-right">Stock Value</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#334155]">
                                {(expiryRisk || []).map(p => (
                                    <tr key={p.sku} className="hover:bg-white/5 text-red-400">
                                        <td className="px-4 py-3 font-medium">{p.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs opacity-70">{p.sku}</td>
                                        <td className="px-4 py-3 text-right font-bold">{p.daysUntilExpiry}</td>
                                        <td className="px-4 py-3 text-right">₹{p.stockValue?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right flex gap-2 justify-end">
                                            <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold transition-colors">
                                                Discount Alert
                                            </button>
                                            <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-xs font-semibold transition-colors">
                                                Mark Disposal
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!expiryRisk || expiryRisk.length === 0) && (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No products near expiry.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryReportPage;
