import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useAnalytics } from '../../context/AnalyticsContext';
import { ArrowUpDown, AlertCircle } from 'lucide-react';

const COLORS = {
    PURCHASE_ORDER: '#6366F1', // indigo
    SALES: '#06B6D4', // cyan
    MANUAL: '#94A3B8', // gray
    RETURN: '#10B981', // green
    ADJUSTMENT: '#F59E0B', // amber
    DAMAGED: '#EF4444', // red
    EXPIRED: '#F97316' // orange
};

const SkeletonCard = ({ h = "h-64" }) => (
    <div className={`bg-surface border border-white/5 rounded-xl p-5 animate-pulse ${h}`}></div>
);

const TransactionsTab = () => {
    const { transactionReport, groupBy, setGroupBy, isLoading, error, fetchTransactionReport } = useAnalytics();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-slate-400 bg-surface rounded-xl border border-white/5">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p>Failed to load transaction data.</p>
                <button onClick={fetchTransactionReport} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90">Retry</button>
            </div>
        );
    }

    if (isLoading.transactions || !transactionReport) {
        return (
            <div className="space-y-6">
                <SkeletonCard h="h-96" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard h="h-80" /><SkeletonCard h="h-80" />
                </div>
                <SkeletonCard h="h-48" />
                <SkeletonCard h="h-96" />
            </div>
        );
    }

    const { timeline, byProduct, byReferenceType, byHandler, hourlyPattern, weekdayPattern } = transactionReport;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ROW 1: Timeline */}
            <div className="bg-surface border border-white/10 rounded-xl p-5 h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-200">Transaction Timeline</h3>
                    <select 
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="bg-[#0F172A] border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
                    >
                        <option value="day">Daily</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="totalIn" name="Stock In" fill="#10B981" stroke="#10B981" fillOpacity={0.15} />
                        <Area type="monotone" dataKey="totalOut" name="Stock Out" fill="#EF4444" stroke="#EF4444" fillOpacity={0.15} />
                        <Line type="monotone" dataKey="netMovement" name="Net Movement" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* ROW 2: Reference Types & Handlers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-white/10 rounded-xl p-5 h-[350px]">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">By Reference Type</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie data={byReferenceType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count">
                                {byReferenceType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.referenceType] || COLORS.MANUAL} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#F8FAFC' }} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-surface border border-white/10 rounded-xl p-5 h-[350px]">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Top Handlers</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart layout="vertical" data={byHandler.slice(0, 10)} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                            <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                            <Tooltip cursor={{ fill: '#1E293B' }} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                            <Bar dataKey="totalIn" name="IN" stackId="a" fill="#10B981" />
                            <Bar dataKey="totalOut" name="OUT" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 3: Heatmaps */}
            <div className="bg-surface border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-slate-200 mb-6">Activity Patterns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hourly */}
                    <div>
                        <p className="text-sm font-medium text-slate-400 mb-3">Transactions by Hour (0-23)</p>
                        <div className="flex w-full gap-1 flex-wrap">
                            {Array.from({ length: 24 }).map((_, i) => {
                                const h = hourlyPattern.find(p => p.hour === i);
                                const maxH = Math.max(...hourlyPattern.map(p => p.count), 1);
                                const opacity = h ? Math.max(0.1, h.count / maxH) : 0.05;
                                return (
                                    <div 
                                        key={i} 
                                        title={`Hour ${i}: ${h ? h.count : 0} tx`}
                                        className="h-10 w-[calc(4.16%-4px)] rounded sm:w-[calc(8.33%-4px)] flex-grow"
                                        style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})`, border: '1px solid rgba(255,255,255,0.05)' }}
                                    ></div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Weekday */}
                    <div>
                        <p className="text-sm font-medium text-slate-400 mb-3">Transactions by Day</p>
                        <div className="flex w-full gap-2 h-10 items-end">
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => {
                                const w = weekdayPattern.find(p => p.weekday === i);
                                const maxW = Math.max(...weekdayPattern.map(p => p.count), 1);
                                const height = w ? `${Math.max(10, (w.count / maxW) * 100)}%` : '5%';
                                
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div 
                                            title={`${d}: ${w ? w.count : 0} tx`}
                                            className="w-full bg-indigo-500 rounded-t transition-all group-hover:bg-indigo-400 items-end"
                                            style={{ height, minHeight: '4px' }}
                                        />
                                        <span className="text-[10px] text-slate-500 uppercase">{d}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 4: Table */}
            <div className="bg-surface border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center">
                    <ArrowUpDown size={18} className="mr-2 text-indigo-400" />
                    Top Active Products
                </h3>
                <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#1E293B] text-slate-300 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3 text-right">Transactions</th>
                                <th className="px-4 py-3 text-right">Total IN</th>
                                <th className="px-4 py-3 text-right">Total OUT</th>
                                <th className="px-4 py-3 text-right">Net Movement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {byProduct.map((p, idx) => (
                                <tr key={p.sku} className="hover:bg-white/5 text-slate-300">
                                    <td className="px-4 py-3 font-bold flex items-center gap-3">
                                        <span className="text-xs text-slate-500">#{idx + 1}</span>
                                        {p.name}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                                    <td className="px-4 py-3 text-right">{p.transactionCount}</td>
                                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">+{p.totalIn}</td>
                                    <td className="px-4 py-3 text-right text-red-400 font-medium">-{p.totalOut}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${p.netMovement > 0 ? 'text-emerald-400' : p.netMovement < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                        {p.netMovement > 0 ? '+' : ''}{p.netMovement}
                                    </td>
                                </tr>
                            ))}
                            {byProduct.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No transaction data</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionsTab;
