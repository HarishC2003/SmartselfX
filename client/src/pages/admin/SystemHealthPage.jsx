import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Server, Database, Cpu, RefreshCw, CheckCircle, XCircle, AlertTriangle, Zap, Mail } from 'lucide-react';
import healthService from '../../services/healthService';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
    const styles = {
        healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle, label: 'Healthy' },
        unhealthy: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', icon: XCircle, label: 'Down' },
        degraded: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: AlertTriangle, label: 'Degraded' },
        configured: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: CheckCircle, label: 'Configured' },
        not_configured: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: AlertTriangle, label: 'Not Setup' },
    };
    const s = styles[status] || styles.unhealthy;
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${s.bg} ${s.text} border ${s.border}`}>
            <Icon className="w-3.5 h-3.5" /> {s.label}
        </span>
    );
};

const SystemHealthPage = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        try {
            const data = await healthService.getHealth();
            setHealth(data);
            setLastChecked(new Date());
        } catch (e) {
            toast.error('Failed to fetch system health');
            setHealth({ status: 'error', services: {} });
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchHealth(); }, [fetchHealth]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchHealth]);

    const formatUptime = (seconds) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    };

    const overallStatus = health?.status || 'unhealthy';
    const overallColor = overallStatus === 'healthy' ? 'from-emerald-500 to-emerald-600' : overallStatus === 'degraded' ? 'from-amber-500 to-amber-600' : 'from-rose-500 to-rose-600';

    if (!health) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-emerald-500">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">Checking System Vitals...</p>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        System Health
                    </h1>
                    <p className="text-slate-400 mt-2">Monitor service status and system performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${autoRefresh ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-surface text-slate-400 hover:text-white border border-white/10'}`}
                    >
                        <Zap className="w-4 h-4" /> {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
                    </button>
                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-semibold hover:from-indigo-500 hover:to-indigo-400 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>



                    {/* Overall Status Banner */}
                    {health && (
                        <div className={`bg-gradient-to-r ${overallColor} rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIHI9IjIiLz48L2c+PC9zdmc+')] opacity-50" />
                            <div className="relative flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        {overallStatus === 'healthy' ? <CheckCircle className="w-8 h-8 text-white" /> : <AlertTriangle className="w-8 h-8 text-white" />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white capitalize">System {overallStatus}</h2>
                                        <p className="text-white/70 text-sm mt-1">
                                            {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Checking...'} · Response: {health.responseTime || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-white">{health.uptime ? formatUptime(health.uptime) : '–'}</p>
                                        <p className="text-xs text-white/60 uppercase tracking-wide">Uptime</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Cards Grid */}
                    {health?.services && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* MongoDB */}
                            {health.services.mongodb && (
                                <div className="bg-surface rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                                <Database className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">MongoDB</h3>
                                                <p className="text-xs text-slate-500">Primary Database</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={health.services.mongodb.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">State</p>
                                            <p className="text-sm font-semibold text-white capitalize">{health.services.mongodb.state}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Latency</p>
                                            <p className="text-sm font-semibold text-white">{health.services.mongodb.latency}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Host</p>
                                            <p className="text-sm font-semibold text-white truncate">{health.services.mongodb.host}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Database</p>
                                            <p className="text-sm font-semibold text-white">{health.services.mongodb.name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Forecast Service */}
                            {health.services.forecast && (
                                <div className="bg-surface rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                                <Cpu className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">AI Forecast Engine</h3>
                                                <p className="text-xs text-slate-500">Python FastAPI Microservice</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={health.services.forecast.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">URL</p>
                                            <p className="text-sm font-semibold text-white truncate">{health.services.forecast.url}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Latency</p>
                                            <p className="text-sm font-semibold text-white">{health.services.forecast.latency || 'N/A'}</p>
                                        </div>
                                        {health.services.forecast.status === 'unhealthy' && (
                                            <div className="col-span-2 bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                                                <p className="text-xs text-rose-400 font-medium">{health.services.forecast.error}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Server Info */}
                            {health.services.server && (
                                <div className="bg-surface rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                                                <Server className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Application Server</h3>
                                                <p className="text-xs text-slate-500">Node.js Express</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={health.services.server.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Node Version</p>
                                            <p className="text-sm font-semibold text-white">{health.services.server.nodeVersion}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Platform</p>
                                            <p className="text-sm font-semibold text-white">{health.services.server.platform} ({health.services.server.arch})</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">CPU Cores</p>
                                            <p className="text-sm font-semibold text-white">{health.services.server.cpu?.cores}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Heap Usage</p>
                                            <p className="text-sm font-semibold text-white">{health.services.server.memory?.processHeap}</p>
                                        </div>
                                    </div>
                                    {/* Memory Bar */}
                                    <div className="mt-4 bg-background/50 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-slate-500">Memory Usage</p>
                                            <p className="text-xs font-semibold text-white">{health.services.server.memory?.usage}</p>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: health.services.server.memory?.usage || '0%' }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                                            <span>Free: {health.services.server.memory?.free}</span>
                                            <span>Total: {health.services.server.memory?.total}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            {health.services.email && (
                                <div className="bg-surface rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                                <Mail className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Email Service</h3>
                                                <p className="text-xs text-slate-500">SMTP Configuration</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={health.services.email.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">SMTP Host</p>
                                            <p className="text-sm font-semibold text-white">{health.services.email.host}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">Port</p>
                                            <p className="text-sm font-semibold text-white">{health.services.email.port}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
        </div>
    );
};

export default SystemHealthPage;
