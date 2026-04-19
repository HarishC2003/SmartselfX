import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AlertCircle, TrendingUp, Package, Tag } from 'lucide-react';

const SkeletonCard = ({ h = "h-64" }) => (
    <div className={`bg-surface border border-white/5 rounded-xl p-5 animate-pulse ${h}`}></div>
);

const CategoriesTab = () => {
    const { categoryReport, isLoading, error, fetchCategoryReport } = useAnalytics();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-slate-400 bg-surface rounded-xl border border-white/5">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p>Failed to load category mapping data.</p>
                <button onClick={fetchCategoryReport} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90">Retry</button>
            </div>
        );
    }

    if (isLoading.categories || !categoryReport) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SkeletonCard h="h-48" /><SkeletonCard h="h-48" /><SkeletonCard h="h-48" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard h="h-96" /><SkeletonCard h="h-96" />
                </div>
            </div>
        );
    }

    const { categories } = categoryReport;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ROW 1: Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat, i) => {
                    const okCount = cat.productCount - cat.lowStockCount - cat.outOfStockCount;
                    return (
                        <div key={cat.categoryId || i} className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
                            <div className="h-1.5 w-full" style={{ backgroundColor: cat.color || '#6366F1' }}></div>
                            <div className="p-5 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color || '#6366F1'}20`, color: cat.color || '#6366F1' }}>
                                            <Tag size={18} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-100">{cat.name}</h3>
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                        <TrendingUp size={12} className="mr-1" />
                                        {cat.totalOutQty} OUT
                                    </div>
                                </div>
                                <div className="border-t border-b border-white/5 py-3 my-3 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Products</p>
                                        <p className="text-xl font-bold text-white flex items-center">
                                            {cat.productCount} <Package size={14} className="ml-1 text-slate-400" />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Stock Value</p>
                                        <p className="text-xl font-bold text-emerald-400">₹{cat.totalStockValue.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-xs font-medium my-3">
                                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">🔴 {cat.outOfStockCount} OOS</span>
                                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">🟡 {cat.lowStockCount} Low</span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ {okCount} OK</span>
                                </div>
                                {cat.topProduct && (
                                    <div className="mt-4 text-sm bg-[#0F172A] p-2 rounded border border-[#1E293B]">
                                        <span className="text-slate-500 text-xs uppercase block font-bold mb-1">Top Value Product</span>
                                        <span className="text-slate-300 font-medium">{cat.topProduct.name}</span>
                                        <span className="text-indigo-400 float-right font-bold">₹{cat.topProduct.stockValue.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ROW 2: Comparison & Spend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Comparison Radar */}
                <div className="bg-surface border border-white/10 rounded-xl p-5 h-[450px]">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Metric Spread Analysis</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <RadarChart data={categories}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748B' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} />
                            <Radar name="Stock Value" dataKey="totalStockValue" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                            <Radar name="OUT Vol" dataKey="totalOutQty" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.4} />
                            <Radar name="PO Count" dataKey="poCount" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                            <Legend verticalAlign="bottom" height={36} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Categories vs PO Spend */}
                <div className="bg-surface border border-white/10 rounded-xl p-5 h-[450px]">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Investment vs Inventory Value</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={categories} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => '₹'+v} />
                            <Tooltip cursor={{ fill: '#1E293B' }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Bar dataKey="totalStockValue" name="Current Stock Value" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="poValue" name="Total PO Spend" fill="#6366F1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CategoriesTab;
