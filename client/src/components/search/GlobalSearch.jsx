import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ShoppingCart, Users, Bell, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/authService'; // Adjust if you have a specific axios instance

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [totalFlattened, setTotalFlattened] = useState([]);
    
    const inputRef = useRef(null);
    const debounceTimer = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Autofocus when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';
        } else {
            setQuery('');
            setResults(null);
            setSelectedIndex(0);
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    // Keyboard shortcuts to open
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const onClose = () => setIsOpen(false);

    // Handle Search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults(null);
            setTotalFlattened([]);
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/search?q=${encodeURIComponent(query)}&limit=5`);
                setResults(data.results);
                
                // Flatten results for keyboard navigation
                const flat = [];
                if (data.results.products) data.results.products.forEach(p => flat.push({ ...p, group: 'products' }));
                if (data.results.purchaseOrders) data.results.purchaseOrders.forEach(po => flat.push({ ...po, group: 'purchaseOrders' }));
                if (data.results.users) data.results.users.forEach(u => flat.push({ ...u, group: 'users' }));
                if (data.results.alerts) data.results.alerts.forEach(a => flat.push({ ...a, group: 'alerts' }));
                
                setTotalFlattened(flat);
                setSelectedIndex(0);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer.current);
    }, [query]);

    // Keyboard navigation inside modal
    const handleKeyDown = (e) => {
        if (!totalFlattened.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < totalFlattened.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalFlattened.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = totalFlattened[selectedIndex];
            if (selected) handleSelect(selected);
        }
    };

    const handleSelect = (item) => {
        onClose();
        if (item.type === 'product') {
            navigate(`/products/${item.id}`);
        } else if (item.type === 'purchaseOrder') {
            navigate(`/purchase-orders`); // Could pass a state ?filter=${item.poNumber}
        } else if (item.type === 'user') {
            navigate(`/admin/users`);
        } else if (item.type === 'alert') {
            navigate(`/alerts`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 pb-6 px-4">
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-2xl bg-surface border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                
                {/* Search Input Box */}
                <div className="flex items-center px-4 border-b border-slate-700/80 bg-slate-800/50 shrink-0">
                    <Search className="w-5 h-5 text-indigo-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 w-full h-14 px-4 bg-transparent border-none text-white placeholder-slate-400 focus:outline-none focus:ring-0 text-lg"
                        placeholder="Search products, POs, alerts..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {query && (
                        <button 
                            onClick={() => setQuery('')}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <div className="ml-3 hidden sm:flex items-center gap-1">
                        <kbd className="px-2 py-1 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">ESC</kbd>
                    </div>
                </div>

                {/* Results Area */}
                <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-900/50 p-2">
                    
                    {/* Empty State / Hints */}
                    {!query && (
                        <div className="p-8 text-center">
                            <h3 className="text-sm font-semibold text-slate-300 mb-4">Popular Searches</h3>
                            <div className="flex flex-wrap justify-center gap-2">
                                <button onClick={() => setQuery('MacBook')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors">MacBook</button>
                                <button onClick={() => setQuery('PO-')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors">Purchase Orders</button>
                                <button onClick={() => setQuery('Stock')} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors">Low Stock Alerts</button>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && query.length >= 2 && (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 animate-pulse">
                                    <div className="w-10 h-10 bg-slate-700 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-700 rounded w-1/3" />
                                        <div className="h-3 bg-slate-700 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Results Map */}
                    {!loading && query.length >= 2 && results && totalFlattened.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="text-lg">No results for <span className="text-white font-medium">"{query}"</span></p>
                            <p className="text-sm mt-2 opacity-60">Try searching for a different term or sku.</p>
                        </div>
                    )}

                    {/* Actual Results */}
                    {!loading && results && totalFlattened.length > 0 && (
                        <div className="pb-2">
                            
                            {/* Products Group */}
                            {results.products?.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5" /> Products
                                    </div>
                                    <div className="space-y-1">
                                        {results.products.map((p) => {
                                            const isSelected = totalFlattened[selectedIndex]?.id === p.id;
                                            return (
                                                <div 
                                                    key={p.id}
                                                    onClick={() => handleSelect(p)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer group ${isSelected ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                                            {p.imageUrl ? (
                                                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover rounded-md" />
                                                            ) : (
                                                                <Package className="w-4 h-4 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{p.name}</p>
                                                            <p className={`text-xs truncate ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>SKU: {p.sku} • {p.categoryName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isSelected ? 'border-indigo-400 text-white' : 'border-slate-600 text-slate-400'}`}>
                                                            {p.currentStock} in stock
                                                        </span>
                                                        <CornerDownLeft className={`w-3.5 h-3.5 hidden sm:block ${isSelected ? 'text-indigo-200' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Purchase Orders Group */}
                            {results.purchaseOrders?.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingCart className="w-3.5 h-3.5" /> Purchase Orders
                                    </div>
                                    <div className="space-y-1">
                                        {results.purchaseOrders.map((po) => {
                                            const isSelected = totalFlattened[selectedIndex]?.id === po.id;
                                            return (
                                                <div 
                                                    key={po.id}
                                                    onClick={() => handleSelect(po)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer group ${isSelected ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                                            <ShoppingCart className="w-4 h-4 text-slate-300" />
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>{po.poNumber}</p>
                                                            <p className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{po.productName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                            ${po.totalAmount.toLocaleString()}
                                                        </span>
                                                        <CornerDownLeft className={`w-3.5 h-3.5 hidden sm:block ${isSelected ? 'text-indigo-200' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Users Group */}
                            {user?.role === 'ADMIN' && results.users?.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5" /> Users
                                    </div>
                                    <div className="space-y-1">
                                        {results.users.map((u) => {
                                            const isSelected = totalFlattened[selectedIndex]?.id === u.id;
                                            return (
                                                <div 
                                                    key={u.id}
                                                    onClick={() => handleSelect(u)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer group ${isSelected ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? 'bg-indigo-500 text-white' : 'bg-amber-600 text-white'}`}>
                                                            {u.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>{u.name}</p>
                                                            <p className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-indigo-500/50 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                                            {u.role}
                                                        </span>
                                                        <CornerDownLeft className={`w-3.5 h-3.5 hidden sm:block ${isSelected ? 'text-indigo-200' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Alerts Group */}
                            {results.alerts?.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Bell className="w-3.5 h-3.5" /> Alerts
                                    </div>
                                    <div className="space-y-1">
                                        {results.alerts.map((a) => {
                                            const isSelected = totalFlattened[selectedIndex]?.id === a.id;
                                            return (
                                                <div 
                                                    key={a.id}
                                                    onClick={() => handleSelect(a)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer group ${isSelected ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`shrink-0 w-2 h-2 rounded-full ${a.severity === 'CRITICAL' ? 'bg-rose-500' : a.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                        <div>
                                                            <p className={`text-sm truncate max-w-[280px] sm:max-w-md ${isSelected ? 'text-white' : 'text-slate-200'}`}>{a.message}</p>
                                                            <p className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{a.alertType}</p>
                                                        </div>
                                                    </div>
                                                    <CornerDownLeft className={`w-3.5 h-3.5 shrink-0 hidden sm:block ${isSelected ? 'text-indigo-200' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer Footer */}
                <div className="px-4 py-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between shrink-0">
                    <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1 py-0.5 rounded border border-slate-600">↑</kbd><kbd className="bg-slate-700 px-1 py-0.5 rounded border border-slate-600">↓</kbd> to navigate</span>
                        <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1 py-0.5 rounded border border-slate-600 text-[9px]">ENTER</kbd> to select</span>
                    </div>
                    {results && (
                        <div className="text-[10px] text-slate-500 text-right sm:text-left">
                            Found {totalFlattened.length} results
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GlobalSearch;
