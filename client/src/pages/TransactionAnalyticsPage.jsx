import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Calendar, RefreshCw, BarChart2, PieChart as PieChartIcon, Activity, Key } from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';
import { Loader } from '../components/ui/Loader';

const COLORS = {
    PURCHASE_ORDER: '#6366f1', // indigo
    SALES: '#06b6d4',          // cyan
    MANUAL: '#94a3b8',         // gray
    RETURN: '#22c55e',         // green
    ADJUSTMENT: '#f59e0b',     // amber
    DAMAGED: '#ef4444',        // red
    EXPIRED: '#f97316'         // orange
};

export default function TransactionAnalyticsPage() {
    const navigate = useNavigate();
    const { fetchSummary } = useTransaction();
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [preset, setPreset] = useState('Last 30 Days');
    const [customRange, setCustomRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const loadSummary = async (startDate, endDate) => {
        setIsLoading(true);
        try {
            const data = await fetchSummary({ startDate, endDate, groupBy: 'day' });
            setSummary(data.summary);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let start = '';
        let end = todayStr;

        switch (preset) {
            case 'Today':
                start = todayStr;
                break;
            case 'Last 7 Days':
                const d7 = new Date();
                d7.setDate(today.getDate() - 7);
                start = d7.toISOString().split('T')[0];
                break;
            case 'Last 30 Days':
                const d30 = new Date();
                d30.setDate(today.getDate() - 30);
                start = d30.toISOString().split('T')[0];
                break;
            case 'This Month':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]; // Can cap to today, backend handles ranges cleanly
                break;
            case 'Custom Range':
                start = customRange.startDate;
                end = customRange.endDate;
                break;
            default:
                break;
        }

        if (start && end) {
            loadSummary(start, end);
        }
    }, [preset, customRange]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePresetChange = (p) => {
        setPreset(p);
    };

    const handleCustomDateChange = (e) => {
        setCustomRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Format Data for Recharts
    const areaData = useMemo(() => {
        if (!summary?.byDate) return [];
        return summary.byDate.map(d => ({
            date: d.date,
            'Stock In': d.totalIn || 0,
            'Stock Out': d.totalOut || 0,
            'Net Movement': (d.totalIn || 0) - (d.totalOut || 0)
        }));
    }, [summary]);

    const productData = useMemo(() => {
        if (!summary?.byProduct) return [];
        return summary.byProduct
            .map(p => ({
                id: p.productId,
                name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                sku: p.sku,
                total: (p.totalIn || 0) + (p.totalOut || 0),
                'Stock In': p.totalIn || 0,
                'Stock Out': p.totalOut || 0
            }))
            .sort((a, b) => b.total - a.total);
    }, [summary]);

    const pieData = useMemo(() => {
        if (!summary?.byReferenceType) return [];
        return summary.byReferenceType.map(r => ({
            name: r.referenceType,
            value: r.count
        }));
    }, [summary]);

    // Custom Tooltip for Area Chart
    const CustomAreaTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm mt-1">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-bold text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom Tooltip for Pie Chart
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                        <span className="text-white font-medium">{payload[0].name.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="mt-1 text-slate-300">
                        Total Count: <span className="font-bold text-white">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (isLoading && !summary) {
        return <Loader fullScreen />;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

            {/* Header + Date Range Selector */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[#1E293B] p-6 rounded-2xl border border-white/5 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <Activity className="w-6 h-6 text-indigo-400" /> Transaction Analytics
                    </h1>
                    <p className="text-slate-400 mt-1">Visualize and analyze inventory movement trends</p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                        {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom Range'].map(p => (
                            <button
                                key={p}
                                onClick={() => handlePresetChange(p)}
                                className={`px-3 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${preset === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {preset === 'Custom Range' && (
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 flex-1 min-w-[250px]">
                            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                            <input
                                type="date"
                                name="startDate"
                                value={customRange.startDate}
                                onChange={handleCustomDateChange}
                                className="bg-transparent text-sm text-white outline-none w-full [&::-webkit-calendar-picker-indicator]:opacity-50"
                            />
                            <span className="text-slate-500 font-bold px-1">→</span>
                            <input
                                type="date"
                                name="endDate"
                                value={customRange.endDate}
                                onChange={handleCustomDateChange}
                                className="bg-transparent text-sm text-white outline-none w-full [&::-webkit-calendar-picker-indicator]:opacity-50"
                            />
                        </div>
                    )}
                </div>
            </div>

            {isLoading && summary ? (
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 animate-pulse w-1/3 rounded-full" />
                </div>
            ) : null}

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* CHART 1: Stock Movement Over Time (Full Width) */}
                <div className="col-span-1 lg:col-span-12 bg-[#1E293B] rounded-2xl border border-white/5 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-indigo-400" /> Stock Movement Over Time
                        </h2>
                        <div className="flex gap-4">
                            <span className="text-sm">Total In: <span className="font-bold text-emerald-400">{summary?.totalIn || 0}</span></span>
                            <span className="text-sm">Total Out: <span className="font-bold text-rose-400">{summary?.totalOut || 0}</span></span>
                            <span className="text-sm hidden sm:inline">Net: <span className="font-bold text-white">{(summary?.totalIn || 0) - (summary?.totalOut || 0)}</span></span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        {areaData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <RechartsTooltip content={<CustomAreaTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="Stock In" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                                    <Area type="monotone" dataKey="Stock Out" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                <RefreshCw className="w-8 h-8 mb-3 opacity-20" />
                                <p>No movement data for this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* CHART 2: Top 10 Active Products (60% width on large screens) */}
                <div className="col-span-1 lg:col-span-7 bg-[#1E293B] rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-indigo-400" /> Top 10 Most Active Products
                    </h2>
                    <div className="flex-1 min-h-[400px]">
                        {productData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={productData}
                                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                                    barSize={12}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={12} width={140} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Stock In" fill="#10b981" radius={[0, 4, 4, 0]} onClick={(data) => navigate(`/products/${data.id}`)} className="cursor-pointer hover:opacity-80" />
                                    <Bar dataKey="Stock Out" fill="#f43f5e" radius={[0, 4, 4, 0]} onClick={(data) => navigate(`/products/${data.id}`)} className="cursor-pointer hover:opacity-80" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                <Package2 className="w-8 h-8 mb-3 opacity-20" />
                                <p>No active products</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* CHART 3: Reference Types Pie Chart (40% width) */}
                <div className="col-span-1 lg:col-span-5 bg-[#1E293B] rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-indigo-400" /> By Reference Type
                        </h2>
                    </div>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.MANUAL} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={100}
                                        content={(props) => {
                                            const { payload } = props;
                                            return (
                                                <ul className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-2 gap-y-3 pt-6">
                                                    {payload.map((entry, index) => (
                                                        <li key={`item-${index}`} className="flex items-center text-xs">
                                                            <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-slate-300 truncate font-medium flex-1">
                                                                {entry.value.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-white font-bold ml-1 px-1.5 py-0.5 bg-slate-800 rounded">
                                                                {entry.payload.value}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full justify-center flex flex-col items-center text-slate-500 mt-12">
                                <Key className="w-8 h-8 mb-3 opacity-20" />
                                <p>No reference data</p>
                            </div>
                        )}
                        {/* Donut Center Text */}
                        {pieData.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-10 lg:-mt-20">
                                <span className="text-3xl font-bold text-white">{summary?.totalTransactions || 0}</span>
                                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* CHART 4: Handler Activity Table */}
                <div className="col-span-1 lg:col-span-12 bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden shadow-xl mt-2">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Key className="w-5 h-5 text-indigo-400" /> Handler Activity Summary
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/80 border-b border-white/10 text-xs uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Handler Name</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total IN</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total OUT</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total Transactions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {!summary?.byHandler || summary.byHandler.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            No handler activity found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    summary.byHandler.map((handler, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/20">
                                                        {handler.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-semibold text-white">{handler.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                                                    {handler.role || 'VENDOR'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                                                    +{handler.totalIn || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded">
                                                    -{handler.totalOut || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-white text-lg">
                                                    {handler.count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
