import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';

const SkeletonCard = ({ h = "h-64" }) => (
    <div className={`bg-surface border border-white/5 rounded-xl p-5 animate-pulse ${h}`}></div>
);

const InventoryHealthTab = () => {
    const { inventoryHealth, isLoading, error, fetchInventoryHealth } = useAnalytics();

    if (error) {
         return (
             <div className="flex flex-col items-center justify-center p-10 text-slate-400 bg-surface rounded-xl border border-white/5">
                 <AlertCircle size={48} className="text-red-500 mb-4" />
                 <p>Failed to load inventory health data.</p>
                 <button onClick={fetchInventoryHealth} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90">Retry</button>
             </div>
         );
    }

    if (isLoading.health || !inventoryHealth) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard h="h-80" /><SkeletonCard h="h-80" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SkeletonCard h="h-96" /><SkeletonCard h="h-96" /><SkeletonCard h="h-96" />
                </div>
            </div>
        );
    }

    const { categoryBreakdown, fastMovingProducts, slowMovingProducts, deadStockProducts, expiryRisk } = inventoryHealth;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ROW 1: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-white/10 rounded-xl p-5 h-[400px]">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Category Overview</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <RadarChart data={categoryBreakdown}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="categoryName" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748B' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} />
                            <Radar name="Products" dataKey="productCount" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} />
                            <Radar name="Low Stock" dataKey="lowStockCount" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-surface border border-white/10 rounded-xl p-5 h-[400px]">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Stock Value by Category</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart layout="vertical" data={categoryBreakdown} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                            <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="categoryName" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                            <Tooltip cursor={{ fill: '#1E293B' }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                            <Bar dataKey="totalValue" radius={[0, 4, 4, 0]}>
                                {categoryBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 2: Product Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fast Moving */}
                <div className="bg-surface border border-white/10 rounded-xl p-5 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">🔥 Fast Moving</h3>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 text-right">Out/Day</th>
                                    <th className="px-4 py-3 text-right">Days Left</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {fastMovingProducts.map(p => (
                                    <tr key={p.sku} className={`hover:bg-white/5 ${p.daysUntilStockout < 7 ? 'text-red-400' : 'text-slate-200'}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium line-clamp-1 truncate max-w-[120px]">{p.name}</div>
                                            <div className="text-xs opacity-60 font-mono">{p.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">{p.avgDailyOut.toFixed(1)}</td>
                                        <td className="px-4 py-3 text-right">{p.daysUntilStockout}</td>
                                    </tr>
                                ))}
                                {fastMovingProducts.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No fast moving data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Slow Moving */}
                <div className="bg-surface border border-white/10 rounded-xl p-5 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">🐌 Slow Moving</h3>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 text-right">Total Out</th>
                                    <th className="px-4 py-3 text-right">Stock Val</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {slowMovingProducts.map(p => (
                                    <tr key={p.sku} className="hover:bg-white/5 text-slate-200 text-amber-500">
                                        <td className="px-4 py-3">
                                            <div className="font-medium line-clamp-1 truncate max-w-[120px]">{p.name}</div>
                                            <div className="text-xs opacity-60 font-mono">{p.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">{p.totalOutQty}</td>
                                        <td className="px-4 py-3 text-right">₹{p.stockValue}</td>
                                    </tr>
                                ))}
                                {slowMovingProducts.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No slow moving data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dead Stock */}
                <div className="bg-surface border border-white/10 rounded-xl p-5 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">💀 Dead Stock (30d+)</h3>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/5">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 text-right">Age (d)</th>
                                    <th className="px-4 py-3 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {deadStockProducts.map(p => (
                                    <tr key={p.sku} className="hover:bg-white/5 text-slate-400">
                                        <td className="px-4 py-3">
                                            <div className="font-medium line-clamp-1 truncate max-w-[120px] text-slate-300">{p.name}</div>
                                            <div className="text-xs font-mono">{p.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-400 font-bold">{p.daysSinceLastMovement}</td>
                                        <td className="px-4 py-3 text-right">₹{p.stockValue}</td>
                                    </tr>
                                ))}
                                {deadStockProducts.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No dead stock</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ROW 3: Expiry Risk */}
            {expiryRisk && expiryRisk.length > 0 && (
                <div className="bg-surface border border-red-500/20 rounded-xl p-5 bg-red-500/5">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center">⚠️ Expiry Risk (Next 30 Days)</h3>
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1E293B] text-slate-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Stock</th>
                                    <th className="px-4 py-3 text-right">Value</th>
                                    <th className="px-4 py-3 text-right">Days Left</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {expiryRisk.map(p => (
                                    <tr key={p.sku} className="text-slate-300">
                                        <td className="px-4 py-3 font-bold">{p.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                                        <td className="px-4 py-3 text-right">{p.currentStock}</td>
                                        <td className="px-4 py-3 text-right">₹{p.stockValue}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${p.daysUntilExpiry < 7 ? 'text-red-500' : 'text-amber-500'}`}>
                                            {p.daysUntilExpiry}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryHealthTab;
