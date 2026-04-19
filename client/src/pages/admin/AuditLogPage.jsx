import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ChevronLeft, ChevronRight, Clock, User, Shield, Activity, AlertTriangle, CheckCircle, XCircle, Package, ShoppingCart, BarChart3, Bell } from 'lucide-react';
import auditService from '../../services/auditService';
import toast from 'react-hot-toast';

// Maps backend 'resource' field to display style
const RESOURCE_COLORS = {
    Product: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: Package },
    User: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', icon: Shield },
    PurchaseOrder: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: ShoppingCart },
    Category: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: BarChart3 },
    Alert: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', icon: Bell },
    System: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', icon: Activity },
};

// Maps backend 'severity' field to display style
const SEVERITY_COLORS = {
    INFO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
    WARNING: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
    CRITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-400', icon: XCircle },
};

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        category: '',
        action: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => { fetchLogs(); fetchStats(); }, []);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filters.search) params.search = filters.search;
            if (filters.category) params.resource = filters.category;
            if (filters.action) params.action = filters.action;
            if (filters.status) params.severity = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            const data = await auditService.getLogs(params);
            setLogs(data.logs || []);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (e) { toast.error('Failed to load audit logs'); }
        setLoading(false);
    };

    const fetchStats = async () => {
        try { const data = await auditService.getStats(); setStats(data); }
        catch (e) { /* silent */ }
    };

    const applyFilters = () => { fetchLogs(1); };

    const timeAgo = (d) => {
        const s = Math.floor((new Date() - new Date(d)) / 1000);
        if (s < 60) return `${s}s ago`;
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    return (
        <div className="p-6">
            {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                Audit Logs
                            </h1>
                            <p className="text-slate-400 mt-2">Track every important action across the system</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total Events', value: stats.totalLogs?.toLocaleString() || '0', icon: Activity, color: 'from-indigo-500 to-indigo-600' },
                                { label: 'Actions Tracked', value: Object.keys(stats.byAction || {}).length?.toString() || '0', icon: Clock, color: 'from-emerald-500 to-emerald-600' },
                                { label: 'Active Users', value: stats.mostActiveUsers?.length?.toString() || '0', icon: BarChart3, color: 'from-cyan-500 to-cyan-600' },
                                { label: 'Critical Events', value: stats.criticalEvents?.length?.toString() || '0', icon: AlertTriangle, color: 'from-rose-500 to-rose-600' },
                            ].map((card, i) => (
                                <div key={i} className="bg-surface rounded-xl border border-white/5 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</span>
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                                            <card.icon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{card.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-surface rounded-xl border border-white/5 mb-6">
                        <div className="p-4 flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <Filter className="w-4 h-4" /> Filters
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                        {showFilters && (
                            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/5 pt-4">
                                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                                    <option value="">All Resources</option>
                                    {Object.keys(RESOURCE_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                                    <option value="">All Severity</option>
                                    <option value="INFO">Info</option>
                                    <option value="WARNING">Warning</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Logs Table */}
                    <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-slate-500 animate-pulse">Loading audit logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No audit logs found</p>
                                <p className="text-slate-500 text-sm mt-1">Adjust your filters or check back later</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource Name</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {logs.map(log => {
                                            const resStyle = RESOURCE_COLORS[log.resource] || RESOURCE_COLORS.System;
                                            const sevStyle = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.INFO;
                                            const ResIcon = resStyle.icon;
                                            const SevIcon = sevStyle.icon;
                                            const userName = log.userId?.name || 'System';
                                            return (
                                                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-5 py-4">
                                                        <span className="text-sm font-medium text-white">{log.action.replace(/_/g, ' ')}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${resStyle.bg} ${resStyle.text} border ${resStyle.border}`}>
                                                            <ResIcon className="w-3 h-3" /> {log.resource || 'System'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center">
                                                                <User className="w-3.5 h-3.5 text-indigo-400" />
                                                            </div>
                                                            <span className="text-sm text-slate-300">{userName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-xs">
                                                        <p className="text-sm text-slate-400 truncate">{log.resourceName || '—'}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${sevStyle.bg} ${sevStyle.text}`}>
                                                            <SevIcon className="w-3 h-3" /> {log.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs text-slate-500 whitespace-nowrap" title={new Date(log.timestamp).toLocaleString()}>
                                                            {timeAgo(log.timestamp)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                                <span className="text-sm text-slate-500">
                                    Page {pagination.page} of {pagination.pages} · {pagination.total} total
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchLogs(pagination.page - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => fetchLogs(pagination.page + 1)}
                                        disabled={!pagination.hasNext}
                                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
        </div>
    );
};

export default AuditLogPage;
