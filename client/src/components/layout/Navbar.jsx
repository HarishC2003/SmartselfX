import React, { useState } from 'react';
import { Bell, Search, Menu, User, Settings, LogOut, CheckCircle, Package2, ArrowRight, Activity, FileText } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';

const Navbar = ({ onMenuClick }) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    };

    const { unreadCount, alerts, fetchAlerts, markAllRead, markRead, dismiss } = useAlert() || { unreadCount: 0, alerts: [] };
    const [showAlertsMenu, setShowAlertsMenu] = useState(false);

    // Format relative time
    const timeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const handleBellClick = () => {
        if (!showAlertsMenu) {
            fetchAlerts({ limit: 5 });
        }
        setShowAlertsMenu(!showAlertsMenu);
        setShowProfileMenu(false);
    };

    const handleSearchClick = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
    };

    const getSeverityBorder = (sev) => {
        switch (sev) {
            case 'CRITICAL': return 'border-l-rose-500';
            case 'HIGH': return 'border-l-amber-500';
            case 'MEDIUM': return 'border-l-yellow-400';
            default: return 'border-l-blue-400';
        }
    };

    const getSeverityColor = (sev) => {
        switch (sev) {
            case 'CRITICAL': return 'text-rose-400 bg-rose-500/10';
            case 'HIGH': return 'text-amber-400 bg-amber-500/10';
            case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10';
            default: return 'text-blue-400 bg-blue-500/10';
        }
    };

    return (
        <header className="h-14 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-10 w-full">

            {/* Left side: Mobile Toggle only */}
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 mr-4 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center space-x-4">

                {/* Search */}
                <div id="tour-search" className="relative group hidden sm:block">
                    <button
                        onClick={handleSearchClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Search className="h-4 w-4" />
                        <span className="text-xs text-slate-500">Search...</span>
                        <kbd className="text-[10px] bg-background px-1.5 py-0.5 rounded border border-white/10 font-mono text-slate-600 ml-4">⌘K</kbd>
                    </button>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        id="tour-bell"
                        onClick={handleBellClick}
                        className="relative p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 border-2 border-slate-900 text-[10px] font-bold text-white animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showAlertsMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowAlertsMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#1e293b] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
                                <div className="px-4 py-3 border-b border-slate-700/80 bg-slate-800/50 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-indigo-400" />
                                        <h3 className="font-semibold text-white">Alerts</h3>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => { markAllRead(); setShowAlertsMenu(false); }}
                                            className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-900/20">
                                    {alerts.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center">
                                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-300">All caught up!</p>
                                            <p className="text-xs text-slate-500 mt-1">No new alerts to show right now.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-700/50">
                                            {alerts.slice(0, 5).map(alert => (
                                                <div
                                                    key={alert._id}
                                                    className={`p-4 border-l-4 ${getSeverityBorder(alert.severity)} ${!alert.isRead ? 'bg-slate-800/40' : 'bg-transparent'} hover:bg-slate-800/80 transition-colors flex flex-col gap-2`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityColor(alert.severity)}`}>
                                                                ● {alert.severity}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-medium">
                                                                {alert.type.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                                                            {timeAgo(alert.createdAt)}
                                                        </span>
                                                    </div>

                                                    <div className="pr-4">
                                                        <p className={`text-sm ${!alert.isRead ? 'text-white font-medium' : 'text-slate-300'} line-clamp-2 leading-relaxed`}>
                                                            {alert.message}
                                                        </p>
                                                        {alert.currentStock !== undefined && (
                                                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                                                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Stock: <strong className="text-white">{alert.currentStock}</strong></span>
                                                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Reorder: <strong className="text-slate-300">{alert.reorderLevel}</strong></span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-1">
                                                        <button
                                                            onClick={async () => {
                                                                if (!alert.isRead) await markRead(alert._id);
                                                                navigate(`/products/${alert.productId?._id}`);
                                                                setShowAlertsMenu(false);
                                                            }}
                                                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                                        >
                                                            <Package2 className="w-3.5 h-3.5" /> View Product
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                dismiss(alert._id);
                                                            }}
                                                            className="text-xs font-medium text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 border-t border-slate-700/80 bg-slate-800/80 shrink-0">
                                    <button
                                        onClick={() => { navigate('/alerts'); setShowAlertsMenu(false); }}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                    >
                                        View All Alerts <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs border border-indigo-400/30 hover:ring-2 hover:ring-indigo-500/50 transition-all">
                            {getInitials(user?.name)}
                        </div>
                    </button>

                    {showProfileMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowProfileMenu(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-2xl border border-white/10 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-white/5">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <User className="h-4 w-4 mr-3" /> Profile
                                    </button>
                                    <button
                                        onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <Settings className="h-4 w-4 mr-3" /> Settings
                                    </button>
                                    {user?.role === 'ADMIN' && (
                                        <>
                                            <button
                                                onClick={() => { navigate('/system-health'); setShowProfileMenu(false); }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                            >
                                                <Activity className="h-4 w-4 mr-3" /> System Health
                                            </button>
                                            <button
                                                onClick={() => { navigate('/audit-logs'); setShowProfileMenu(false); }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                            >
                                                <FileText className="h-4 w-4 mr-3" /> Audit Logs
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="border-t border-white/5 py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 mr-3" /> Sign out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Navbar;
