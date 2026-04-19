import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    Package,
    Tags,
    Layers,
    ArrowRightLeft,
    Brain,
    ShoppingCart,
    Bell,
    BarChart3,
    Users,
    Settings,
    Store,
    Zap,
    LogOut,
    X,
    FileText,
    Activity,
    Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';
import { useForecast } from '@/context/ForecastContext';
import { usePurchaseOrders } from '@/context/PurchaseOrderContext';
import { Badge } from '@/components/ui/Badge';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const { unreadCount } = useAlert() || { unreadCount: 0 };
    const { summary } = useForecast() || { summary: null };
    const { stats } = usePurchaseOrders() || { stats: null };

    const role = user?.role || 'VENDOR';
    const criticalRiskCount = summary?.criticalRisk || 0;
    const pendingPoCount = stats?.byStatus?.PENDING || 0;
    const urgentRestockCount = stats?.aiSuggestedCount || 0;

    const menuGroups = [
        {
            label: 'Main',
            roles: ['ADMIN', 'MANAGER', 'VENDOR'],
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'VENDOR'] },
            ]
        },
        {
            label: 'User Management',
            roles: ['ADMIN'],
            items: [
                { name: 'Users', path: '/users', icon: Users, roles: ['ADMIN'] },
            ]
        },
        {
            label: 'Product Management',
            roles: ['ADMIN'],
            items: [
                { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN'] },
                { name: 'Categories', path: '/categories', icon: Layers, roles: ['ADMIN'] },
            ]
        },
        {
            label: 'Inventory Control',
            roles: ['MANAGER'],
            items: [
                { name: 'Products', path: '/products', icon: Package, roles: ['MANAGER'] },
                { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft, roles: ['MANAGER'] },
                { name: 'Alerts', path: '/alerts', icon: Bell, roles: ['MANAGER'] },
            ]
        },
        {
            label: 'Inventory',
            roles: ['ADMIN'],
            items: [
                { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft, roles: ['ADMIN'] },
                { name: 'Alerts', path: '/alerts', icon: Bell, roles: ['ADMIN'] },
            ]
        },
        {
            label: 'Intelligence',
            roles: ['ADMIN', 'MANAGER'],
            items: [
                { name: 'AI Forecast', path: '/forecast', icon: Brain, roles: ['ADMIN', 'MANAGER'] },
                { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER'] },
                { name: 'AI Recommendations', path: '/purchase-orders/recommendations', icon: Zap, roles: ['ADMIN'] },
                { name: 'Restock Suggestions', path: '/purchase-orders/recommendations', icon: Zap, roles: ['MANAGER'] },
            ]
        },
        {
            label: 'Analytics',
            roles: ['ADMIN', 'MANAGER'],
            items: [
                { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
                { name: 'Inventory Report', path: '/analytics/inventory', icon: Package, roles: ['ADMIN', 'MANAGER'] },
                { name: 'Vendor Report', path: '/analytics/vendors', icon: Store, roles: ['ADMIN'] },
                { name: 'Vendor Declarations', path: '/vendor-declarations', icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
            ]
        },
        {
            label: 'Vendor Portal',
            roles: ['VENDOR'],
            items: [
                { name: 'My Orders', path: '/vendor-portal', icon: Store, roles: ['VENDOR'] },
                { name: 'My Stock', path: '/vendor-portal/my-stock', icon: Package, roles: ['VENDOR'] },
            ]
        },
        {
            label: 'System',
            roles: ['ADMIN', 'MANAGER', 'VENDOR'],
            items: [
                { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER', 'VENDOR'] },
                { name: 'Audit Log', path: '/audit-logs', icon: FileText, roles: ['ADMIN'] },
            ]
        }
    ];

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    };

    return (
        <aside id="tour-sidebar" className={`fixed left-0 top-0 h-screen w-64 bg-surface border-r border-white/5 flex flex-col z-20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

            {/* Brand Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-primary tracking-tight">SmartShelfX</h1>
                    <span className="ml-2 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">v1.0</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 lg:hidden text-slate-400 hover:text-white rounded-md hover:bg-white/5"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* User Profile Mini Card */}
            <div className="p-4 mx-4 mt-4 bg-background/50 rounded-xl border border-white/5 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                    <Badge variant={role} className="mt-1 scale-90 origin-left">{role}</Badge>
                </div>
            </div>

            {/* Quick Search Button */}
            <div className="mx-4 mt-3">
                <button
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                        document.dispatchEvent(event);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-background/50 border border-white/5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">Quick search...</span>
                    <kbd className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-white/10 font-mono">⌘K</kbd>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                {menuGroups.map((group, idx) => {
                    if (!group.roles.includes(role)) return null;

                    const visibleItems = group.items.filter(item => item.roles.includes(role));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} className="space-y-1">
                            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {group.label}
                            </h3>
                            {visibleItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                    flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${isActive
                                            ? 'bg-primary/20 text-primary border-l-2 border-primary'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                        }
                  `}
                                >
                                    <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-colors ${location.pathname === item.path ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'
                                        }`} />
                                    <span className="font-medium text-sm flex-1">{item.name}</span>
                                    {item.name === 'Alerts' && unreadCount > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    {item.name === 'AI Forecast' && criticalRiskCount > 0 && (
                                        <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                                            {criticalRiskCount}
                                        </span>
                                    )}
                                    {(item.name === 'Purchase Orders' || item.name === 'My Orders') && pendingPoCount > 0 && (
                                        <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
                                            {pendingPoCount > 99 ? '99+' : pendingPoCount}
                                        </span>
                                    )}
                                    {item.name === 'AI Restock' && urgentRestockCount > 0 && (
                                        <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
                                            {urgentRestockCount > 99 ? '99+' : urgentRestockCount}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Footer Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-400 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors group"
                >
                    <LogOut className="h-5 w-5 mr-3 text-slate-500 group-hover:text-danger transition-colors" />
                    Sign Out
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;
