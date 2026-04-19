import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../hooks/useAuth';
import ProductFormDrawer from '../components/products/ProductFormDrawer';
import CSVImportModal from '../components/products/CSVImportModal';
import StockInModal from '../components/transactions/StockInModal';
import StockOutModal from '../components/transactions/StockOutModal';
import { productService } from '../services/productService';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { Card } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import api from '../services/authService';
import {
    Search, Plus, Download, Upload as UploadIcon, List, Grid,
    MoreVertical, Edit2, Image as ImageIcon, Eye, Trash2,
    AlertTriangle, XCircle, Package, DollarSign, Filter, X,
    ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, type, prefix = '' }) => (
    <Card className="relative overflow-hidden group hover:border-white/10 transition-colors duration-300">
        <div className={`absolute left-0 top-0 bottom-0 w-1 
            ${type === 'primary' ? 'bg-primary' : type === 'warning' ? 'bg-warning' : type === 'danger' ? 'bg-danger' : 'bg-success'}`}
        />
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <h3 className={`text-2xl lg:text-3xl font-bold mt-1 mb-2 ${value > 0 && type === 'warning' ? 'text-warning' :
                    value > 0 && type === 'danger' ? 'text-danger' : 'text-white'
                    }`}>
                    {prefix}{value}
                </h3>
            </div>
            <div className={`p-3 rounded-xl bg-surface/50 border border-white/5 
                ${type === 'primary' ? 'text-primary' : type === 'warning' ? 'text-warning' : type === 'danger' ? 'text-danger' : 'text-success'}`}>
                <Icon size={24} className={value > 0 && (type === 'warning' || type === 'danger') ? 'animate-pulse' : ''} />
            </div>
        </div>
    </Card>
);

const ProductsPage = () => {
    const {
        products, pagination, stats, categories, filters,
        setFilters, deleteProduct, isLoading, fetchProducts
    } = useProducts();
    const { user } = useAuth();

    // View state
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('productsViewMode') || 'table');
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Modals & Selections
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false, id: null });
    const [selectedItems, setSelectedItems] = useState([]);
    const [vendors, setVendors] = useState([]);

    const [isStockInOpen, setIsStockInOpen] = useState(false);
    const [isStockOutOpen, setIsStockOutOpen] = useState(false);
    const [selectedProductForStock, setSelectedProductForStock] = useState(null);

    const csvInputRef = useRef(null);

    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role);

    // Save view mode
    useEffect(() => {
        localStorage.setItem('productsViewMode', viewMode);
    }, [viewMode]);

    // Fetch vendors for filter
    useEffect(() => {
        if (isAdminOrManager) {
            api.get('/users').then(res => {
                const list = (res.data.users || res.data).filter(u => u.role === 'VENDOR');
                setVendors(list);
            }).catch(err => console.error("Could not fetch vendors"));
        }
    }, [isAdminOrManager]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                setFilters({ search: localSearch, page: 1 });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch, setFilters, filters.search]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters({ [key]: value, page: 1 });
    };

    const clearFilters = () => {
        setLocalSearch('');
        setFilters({
            search: '', category: '', vendor: '', stockStatus: '',
            isActive: '', isPerishable: '', sortBy: 'createdAt', sortOrder: 'desc', page: 1
        });
    };

    const openCreateDrawer = () => {
        setSelectedProduct(null);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (product) => {
        setSelectedProduct(product);
        setIsDrawerOpen(true);
    };

    const handleStockIn = (product) => {
        setSelectedProductForStock(product);
        setIsStockInOpen(true);
    };

    const handleStockOut = (product) => {
        setSelectedProductForStock(product);
        setIsStockOutOpen(true);
    };

    const handleStockSuccess = () => {
        fetchProducts(filters);
    };

    const handleExport = async () => {
        try {
            await productService.exportProductsCSV(filters);
            toast.success('Export started');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleDeactivate = (id) => {
        setConfirmState({ isOpen: true, id });
    };

    const confirmDeactivate = async () => {
        try {
            await deleteProduct(confirmState.id);
            setSelectedItems(prev => prev.filter(item => item !== confirmState.id));
        } catch (err) { }
        setConfirmState({ isOpen: false, id: null });
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(products.map(p => p._id));
        } else {
            setSelectedItems([]);
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const hasActiveFilters = localSearch || filters.category || filters.vendor || filters.stockStatus || filters.isActive !== '' || filters.isPerishable !== '';

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Product Catalog</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage your inventory items</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {isAdminOrManager && (
                        <>
                            <Button variant="ghost" onClick={() => setIsImportOpen(true)}>
                                <UploadIcon size={16} className="mr-2" /> Import CSV
                            </Button>
                            <Button variant="ghost" onClick={handleExport}>
                                <Download size={16} className="mr-2" /> Export CSV
                            </Button>
                        </>
                    )}
                    <Button onClick={openCreateDrawer}>
                        <Plus size={16} className="mr-2" /> Add Product
                    </Button>
                </div>
            </div>

            {/* KPI Stats */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <KPICard title="Total Products" value={stats.totalProducts || 0} icon={Package} type="primary" />
                    <KPICard title="Total Stock Value" value={(stats.totalStockValue || 0).toLocaleString()} prefix="$" icon={DollarSign} type="success" />
                    <KPICard title="Low Stock" value={stats.lowStockCount || 0} icon={AlertTriangle} type="warning" />
                    <KPICard title="Out of Stock" value={stats.outOfStockCount || 0} icon={XCircle} type="danger" />
                </div>
            )}

            {/* Filter Bar (Sticky) */}
            <div className="sticky top-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 z-20 bg-background/95 backdrop-blur border-y border-white/5 py-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search name, SKU, tags..."
                            className="w-full bg-surface border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary outline-none"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    {isAdminOrManager && (
                        <select
                            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                            value={filters.vendor}
                            onChange={(e) => handleFilterChange('vendor', e.target.value)}
                        >
                            <option value="">All Vendors</option>
                            {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                        </select>
                    )}

                    <select
                        className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                        <option value="createdAt">Date Added</option>
                        <option value="name">Name</option>
                        <option value="currentStock">Stock Level</option>
                        <option value="sellingPrice">Value</option>
                    </select>

                    <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 lg:ml-auto"
                        onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                        title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                    >
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>

                    <div className="flex bg-surface rounded-lg p-1 border border-white/10">
                        <button
                            className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('table')}
                        ><List size={16} /></button>
                        <button
                            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('grid')}
                        ><Grid size={16} /></button>
                    </div>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400">
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex space-x-1 overflow-x-auto hide-scrollbar text-sm">
                    {['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCKED'].map(status => (
                        <button
                            key={status}
                            onClick={() => handleFilterChange('stockStatus', status)}
                            className={`px-4 py-1.5 rounded-full whitespace-nowrap border transition-all ${filters.stockStatus === status
                                ? 'bg-primary/20 border-primary/30 text-primary font-medium'
                                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {status === '' ? 'All Items' : status.replace('_', ' ')}
                            {/* Optional: Add exact count pill here if extracted from stats */}
                        </button>
                    ))}

                </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div className="bg-primary/20 border border-primary/30 text-primary px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="font-medium">{selectedItems.length} items selected</span>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Export Selected</Button>
                        {isAdminOrManager && (
                            <Button variant="danger" size="sm" onClick={() => {
                                selectedItems.forEach(id => deleteProduct(id)); // simplistic bulk delete
                                setSelectedItems([]);
                            }}>Deactivate Selected</Button>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20"><Loader /></div>
            ) : products.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No products found"
                    subtitle="Try adjusting your filters or add your first product"
                    action={
                        <Button onClick={openCreateDrawer}>
                            <Plus size={16} className="mr-2" /> Add Product
                        </Button>
                    }
                />
            ) : (
                <>
                    {viewMode === 'table' ? (
                        <Card className={`p-0 ${activeMenuId ? '' : 'overflow-hidden'}`}>
                            <div className={`${activeMenuId ? '' : 'overflow-x-auto'}`}>
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs text-slate-400 uppercase bg-surface/50 border-b border-white/5">
                                        <tr>
                                            <th className="p-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-700 bg-background text-primary focus:ring-primary focus:ring-offset-background"
                                                    checked={selectedItems.length === products.length && products.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-4 py-3 font-medium">Image</th>
                                            <th className="px-4 py-3 font-medium">Name & SKU</th>
                                            <th className="px-4 py-3 font-medium">Category</th>
                                            {isAdminOrManager && <th className="px-4 py-3 font-medium">Vendor</th>}
                                            <th className="px-4 py-3 font-medium">Unit</th>
                                            <th className="px-4 py-3 font-medium">Stock</th>
                                            <th className="px-4 py-3 font-medium">Reorder</th>
                                            <th className="px-4 py-3 font-medium">Value</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {products.map(p => (
                                            <tr key={p._id} className={`hover:bg-white/[0.02] transition-colors group ${!p.isActive ? 'opacity-50' : ''}`}>
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-700 bg-background text-primary focus:ring-primary focus:ring-offset-background"
                                                        checked={selectedItems.includes(p._id)}
                                                        onChange={() => toggleSelectItem(p._id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {p.imageUrl ? (
                                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon size={18} className="text-slate-500" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-white truncate max-w-[200px]">{p.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</p>
                                                    {p.location && <span className="inline-block mt-1 text-[10px] bg-white/5 text-slate-400 px-1.5 rounded">{p.location}</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {p.categoryId ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-surface border border-white/10" style={{ color: p.categoryId.color || '#fff' }}>
                                                            {p.categoryId.icon && <span>{p.categoryId.icon}</span>}
                                                            {p.categoryId.name}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                {isAdminOrManager && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                                                {p.vendorId?.name?.charAt(0) || 'V'}
                                                            </div>
                                                            <span className="text-slate-300 text-sm truncate max-w-[120px]">{p.vendorId?.name}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 text-slate-400 text-xs">{p.unit}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center font-medium">
                                                        <span className={`
                                                            ${p.currentStock === 0 ? 'text-danger flex items-center gap-1' :
                                                                p.currentStock <= p.reorderLevel ? 'text-warning flex items-center gap-1' :
                                                                    'text-success'
                                                            }
                                                        `}>
                                                            {p.currentStock === 0 && <XCircle size={12} />}
                                                            {p.currentStock > 0 && p.currentStock <= p.reorderLevel && <AlertTriangle size={12} />}
                                                            {p.currentStock}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{p.reorderLevel}</td>
                                                <td className="px-4 py-3 text-slate-300 font-medium">${p.stockValue?.toFixed(2) || (p.currentStock * p.costPrice).toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={p.stockStatus === 'IN_STOCK' ? 'success' : p.stockStatus === 'OUT_OF_STOCK' ? 'danger' : p.stockStatus === 'LOW_STOCK' ? 'warning' : 'primary'}>
                                                        {p.stockStatus.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="relative inline-block" onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === p._id ? null : p._id); }}>
                                                        <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        {activeMenuId === p._id && (
                                                            <div className="absolute right-0 mt-1 w-36 bg-surface border border-white/10 rounded-lg shadow-xl py-1 z-50">
                                                                <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); openEditDrawer(p); }} className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                                                                    <Edit2 size={14} className="mr-2" /> Edit Info
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); handleStockIn(p); }} className="flex items-center w-full px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 mt-1 border-t border-white/5">
                                                                    <ArrowUpCircle size={14} className="mr-2" /> Stock In ▲
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); handleStockOut(p); }} className="flex items-center w-full px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10">
                                                                    <ArrowDownCircle size={14} className="mr-2" /> Stock Out ▼
                                                                </button>
                                                                <button onClick={(e) => e.stopPropagation()} className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white mt-1 border-t border-white/5">
                                                                    <ImageIcon size={14} className="mr-2" /> Update Image
                                                                </button>
                                                                <button onClick={(e) => e.stopPropagation()} className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                                                                    <Eye size={14} className="mr-2" /> View Details
                                                                </button>
                                                                {isAdminOrManager && p.isActive && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); handleDeactivate(p._id); }} className="flex items-center w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 mt-1 border-t border-white/5">
                                                                        <Trash2 size={14} className="mr-2" /> Deactivate
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {products.map(p => (
                                <div key={p._id} className={`bg-[#1E293B] rounded-xl border border-white/10 overflow-hidden flex flex-col group ${!p.isActive ? 'opacity-60' : ''}`}>
                                    <div className="relative h-40 bg-slate-800 border-b border-white/5 shrink-0">
                                        {p.imageUrl ? (
                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${p.imageUrl}`} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={32} /></div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <Badge variant={p.stockStatus === 'IN_STOCK' ? 'success' : p.stockStatus === 'OUT_OF_STOCK' ? 'danger' : p.stockStatus === 'LOW_STOCK' ? 'warning' : 'primary'} className="shadow-lg backdrop-blur bg-opacity-90">
                                                {p.stockStatus.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            {p.categoryId && (
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold" style={{ color: p.categoryId.color || '#94a3b8' }}>
                                                    {p.categoryId.name}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-medium px-1.5 bg-white/5 rounded text-white">{p.profitMargin}% Margin</span>
                                        </div>
                                        <h4 className="text-white font-semibold truncate" title={p.name}>{p.name}</h4>
                                        <p className="text-xs text-slate-400 font-mono mt-1">{p.sku}</p>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex-1">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs text-slate-400">Stock</span>
                                                <span className={`text-xl font-bold leading-none ${p.currentStock === 0 ? 'text-danger' : p.currentStock <= p.reorderLevel ? 'text-warning' : 'text-white'}`}>
                                                    {p.currentStock} <span className="text-xs text-slate-500 font-normal">{p.unit}</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className={`h-full ${p.currentStock <= p.reorderLevel ? 'bg-warning' : p.currentStock === 0 ? 'bg-danger' : 'bg-success'}`}
                                                    style={{ width: `${Math.min((p.currentStock / (p.maxStockLevel || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-2">
                                            <Button variant="secondary" className="flex-1" onClick={() => openEditDrawer(p)}>
                                                <Edit2 size={14} className="mr-2" /> Edit
                                            </Button>
                                            <div className="flex bg-surface border border-white/5 rounded-lg overflow-hidden shrink-0">
                                                <button onClick={() => handleStockOut(p)} className="px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border-r border-white/5" title="Remove Stock">-</button>
                                                <button onClick={() => handleStockIn(p)} className="px-3 py-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Add Stock">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-white/5">
                            <span className="text-sm text-slate-400">
                                Showing <span className="text-white font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                                <span className="text-white font-medium">{pagination.total}</span> products
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    disabled={pagination.page === 1}
                                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1 px-2">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                                        <button
                                            key={pageNum}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pageNum === pagination.page
                                                ? 'bg-primary text-white'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                            onClick={() => handleFilterChange('page', pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <ProductFormDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                product={selectedProduct}
            />

            <CSVImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
            />

            <StockInModal
                isOpen={isStockInOpen}
                onClose={() => setIsStockInOpen(false)}
                initialProduct={selectedProductForStock}
                onSuccess={handleStockSuccess}
            />

            <StockOutModal
                isOpen={isStockOutOpen}
                onClose={() => setIsStockOutOpen(false)}
                initialProduct={selectedProductForStock}
                onSuccess={handleStockSuccess}
            />
        </div>
    );
};

export default ProductsPage;
