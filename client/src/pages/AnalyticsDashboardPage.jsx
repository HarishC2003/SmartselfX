import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, FileText, TrendingUp, DollarSign, Package, AlertTriangle, Activity } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Loader } from '@/components/ui/Loader';

const COLORS = ['#6366F1', '#22D3EE', '#F43F5E', '#F59E0B', '#10B981'];

const KPICard = ({ title, value, subtitle, icon: Icon, type }) => (
    <Card className="relative overflow-hidden group hover:border-white/10 transition-colors duration-300">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${type === 'primary' ? 'bg-primary' :
            type === 'warning' ? 'bg-warning' :
                type === 'danger' ? 'bg-danger' :
                    type === 'accent' ? 'bg-accent' : 'bg-success'
            }`} />

        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <h3 className="text-3xl font-bold text-white mt-1 mb-1">{value}</h3>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-surface/50 border border-white/5 group-hover:scale-110 transition-transform ${type === 'primary' ? 'text-primary' :
                type === 'warning' ? 'text-warning' :
                    type === 'danger' ? 'text-danger' :
                        type === 'accent' ? 'text-accent' : 'text-success'
                }`}>
                <Icon size={24} />
            </div>
        </div>
    </Card>
);

const AnalyticsDashboardPage = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [healthData, setHealthData] = useState([]);
    const [topPerformers, setTopPerformers] = useState(null);

    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [kpiRes, trendRes, healthRes, topRes] = await Promise.all([
                    reportService.getDashboardKPIs(),
                    reportService.getPurchaseVsSales(),
                    reportService.getInventoryHealth(),
                    reportService.getTopPerformers(),
                ]);
                setKpis(kpiRes);
                setTrendData(trendRes);
                setHealthData(healthRes);
                setTopPerformers(topRes);
            } catch (error) {
                toast({ title: 'Error', message: 'Failed to load analytics data', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [toast]);

    const handleExport = async (type, format) => {
        setExporting(true);
        try {
            await reportService.downloadExport(type, format);
            toast({ title: 'Success', message: `Report exported as ${format.toUpperCase()}`, type: 'success' });
        } catch (error) {
            toast({ title: 'Export Failed', message: error.message, type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const [exportType, setExportType] = useState('inventory_health');

    if (loading) return <Loader fullScreen text="Compiling Analytics..." />;

    // Aggregate category distribution from health data
    const categoryDist = healthData.reduce((acc, item) => {
        const cat = item.categoryName || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + item.stockValue;
        return acc;
    }, {});

    const pieData = Object.keys(categoryDist).map(key => ({
        name: key,
        value: categoryDist[key]
    })).sort((a,b) => b.value - a.value).slice(0, 5); // Top 5 categories

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header & Export Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Reports</h1>
                    <p className="text-slate-400 mt-1">
                        Executive overview, inventory health, and performance metrics
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <select 
                        value={exportType} 
                        onChange={(e) => setExportType(e.target.value)}
                        className="bg-surface border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-primary"
                    >
                        <option value="inventory_health">Inventory Health</option>
                        <option value="purchase_sales">Purchase & Sales</option>
                        <option value="top_performers">Top Performers</option>
                    </select>
                    <Button variant="outline" onClick={() => handleExport(exportType, 'xlsx')} disabled={exporting}>
                        <FileText size={16} className="mr-2" /> Export Excel
                    </Button>
                    <Button variant="primary" onClick={() => handleExport(exportType, 'pdf')} disabled={exporting}>
                        <Download size={16} className="mr-2" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Inventory Value"
                    value={`₹${(kpis?.inventoryValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subtitle={`Across ${kpis?.totalItems || 0} items`}
                    icon={DollarSign}
                    type="primary"
                />
                <KPICard
                    title="Monthly Sales (OUT)"
                    value={`₹${(kpis?.monthlySalesValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subtitle={`${kpis?.monthlySalesItems || 0} items sold`}
                    icon={TrendingUp}
                    type="success"
                />
                <KPICard
                    title="Monthly Purchases (IN)"
                    value={`₹${(kpis?.monthlyPOValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subtitle={`${kpis?.monthlyPOCount || 0} approved POs`}
                    icon={Package}
                    type="accent"
                />
                <KPICard
                    title="Stock Risks"
                    value={kpis?.lowStockCount + kpis?.outOfStockCount || 0}
                    subtitle={`${kpis?.outOfStockCount || 0} Out of Stock`}
                    icon={AlertTriangle}
                    type="danger"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales vs Purchases Comarison */}
                <Card title={<div className="flex items-center"><Activity className="mr-2 h-5 w-5 text-accent"/>Sales vs Purchases Trend</div>} className="lg:col-span-2">
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorPO" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="#475569" tick={{fill: '#94A3B8', fontSize: 12}} />
                                <YAxis stroke="#475569" tick={{fill: '#94A3B8', fontSize: 12}} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
                                    itemStyle={{ color: '#F1F5F9' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area type="monotone" dataKey="outValue" name="Sales Value (OUT)" stroke="#10B981" fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="inValue" name="Purchase Value (IN)" stroke="#6366F1" fillOpacity={1} fill="url(#colorPO)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Category Inventory Value Dist */}
                <Card title={<div className="flex items-center"><Package className="mr-2 h-5 w-5 text-indigo-400"/>Stock Value by Category</div>}>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value) => `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500">No category data available.</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Products */}
                <Card title="Top Performing Products (This Month)">
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-surface/50 border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-3 font-medium rounded-tl-lg">Product</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Qty Sold</th>
                                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topPerformers?.topProducts?.map((product, idx) => (
                                    <tr key={product._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-white font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-500/20 text-amber-500' : idx === 1 ? 'bg-slate-300/20 text-slate-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-surface border border-white/10 text-slate-500'}`}>
                                                    {idx + 1}
                                                </span>
                                                {product.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{product.sku}</td>
                                        <td className="px-4 py-3 font-bold text-success text-center">{product.totalQuantitySold}</td>
                                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                                            ₹{product.totalSalesValue.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {(!topPerformers?.topProducts || topPerformers.topProducts.length === 0) && (
                                    <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-500">No sales data for this month.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Top Vendors */}
                <Card title="Top Suppliers by Order Volume (This Month)">
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-surface/50 border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-3 font-medium rounded-tl-lg">Vendor Name</th>
                                    <th className="px-4 py-3 font-medium text-center">Orders</th>
                                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Total PO Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topPerformers?.topVendors?.map((vendor, idx) => (
                                    <tr key={vendor._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                    {vendor.name.charAt(0)}
                                                </div>
                                                {vendor.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-300">{vendor.poCount}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-400">
                                            ₹{vendor.totalPOValue.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {(!topPerformers?.topVendors || topPerformers.topVendors.length === 0) && (
                                    <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-500">No PO data for this month.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>

        </div>
    );
};

export default AnalyticsDashboardPage;
