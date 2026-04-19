import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { productService } from '@/services/productService';
import { transactionService } from '@/services/transactionService';
import StockInModal from '@/components/transactions/StockInModal';
import StockOutModal from '@/components/transactions/StockOutModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
    ChevronRight, ArrowUpRight, ArrowDownRight, Edit2, ImageIcon,
    TrendingUp, PackageSearch, History, Calendar, Mail, Phone, User, Activity, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, ReferenceLine, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { forecastService } from '@/services/forecastService';
import CreatePOModal from '@/components/purchaseOrders/CreatePOModal';
import {
    RefreshCw, ShoppingCart, Brain, Info, AlertTriangle,
    Star, Layers, Clock, CheckCircle2
} from 'lucide-react';

// Utility for date formatting
const formatRelativeDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `in ${diffDays} days`;
    return date.toLocaleDateString();
};

const ProductDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('transactions');

    const [transactions, setTransactions] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [isStockInOpen, setIsStockInOpen] = useState(false);
    const [isStockOutOpen, setIsStockOutOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [forecastData, setForecastData] = useState(null);
    const [isLoadingForecast, setIsLoadingForecast] = useState(false);

    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role);

    const fetchProductData = async () => {
        try {
            const data = await productService.getProductById(id);
            setProduct(data.product);
        } catch (error) {
            toast.error('Failed to load product details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProductData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'transactions' && id) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await transactionService.getProductHistory(id);
                    setTransactions(data.transactions);
                } catch (error) {
                    console.error("Failed to fetch product history", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [activeTab, id]);

    useEffect(() => {
        if (activeTab === 'forecast' && id) {
            fetchForecast();
        }
    }, [activeTab, id]);

    const fetchForecast = async () => {
        setIsLoadingForecast(true);
        try {
            const data = await forecastService.getProductForecast(id);
            setForecastData(data.hasForecast ? data.forecast : null);
        } catch (error) {
            console.error("Failed to fetch forecast data", error);
        } finally {
            setIsLoadingForecast(false);
        }
    };

    const handleRefreshForecast = async () => {
        setIsLoadingForecast(true);
        try {
            const data = await forecastService.refreshForecast(id);
            if (data.success) {
                setForecastData(data.forecast);
                toast.success('Forecast updated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to refresh forecast');
        } finally {
            setIsLoadingForecast(false);
        }
    };

    const handleStockSuccess = async () => {
        await fetchProductData();
        if (activeTab === 'transactions') {
            try {
                const hist = await transactionService.getProductHistory(id);
                setTransactions(hist.transactions);
            } catch (e) { }
        }
    };

    const handleCreatePO = () => {
        setIsCreateModalOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><Loader /></div>;
    }

    if (!product) {
        return (
            <div className="p-8 text-center text-white">
                <h1 className="text-2xl font-bold">Product Not Found</h1>
                <Link to="/products" className="text-primary hover:underline mt-4 inline-block">Return to Catalog</Link>
            </div>
        );
    }

    const imgUrl = product.imageUrl ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${product.imageUrl}` : null;
    const profitMargin = product.sellingPrice > 0
        ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(2)
        : 0;

    const daysToExpiry = product.expiryDate
        ? Math.ceil((new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const stockPercentage = Math.min((product.currentStock / (product.maxStockLevel || 1)) * 100, 100);

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-400 mb-2">
                <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <ChevronRight size={14} className="mx-2" />
                <Link to={isAdminOrManager ? '/products' : '/vendor-products'} className="hover:text-white transition-colors">Products</Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-primary font-medium truncate max-w-[200px]">{product.name}</span>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left Column (40%) */}
                <div className="w-full xl:w-[40%] space-y-6">
                    <Card className="p-0 overflow-hidden relative group">
                        <div className="h-64 sm:h-80 bg-slate-800 flex items-center justify-center relative">
                            {imgUrl ? (
                                <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={64} className="text-slate-600" />
                            )}

                            {isAdminOrManager && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Button variant="secondary" className="shadow-lg">
                                        <Edit2 size={16} className="mr-2" /> Upload Image
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white leading-tight">{product.name}</h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-md font-mono text-xs font-semibold">
                                            {product.sku}
                                        </span>
                                        <Badge variant={product.stockStatus === 'IN_STOCK' ? 'success' : product.stockStatus === 'OUT_OF_STOCK' ? 'danger' : product.stockStatus === 'LOW_STOCK' ? 'warning' : 'primary'}>
                                            {product.stockStatus.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6 text-sm">
                                <span className="flex items-center text-slate-300">
                                    <PackageSearch size={16} className="mr-2 text-slate-500" />
                                    {product.categoryId?.name || 'Uncategorized'}
                                </span>
                                <span className="flex items-center text-slate-300">
                                    <User size={16} className="mr-2 text-slate-500" />
                                    {product.vendorId?.name || 'Unknown Vendor'}
                                </span>
                            </div>

                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {product.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-slate-400">Description</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    {product.description || 'No description provided for this product.'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column (60%) */}
                <div className="w-full xl:w-[60%] space-y-6">

                    {/* Stock Overview Card */}
                    <Card className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">Stock Overview</h3>

                            <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
                                <div>
                                    <span className="text-6xl font-bold text-white tracking-tight">{product.currentStock}</span>
                                    <span className="text-xl text-slate-400 ml-2 font-medium">{product.unit}</span>
                                </div>

                                <div className="flex gap-3">
                                    {isAdminOrManager && product.currentStock <= product.reorderLevel && (
                                        <Button variant="outline" className="border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400" onClick={handleCreatePO}>
                                            <ShoppingCart size={18} className="mr-2" /> Create PO
                                        </Button>
                                    )}
                                    <Button variant="success" className="shadow-lg shadow-success/20" onClick={() => setIsStockInOpen(true)}>
                                        <ArrowUpRight size={18} className="mr-2" /> Stock In
                                    </Button>
                                    <Button variant="danger" className="shadow-lg shadow-danger/20" onClick={() => setIsStockOutOpen(true)}>
                                        <ArrowDownRight size={18} className="mr-2" /> Stock Out
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 bg-surface/50 p-6 rounded-xl border border-white/5">
                                <div className="flex justify-between text-sm font-medium mb-1">
                                    <span className="text-slate-400">Capacity Usage</span>
                                    <span className="text-white">{stockPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out flex items-center justify-end px-2
                                            ${product.currentStock <= product.reorderLevel ? 'bg-warning' : product.currentStock === 0 ? 'bg-danger' : 'bg-success'}
                                        `}
                                        style={{ width: `${stockPercentage}%` }}
                                    ></div>
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                                        style={{ left: `${(product.reorderLevel / (product.maxStockLevel || 1)) * 100}%` }}
                                        title={`Reorder Level: ${product.reorderLevel}`}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
                                    <span>Min: 0</span>
                                    <span className="text-warning">Reorder: {product.reorderLevel}</span>
                                    <span>Max: {product.maxStockLevel}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stat Cards Matrix */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 flex flex-col justify-center">
                            <span className="text-sm text-slate-400 mb-1">Cost Price</span>
                            <span className="text-xl font-bold text-white">${product.costPrice?.toFixed(2)}</span>
                        </Card>
                        <Card className="p-4 flex flex-col justify-center">
                            <span className="text-sm text-slate-400 mb-1">Selling Price</span>
                            <span className="text-xl font-bold text-white">${product.sellingPrice?.toFixed(2)}</span>
                        </Card>
                        <Card className="p-4 flex flex-col justify-center relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-1 h-full ${product.sellingPrice > product.costPrice ? 'bg-success' : 'bg-danger'}`}></div>
                            <span className="text-sm text-slate-400 mb-1">Profit Margin</span>
                            <span className={`text-xl font-bold ${product.sellingPrice > product.costPrice ? 'text-success' : 'text-danger'}`}>
                                {profitMargin}%
                            </span>
                        </Card>
                        <Card className="p-4 flex flex-col justify-center">
                            <span className="text-sm text-slate-400 mb-1">Stock Value</span>
                            <span className="text-xl font-bold text-white">${(product.currentStock * product.costPrice).toFixed(2)}</span>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Vendor Info Card */}
                        <Card className="p-5 flex items-start gap-4 hover:border-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-slate-800 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                                {product.vendorId?.name?.charAt(0).toUpperCase() || 'V'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white truncate">{product.vendorId?.name || 'Unknown Vendor'}</h4>
                                <div className="flex items-center text-xs text-slate-400 mt-1.5 gap-3">
                                    <span className="flex items-center"><Mail size={12} className="mr-1" /> {product.vendorId?.email}</span>
                                </div>
                                <div className="mt-3">
                                    <Link to="#" className="text-xs text-primary hover:underline font-medium">View Vendor Profile &rarr;</Link>
                                </div>
                            </div>
                        </Card>

                        {/* Expiry Card */}
                        {product.isPerishable && (
                            <Card className={`p-5 relative overflow-hidden flex flex-col justify-center
                                ${daysToExpiry < 7 ? 'bg-danger/10 border-danger/20' :
                                    daysToExpiry <= 30 ? 'bg-warning/10 border-warning/20' :
                                        'bg-success/10 border-success/20'}
                            `}>
                                <Calendar className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-16 h-16
                                    ${daysToExpiry < 7 ? 'text-danger' : daysToExpiry <= 30 ? 'text-warning' : 'text-success'}
                                `} />
                                <span className="text-sm mb-1 text-slate-300 font-medium">Expiry Information</span>
                                <span className={`text-2xl font-bold z-10
                                    ${daysToExpiry < 7 ? 'text-danger' : daysToExpiry <= 30 ? 'text-warning' : 'text-success'}
                                `}>
                                    {daysToExpiry > 0 ? `Expires in ${daysToExpiry} days` : 'Product Expired!'}
                                </span>
                                <span className="text-sm text-slate-400 mt-1 font-mono">
                                    {new Date(product.expiryDate).toLocaleDateString()}
                                </span>
                            </Card>
                        )}
                    </div>

                </div>
            </div>

            {/* Tabs Section */}
            <Card className="mt-8 p-0 border-white/10">
                <div className="border-b border-white/5 flex overflow-x-auto hide-scrollbar">
                    {[
                        { id: 'transactions', label: 'Transaction History', icon: History },
                        { id: 'forecast', label: 'Forecast Preview', icon: TrendingUp },
                        { id: 'purchase-orders', label: 'Purchase Orders', icon: PackageSearch },
                        { id: 'history', label: 'Edit History', icon: Edit2 },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                                ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <tab.icon size={16} className="mr-2 text-current" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[300px]">

                    {/* Tab 1: Transaction History */}
                    {activeTab === 'transactions' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Transaction History</h3>
                                <Badge variant="secondary">{transactions.length} Records</Badge>
                            </div>

                            {isLoadingHistory ? (
                                <div className="py-10 flex justify-center"><Loader /></div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-10 bg-surface/30 rounded-xl border border-white/5 border-dashed">
                                    <History size={40} className="mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-400 text-sm">No transactions recorded for this product yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-white/5 shadow-lg bg-[#1E293B]">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase border-b border-white/10">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Date</th>
                                                <th className="px-6 py-3 font-semibold">Type</th>
                                                <th className="px-6 py-3 font-semibold text-right">Qty</th>
                                                <th className="px-6 py-3 font-semibold text-center">Before → After</th>
                                                <th className="px-6 py-3 font-semibold">Ref Type</th>
                                                <th className="px-6 py-3 font-semibold">Handler</th>
                                                <th className="px-6 py-3 font-semibold">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {transactions.map(t => (
                                                <tr key={t._id} className={`hover:bg-white/[0.02] transition-colors ${t.type === 'IN' ? 'bg-emerald-500/[0.02]' : 'bg-rose-500/[0.02]'}`}>
                                                    <td className="px-6 py-4 text-slate-300">
                                                        <div>{new Date(t.timestamp).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(t.timestamp).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${t.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                            {t.type} {t.type === 'IN' ? '▲' : '▼'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold text-lg ${t.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {t.type === 'IN' ? '+' : '-'}{t.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                                            <span className="text-slate-400 font-medium">{t.previousStock}</span>
                                                            <span className="text-slate-600">→</span>
                                                            <span className="text-white font-bold">{t.newStock}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-300 text-xs">
                                                        <span className="bg-slate-800 px-2 py-1 rounded">
                                                            {t.referenceType.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-200">{t.handledBy?.name}</div>
                                                        <div className="text-[10px] text-slate-500">{t.handledBy?.role}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px] truncate" title={t.note}>
                                                        {t.note || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: AI Forecast Analytics */}
                    {activeTab === 'forecast' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-8">
                            {isLoadingForecast ? (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                                    <p className="text-slate-400">Consulting AI Engine...</p>
                                </div>
                            ) : !forecastData ? (
                                <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 border-dashed">
                                    <Brain size={48} className="mx-auto text-slate-700 mb-4" />
                                    <h4 className="text-lg font-medium text-white mb-2">Demand Insights Unavailable</h4>
                                    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                                        AI demand forecasting requires historical stock movement.
                                        Record a sales transaction to generate your first forecast.
                                    </p>
                                    <Button onClick={handleRefreshForecast} disabled={isLoadingForecast}>
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingForecast ? 'animate-spin' : ''}`} />
                                        Force Calculation
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Row 1: Metric Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-slate-800/40 p-5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Avg Daily Demand</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-white">{forecastData.ensembleDemand.toFixed(1)}</span>
                                                <span className="text-xs text-slate-400">units/day</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/40 p-5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Days To Stockout</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-2xl font-bold ${forecastData.daysUntilStockout <= 7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {forecastData.daysUntilStockout > 365 ? '>1 year' : Math.floor(forecastData.daysUntilStockout)}
                                                </span>
                                                <span className="text-xs text-slate-400">days</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/40 p-5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Safety Stock</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-white">{forecastData.safetyStock.toFixed(1)}</span>
                                                <span className="text-xs text-slate-400">units</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/40 p-5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reorder Point</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-amber-500">{forecastData.reorderPoint.toFixed(1)}</span>
                                                <span className="text-xs text-slate-400">units</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: 7-Day Chart */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">7-Day Demand Projection (Ensemble)</h4>
                                            <div className="flex items-center space-x-4 text-[10px] text-slate-500">
                                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Predicted</div>
                                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-primary/20" /> Confidence Range</div>
                                            </div>
                                        </div>
                                        <div className="h-[300px] w-full bg-background/50 rounded-2xl p-4 border border-white/5">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={forecastData.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorDemandProd" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                                        tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                                                        labelFormatter={(date) => format(new Date(date), 'eeee, MMM dd')}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                                    <Area
                                                        name="Upper Bound"
                                                        type="monotone"
                                                        dataKey="upper"
                                                        stroke="none"
                                                        fill="#6366f1"
                                                        fillOpacity={0.05}
                                                        activeDot={false}
                                                    />
                                                    <Area
                                                        name="Lower Bound"
                                                        type="monotone"
                                                        dataKey="lower"
                                                        stroke="none"
                                                        fill="#0f172a"
                                                        fillOpacity={0.4}
                                                        activeDot={false}
                                                    />
                                                    <Area
                                                        name="Predicted Demand"
                                                        type="monotone"
                                                        dataKey="predictedDemand"
                                                        stroke="#6366f1"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorDemandProd)"
                                                        dot={{ r: 4, fill: '#6366f1' }}
                                                    />
                                                    <ReferenceLine y={product.currentStock} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Stock', position: 'right', fill: '#ef4444', fontSize: 10 }} />
                                                    <ReferenceLine y={forecastData.reorderPoint} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'ROP', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Row 3: Data Table */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Daily Prediction Values</h4>
                                        <div className="overflow-hidden rounded-xl border border-white/5">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-3">Forecast Date</th>
                                                        <th className="px-6 py-3">Predicted Demand</th>
                                                        <th className="px-6 py-3">Lower Interval</th>
                                                        <th className="px-6 py-3">Upper Interval</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {forecastData.forecast.map((day, idx) => {
                                                        const isAboveAvg = day.predictedDemand > forecastData.ensembleDemand;
                                                        return (
                                                            <tr key={idx} className="hover:bg-white/[0.02]">
                                                                <td className="px-6 py-3 text-slate-300 font-medium">
                                                                    {format(new Date(day.date), 'eeee, MMM dd')}
                                                                </td>
                                                                <td className={`px-6 py-3 font-bold ${isAboveAvg ? 'text-amber-400' : 'text-sky-400'}`}>
                                                                    {day.predictedDemand.toFixed(2)} units
                                                                </td>
                                                                <td className="px-6 py-3 text-slate-500">{day.lower.toFixed(2)}</td>
                                                                <td className="px-6 py-3 text-slate-500">{day.upper.toFixed(2)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Row 4: Algorithm Breakdown */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <Card className="p-6 bg-surface/50">
                                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center">
                                                <Layers className="w-4 h-4 mr-2" /> Algorithm Convergence
                                            </h4>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                                                        <span className="text-[10px] text-slate-500 uppercase block mb-1">WMA</span>
                                                        <span className="text-lg font-bold text-white">{forecastData.wmaDemand?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="p-3 bg-background/50 rounded-lg border border-white/5">
                                                        <span className="text-[10px] text-slate-500 uppercase block mb-1">SES</span>
                                                        <span className="text-lg font-bold text-white">{forecastData.sesDemand?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                                        <span className="text-[10px] text-primary uppercase block mb-1 font-bold">Ensemble</span>
                                                        <span className="text-lg font-bold text-white">{forecastData.ensembleDemand?.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">System Confidence</span>
                                                        <span className="text-sm font-bold text-white">{forecastData.confidenceLabel} ({(forecastData.confidenceScore * 100).toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                            style={{ width: `${forecastData.confidenceScore * 100}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500">History Analyzed:</span>
                                                    <span className="text-white font-mono">{forecastData.dataPointsUsed} day(s)</span>
                                                </div>
                                            </div>
                                        </Card>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Engine Logs & Warnings</h4>
                                            {forecastData.warnings?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {forecastData.warnings.map((w, i) => (
                                                        <div key={i} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                            <p className="text-xs text-rose-200 leading-relaxed font-medium">{w}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/5">
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-3" />
                                                    <p className="text-xs text-slate-500 italic">No anomalies detected in the current forecast cycle.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 5: Actions */}
                                    <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-b-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase tracking-tight">Last Engine Sync</p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {forecastData.generatedAt ? format(new Date(forecastData.generatedAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-white/10 hover:bg-white/5"
                                                onClick={handleRefreshForecast}
                                                disabled={isLoadingForecast}
                                            >
                                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingForecast ? 'animate-spin' : ''}`} />
                                                Refresh Calc
                                            </Button>
                                            <Button
                                                className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                                                onClick={handleCreatePO}
                                                disabled={isCreatingPO}
                                            >
                                                <ShoppingCart className={`w-4 h-4 mr-2 ${isCreatingPO ? 'animate-pulse' : ''}`} />
                                                {isCreatingPO ? 'Generating PO...' : 'Order Demand'}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Purchase Orders */}
                    {activeTab === 'purchase-orders' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Linked Purchase Orders</h3>
                                <Badge variant="warning">Module 4</Badge>
                            </div>
                            <div className="text-center py-10 bg-surface/30 rounded-xl border border-white/5 border-dashed">
                                <PackageSearch size={40} className="mx-auto text-slate-600 mb-3" />
                                <p className="text-slate-400 text-sm">Review purchase orders in the main module.</p>
                                <Link to="/purchase-orders" className="text-primary hover:underline text-xs mt-2 inline-block">Go to Purchase Orders Module &rarr;</Link>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Edit History */}
                    {activeTab === 'history' && (
                        <div className="max-w-3xl">
                            <h3 className="font-semibold text-white mb-6">Audit Log</h3>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">

                                {/* Updated Item */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-surface text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                                        <Edit2 size={16} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface p-4 rounded-xl border border-white/5 shadow-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-white text-sm">Product Updated</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-400 mb-2">
                                            Modifications logged.
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(product.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Created Item */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-primary/10 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                                        <Plus size={16} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface p-4 rounded-xl border border-white/5 shadow-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-primary text-sm">Product Created</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {new Date(product.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-400 mb-2">
                                            Initial configuration completed by System User.
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(product.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                </div>
            </Card>

            <StockInModal
                isOpen={isStockInOpen}
                onClose={() => setIsStockInOpen(false)}
                initialProduct={product}
                onSuccess={handleStockSuccess}
            />

            <StockOutModal
                isOpen={isStockOutOpen}
                onClose={() => setIsStockOutOpen(false)}
                initialProduct={product}
                onSuccess={handleStockSuccess}
            />

            <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                prefilledProduct={product}
            />
        </div>
    );
};

export default ProductDetailPage;
