import React, { useState, useEffect, useMemo } from 'react';
import {
    Brain,
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    ChevronRight,
    Search,
    Filter,
    Star,
    ShoppingCart,
    BarChart3,
    Info,
    Calendar,
    Layers,
    Clock,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Package
} from 'lucide-react';
import { useForecast } from '@/context/ForecastContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import CreatePOModal from '@/components/purchaseOrders/CreatePOModal';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from 'recharts';
import { format } from 'date-fns';

const ForecastPage = () => {
    const {
        forecasts,
        summary,
        isLoading,
        fetchAllForecasts,
        fetchSummary,
        refreshProductForecast
    } = useForecast();

    // Filters & State
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('ALL');
    const [confidenceFilter, setConfidenceFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('daysUntilStockout');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedForecast, setSelectedForecast] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatingPO, setIsCreatingPO] = useState(false);

    useEffect(() => {
        fetchAllForecasts();
        fetchSummary();
    }, [fetchAllForecasts, fetchSummary]);

    // Derived data
    const filteredForecasts = useMemo(() => {
        return forecasts
            .filter(f => f?.productId && typeof f.productId === 'object' && f.productId.name)
            .filter(f => {
                const matchesSearch = f.productId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (f.productId.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesRisk = riskFilter === 'ALL' || f.stockoutRisk === riskFilter;
                const matchesConfidence = confidenceFilter === 'ALL' ||
                    (confidenceFilter === 'HIGH' && f.confidenceScore >= 0.7) ||
                    (confidenceFilter === 'LOW' && f.confidenceScore < 0.7);
                return matchesSearch && matchesRisk && matchesConfidence;
            })
            .sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];

                // Handle nested paths or special logic if needed
                if (sortBy === 'name') {
                    valA = a.productId.name;
                    valB = b.productId.name;
                }

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
    }, [forecasts, searchTerm, riskFilter, confidenceFilter, sortBy, sortOrder]);

    const handleRefreshAll = async () => {
        // In a real app, this might call a batch refresh endpoint
        // For now, let's just re-fetch the latest data
        fetchAllForecasts();
        fetchSummary();
    };

    const openDetail = (forecast) => {
        setSelectedForecast(forecast);
        setIsPanelOpen(true);
    };

    const handleCreatePO = (forecast) => {
        setSelectedForecast(forecast);
        setIsCreateModalOpen(true);
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'CRITICAL': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
            case 'HIGH': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'LOW': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
            default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
        }
    };

    const getStockoutColor = (days) => {
        if (days <= 3) return 'text-rose-500';
        if (days <= 7) return 'text-amber-500';
        if (days <= 14) return 'text-yellow-500';
        return 'text-emerald-500';
    };

    const getStockoutProgressColor = (days) => {
        if (days <= 3) return 'bg-rose-500';
        if (days <= 7) return 'bg-amber-500';
        if (days <= 14) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const renderConfidenceStars = (score) => {
        const stars = Math.round(score * 5);
        return (
            <div className="flex items-center space-x-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                ))}
            </div>
        );
    };

    if (isLoading && forecasts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-slate-400">Loading AI Insights...</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">AI Demand Forecast</h1>
                    </div>
                    <p className="text-slate-400 mt-1 flex items-center">
                        Powered by WMA + SES + Safety Stock Ensemble
                        <Badge variant="outline" className="ml-3 border-white/10 text-[10px]">
                            <Clock className="w-3 h-3 mr-1" />
                            Auto-updated
                        </Badge>
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={handleRefreshAll}
                        className="border-white/10 hover:bg-white/5"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh All
                    </Button>
                </div>
            </div>

            {/* Risk Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Critical Risk', count: summary.criticalRisk, risk: 'CRITICAL', color: 'rose', sub: 'Immediate action needed' },
                        { label: 'High Risk', count: summary.highRisk, risk: 'HIGH', color: 'amber', sub: 'Order within lead time' },
                        { label: 'Medium Risk', count: summary.mediumRisk, risk: 'MEDIUM', color: 'yellow', sub: 'Monitor closely' },
                        { label: 'Low Risk', count: summary.lowRisk, risk: 'LOW', color: 'emerald', sub: 'Stock levels healthy' }
                    ].map((item) => (
                        <Card
                            key={item.label}
                            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] border-l-4 ${item.risk === 'CRITICAL' ? 'border-l-rose-500' :
                                item.risk === 'HIGH' ? 'border-l-amber-500' :
                                    item.risk === 'MEDIUM' ? 'border-l-yellow-500' : 'border-l-emerald-500'
                                } ${riskFilter === item.risk ? 'ring-2 ring-primary bg-white/5' : ''}`}
                            onClick={() => setRiskFilter(item.risk === riskFilter ? 'ALL' : item.risk)}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-400 font-medium lowercase tracking-wider">{item.label}</span>
                                <div className="flex items-baseline space-x-2 mt-1">
                                    <span className="text-3xl font-bold text-white">{item.count}</span>
                                    <span className="text-xs text-slate-500">products</span>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-tighter opacity-70 italic font-medium">{item.sub}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Filters */}
            <Card className="p-4 bg-surface/50 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search product or SKU..."
                            className="pl-10 bg-background/50 border-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary h-10"
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                        >
                            <option value="ALL">All Risk Levels</option>
                            <option value="CRITICAL">Critical Risk</option>
                            <option value="HIGH">High Risk</option>
                            <option value="MEDIUM">Medium Risk</option>
                            <option value="LOW">Low Risk</option>
                        </select>
                    </div>

                    <select
                        className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary h-10"
                        value={confidenceFilter}
                        onChange={(e) => setConfidenceFilter(e.target.value)}
                    >
                        <option value="ALL">All Confidence</option>
                        <option value="HIGH">High Confidence (≥70%)</option>
                        <option value="LOW">Low Confidence (&lt;70%)</option>
                    </select>

                    <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary h-10"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="daysUntilStockout">Days Until Stockout</option>
                            <option value="ensembleDemand">Daily Demand</option>
                            <option value="confidenceScore">Confidence</option>
                            <option value="name">Product Name</option>
                        </select>
                    </div>

                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                        {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                </div>
            </Card>

            {/* Forecast Table */}
            <Card className="overflow-hidden bg-surface/30 backdrop-blur-md border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stock Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Avg Daily Demand</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Days Until Stockout</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Risk & Confidence</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredForecasts.length > 0 ? (
                                filteredForecasts.map((f) => {
                                    const isCritical = f.stockoutRisk === 'CRITICAL';
                                    const needsReorder = f.productId.currentStock <= f.reorderPoint;

                                    return (
                                        <tr
                                            key={f._id}
                                            className={`group transition-colors hover:bg-white/5 ${isCritical ? 'bg-rose-500/5' : ''}`}
                                        >
                                            <td className={`px-6 py-4 ${isCritical ? 'border-l-4 border-rose-500' : ''}`}>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-lg bg-background border border-white/5 overflow-hidden flex-shrink-0">
                                                        {f.productId.image ? (
                                                            <img src={f.productId.image} alt={f.productId.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-white/5">
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link to={`/products/${f.productId._id}`} className="text-sm font-semibold text-white hover:text-primary transition-colors block leading-tight">
                                                            {f.productId.name}
                                                        </Link>
                                                        <span className="text-[11px] text-slate-500 font-mono mt-1 block uppercase tracking-tighter">SKU: {f.productId.sku}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg font-bold text-white">{f.productId.currentStock}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase">{f.productId.unit}</span>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] border-none px-0 ${needsReorder ? 'text-rose-400 animate-pulse font-bold' : 'text-emerald-400'}`}
                                                    >
                                                        {needsReorder ? '⚠️ Below Reorder Pt' : 'Healthy Buffer'}
                                                    </Badge>
                                                    {f.activePO && (
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                            <Link 
                                                                to="/purchase-orders" 
                                                                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 uppercase tracking-tighter"
                                                            >
                                                                PO {f.activePO.poNumber} {f.activePO.status}
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-sm font-bold text-white leading-none">{f.ensembleDemand.toFixed(1)}</span>
                                                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">units / day</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2 max-w-[140px]">
                                                    <div className="flex items-baseline space-x-1">
                                                        <span className={`text-sm font-bold ${getStockoutColor(f.daysUntilStockout)}`}>
                                                            {f.daysUntilStockout > 365 ? '>1 year' : Math.floor(f.daysUntilStockout)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 uppercase">days left</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${getStockoutProgressColor(f.daysUntilStockout)}`}
                                                            style={{ width: `${Math.min(100, (f.daysUntilStockout / 30) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${getRiskColor(f.stockoutRisk)}`}>
                                                        {f.stockoutRisk} RISK
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center space-x-2">
                                                            {renderConfidenceStars(f.confidenceScore)}
                                                            <span className="text-[11px] font-bold text-slate-300">{f.confidenceLabel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-slate-400 hover:text-white hover:bg-white/5 px-2"
                                                        onClick={() => openDetail(f)}
                                                    >
                                                        <BarChart3 className="w-4 h-4 mr-2" />
                                                        View
                                                    </Button>
                                                    {(f.stockoutRisk === 'CRITICAL' || f.stockoutRisk === 'HIGH') && (
                                                        <Button
                                                            size="sm"
                                                            className={`${f.activePO ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'}`}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleCreatePO(f); 
                                                            }}
                                                            disabled={isCreatingPO}
                                                            title={f.activePO ? `Order already in progress (${f.activePO.poNumber}) - Click to order more` : 'Create Purchase Order'}
                                                        >
                                                            <ShoppingCart className={`w-3.5 h-3.5 mr-1.5 ${isCreatingPO ? 'animate-pulse' : ''}`} />
                                                            {f.activePO ? '+ Order More' : 'Order'}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-slate-500 hover:text-primary hover:bg-primary/10 w-8 p-0"
                                                        onClick={() => refreshProductForecast(f.productId._id)}
                                                        disabled={isLoading}
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div className="p-4 bg-white/5 rounded-full mb-4">
                                                <Search className="w-12 h-12 text-slate-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white">No forecasts matching filters</h3>
                                            <p className="max-w-xs mx-auto mt-2">Try adjusting your risk levels or searching for a different product.</p>
                                            <Button variant="outline" className="mt-6" onClick={() => { setSearchTerm(''); setRiskFilter('ALL'); }}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Detail Slide-over Panel */}
            {isPanelOpen && selectedForecast && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsPanelOpen(false)}
                    />

                    {/* Panel */}
                    <div className="fixed right-0 top-0 bottom-0 w-full max-w-[600px] bg-surface z-50 shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar border-l border-white/5">
                        <div className="p-8 space-y-8">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 rounded-xl bg-background border border-white/5 overflow-hidden flex-shrink-0">
                                        {selectedForecast.productId.image ? (
                                            <img src={selectedForecast.productId.image} alt={selectedForecast.productId.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-white/5">
                                                <Package className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white leading-tight">{selectedForecast.productId.name}</h2>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs font-mono text-primary uppercase">{selectedForecast.productId.sku}</span>
                                            <span className="text-slate-600">•</span>
                                            <Badge variant="outline" className="text-[10px] py-0">{selectedForecast.productId.categoryId?.name || 'Category'}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
                                    onClick={() => setIsPanelOpen(false)}
                                >
                                    <TrendingDown className="w-5 h-5 rotate-45" /> {/* Close icon using lucide */}
                                    {/* Actually using rotate-45 TrendingDown as a X for now, or X if available */}
                                    <span className="sr-only">Close</span>
                                </Button>
                            </div>

                            {/* Meta Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { label: 'Current Stock', value: selectedForecast.productId.currentStock, unit: selectedForecast.productId.unit, icon: Package },
                                    { label: 'Ensemble Demand', value: selectedForecast.ensembleDemand.toFixed(1), unit: 'u/day', icon: TrendingUp },
                                    { label: 'Days to Stockout', value: Math.floor(selectedForecast.daysUntilStockout), unit: 'days', icon: Clock, color: getStockoutColor(selectedForecast.daysUntilStockout) },
                                    { label: 'Reorder Point', value: selectedForecast.reorderPoint.toFixed(1), unit: 'units', icon: CheckCircle2 },
                                    { label: 'Safety Stock', value: selectedForecast.safetyStock.toFixed(1), unit: 'units', icon: Info },
                                    { label: 'Suggested Order', value: selectedForecast.suggestedOrderQty || 0, unit: 'units', icon: ShoppingCart },
                                ].map(stat => (
                                    <div key={stat.label} className="bg-background/50 rounded-xl p-4 border border-white/5 group hover:border-primary/20 transition-all">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">{stat.label}</span>
                                        <div className="flex items-baseline space-x-1">
                                            <span className={`text-xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</span>
                                            <span className="text-[10px] text-slate-500">{stat.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">7-Day Demand Projection</h3>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1.5">
                                            <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                                            <span className="text-[10px] text-slate-400">Predicted</span>
                                        </div>
                                        <div className="flex items-center space-x-1.5">
                                            <div className="w-2 h-2 rounded bg-primary opacity-20" />
                                            <span className="text-[10px] text-slate-400">Confidence Range</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[280px] w-full bg-background/50 rounded-2xl p-4 border border-white/5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={selectedForecast.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
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
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 10 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                                labelFormatter={(date) => format(new Date(date), 'eeee, MMM dd')}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="upper"
                                                stroke="none"
                                                fill="#6366f1"
                                                fillOpacity={0.05}
                                                activeDot={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="lower"
                                                stroke="none"
                                                fill="#0f172a"
                                                fillOpacity={0.4}
                                                activeDot={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="predictedDemand"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorDemand)"
                                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#1e293b' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                            {/* Reference lines for context */}
                                            <ReferenceLine
                                                y={selectedForecast.reorderPoint}
                                                stroke="#f59e0b"
                                                strokeDasharray="5 5"
                                                label={{ position: 'right', value: 'RP', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Algorithm Details Collapsible */}
                            <details className="bg-white/5 rounded-xl overflow-hidden border border-white/10 group">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 list-none">
                                    <div className="flex items-center space-x-3">
                                        <Layers className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-semibold text-white">Methodology & Logic</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="p-4 pt-0 border-t border-white/5 space-y-4">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 text-xs font-medium">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">WMA Component:</span>
                                            <span className="text-white">{(selectedForecast.wmaDemand || 0).toFixed(2)} units</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">SES Component:</span>
                                            <span className="text-white">{(selectedForecast.sesDemand || 0).toFixed(2)} units</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Confidence Score:</span>
                                            <span className="text-white">{(selectedForecast.confidenceScore * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Data Points Used:</span>
                                            <span className="text-white">{selectedForecast.dataPointsUsed} days</span>
                                        </div>
                                        <div className="col-span-2 border-t border-white/5 pt-3 flex justify-between">
                                            <span className="text-slate-500">Calculation Method:</span>
                                            <span className="text-primary italic">{selectedForecast.method}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-lg text-[11px] text-slate-300 leading-relaxed border border-primary/20 flex items-start space-x-2">
                                        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <p>This forecast combines Weighted Moving Average (recency) with Simple Exponential Smoothing (adaptive) to balance stability and responsiveness. Confidence is higher when demand volatility is low and data volume is high.</p>
                                    </div>
                                </div>
                            </details>

                            {/* Warnings */}
                            {selectedForecast.warnings?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Alerts & Observations</h3>
                                    {selectedForecast.warnings.map((warning, i) => (
                                        <div key={i} className="flex items-center space-x-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-200">
                                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                                            <span>{warning}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                                <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12"
                                    onClick={() => refreshProductForecast(selectedForecast.productId._id)}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Recalculate Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-white/10 hover:bg-white/5 h-12"
                                    onClick={() => handleCreatePO(selectedForecast)}
                                >
                                    <ShoppingCart className={`w-4 h-4 mr-2`} />
                                    Plan Purchase
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {/* Modals */}
            <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                prefilledProduct={{
                    _id: selectedForecast?.productId?._id,
                    name: selectedForecast?.productId?.name,
                    sku: selectedForecast?.productId?.sku,
                    costPrice: selectedForecast?.productId?.costPrice,
                    supplierName: selectedForecast?.productId?.supplierName,
                    vendorId: selectedForecast?.productId?.vendorId,
                    reorderQuantity: selectedForecast?.suggestedOrderQty || Math.max(1, selectedForecast?.reorderQuantity || Math.ceil(selectedForecast?.ensembleDemand * 30))
                }}
            />
        </div>
    );
};

export default ForecastPage;
