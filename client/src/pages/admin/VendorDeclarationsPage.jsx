import React, { useState, useEffect } from 'react';
import { useDeclarations } from '../../context/DeclarationContext';
import declarationService from '../../services/declarationService';
import { ClipboardList, Search, AlertTriangle, Package, Store, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { formatRelativeTime } from '../../utils/formatters';

const VendorDeclarationsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [allDeclarations, setAllDeclarations] = useState([]);
    const [loadingAll, setLoadingAll] = useState(true);
    const [selectedVendorFilter, setSelectedVendorFilter] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            setLoadingAll(true);
            try {
                const res = await declarationService.getAllDeclarations({ limit: 1000 });
                setAllDeclarations(res.declarations);
            } catch (err) { }
            setLoadingAll(false);
        };
        fetchAll();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const search = async () => {
            if (debouncedSearch.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await declarationService.searchVendorsForProduct(debouncedSearch);
                    setSearchResults(res);
                } catch (err) {
                    setSearchResults({ vendors: [] });
                }
                setIsSearching(false);
            } else {
                setSearchResults(null);
            }
        };
        search();
    }, [debouncedSearch]);

    // Derived states
    const uniqueVendors = Array.from(new Set(allDeclarations.map(d => d.vendorId?._id))).map(id => {
        const decs = allDeclarations.filter(d => d.vendorId?._id === id);
        return {
            vendor: decs[0]?.vendorId,
            productCount: decs.length,
            totalUnits: decs.reduce((s, d) => s + d.availableQty, 0),
            totalValue: decs.reduce((s, d) => s + (d.availableQty * d.unitPrice), 0),
            lastUpdate: new Date(Math.max(...decs.map(d => new Date(d.updatedAt).getTime())))
        };
    }).filter(v => v.vendor);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const staleDeclarations = allDeclarations.filter(d => new Date(d.updatedAt) < sevenDaysAgo);

    const filteredDeclarations = allDeclarations.filter(d => {
        if (selectedVendorFilter && d.vendorId?._id !== selectedVendorFilter) return false;
        if (searchTerm && debouncedSearch.length < 2) {
            const matchesSearch = d.productName.toLowerCase().includes(searchTerm.toLowerCase()) || d.sku.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
        }
        return true;
    });

    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'VN';

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-indigo-400" />
                    Vendor Stock Declarations
                </h1>
                <p className="text-slate-400 mt-1">See what all vendors have declared they can supply and their live stock availability.</p>
            </div>

            {/* Stale Warning Banner */}
            {staleDeclarations.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-300 text-sm">Stale Declarations Warning</p>
                        <p className="text-sm text-amber-200/80 mt-1">
                            {staleDeclarations.length} declarations haven't been updated in over 7 days. Quantities may be inaccurate. Look for the highlighted rows.
                        </p>
                    </div>
                </div>
            )}

            {/* Smart Search */}
            <div className="bg-[#1E293B] rounded-xl shadow-sm border border-white/5 p-2 relative z-10">
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isSearching ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                    <input
                        type="text"
                        placeholder="Search by product name to find vendors (smart search)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 text-lg border-0 bg-transparent focus:ring-0 text-white placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Search Results Mode */}
            {searchResults && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-300">Displaying matches for "{searchResults.query}"</h3>
                        <Badge variant="info">Found {searchResults.totalVendors} vendors</Badge>
                    </div>

                    {searchResults.vendors.length === 0 ? (
                        <EmptyState icon={Package} title={`No vendor supplies "${searchResults.query}"`} description="Try searching for a different product name or generic term." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.vendors.map(({ vendor, declarations }, idx) => (
                                <div key={vendor._id || idx} className="bg-[#1E293B] rounded-xl shadow-sm border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all flex flex-col">
                                    <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-slate-800/50">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                                            {getInitials(vendor?.name)}
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-white truncate" title={vendor?.name}>{vendor?.name || 'Unknown Vendor'}</p>
                                            <p className="text-xs text-slate-400 truncate" title={vendor?.email}>{vendor?.email}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4 flex-1">
                                        {declarations.map(dec => (
                                            <div key={dec._id} className="relative group">
                                                <p className="text-sm font-semibold text-white leading-tight pr-4">{dec.productName}</p>
                                                <p className="text-xs font-mono text-slate-500 mt-1">{dec.sku}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <Badge variant={dec.availableQty > 0 ? 'success' : 'danger'}>
                                                        {dec.availableQty} {dec.unit}
                                                    </Badge>
                                                    <span className="text-sm font-bold text-white">₹{dec.unitPrice.toLocaleString('en-IN')}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Updated {formatRelativeTime(dec.updatedAt)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Default Mode: All Declarations */}
            {!searchResults && (
                <div className="space-y-6 animate-fade-in-up">
                    
                    {/* Horizontal Vendor Summary Cards */}
                    <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-2 pt-1 -mx-2 px-2">
                        {uniqueVendors.map(v => (
                            <div 
                                key={v.vendor._id} 
                                onClick={() => setSelectedVendorFilter(selectedVendorFilter === v.vendor._id ? '' : v.vendor._id)}
                                className={`shrink-0 w-72 rounded-xl p-4 border transition-all cursor-pointer ${
                                    selectedVendorFilter === v.vendor._id 
                                        ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm shadow-indigo-500/10' 
                                        : 'bg-[#1E293B] border-white/5 hover:border-indigo-500/30'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                        selectedVendorFilter === v.vendor._id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {getInitials(v.vendor.name)}
                                    </div>
                                    <p className="font-semibold text-white truncate flex-1">{v.vendor.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <div className="text-slate-400">Products:</div>
                                    <div className="font-medium text-right text-white">{v.productCount}</div>
                                    <div className="text-slate-400">Total Units:</div>
                                    <div className="font-medium text-right text-white">{v.totalUnits.toLocaleString('en-IN')}</div>
                                    <div className="text-slate-400">Value:</div>
                                    <div className="font-medium text-right text-emerald-400">₹{(v.totalValue / 100000).toFixed(2)}L</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-[#1E293B] rounded-xl shadow-sm border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-slate-800/50 flex items-center justify-between">
                            <h3 className="font-semibold text-white">
                                {selectedVendorFilter ? "Vendor's Declarations" : "All Declarations"}
                            </h3>
                            {selectedVendorFilter && (
                                <button onClick={() => setSelectedVendorFilter('')} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Clear Vendor Filter
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/50 border-b border-white/5 text-xs uppercase text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Vendor</th>
                                        <th className="px-6 py-4 font-semibold">Product & SKU</th>
                                        <th className="px-6 py-4 font-semibold">Available Stock</th>
                                        <th className="px-6 py-4 font-semibold">Price/Value</th>
                                        <th className="px-6 py-4 font-semibold">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loadingAll ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Loading declarations...</td></tr>
                                    ) : filteredDeclarations.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8"><EmptyState icon={ClipboardList} title="No declarations found" /></td></tr>
                                    ) : (
                                        filteredDeclarations.map(dec => {
                                            const isStale = new Date(dec.updatedAt) < sevenDaysAgo;
                                            return (
                                                <tr key={dec._id} className={`hover:bg-white/5 transition-colors ${isStale ? 'bg-amber-500/5' : ''}`}>
                                                    <td className="px-6 py-4 align-top">
                                                        <div 
                                                            className="flex items-center gap-2 cursor-pointer group"
                                                            onClick={() => setSelectedVendorFilter(dec.vendorId?._id)}
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                                                {getInitials(dec.vendorId?.name)}
                                                            </div>
                                                            <span className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                                                                {dec.vendorId?.name || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="font-semibold text-white">{dec.productName}</div>
                                                        <div className="text-xs font-mono text-slate-500 mt-0.5">{dec.sku}</div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <Badge variant={dec.availableQty === 0 ? 'danger' : dec.availableQty < 10 ? 'warning' : 'success'}>
                                                            {dec.availableQty} {dec.unit}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="font-medium text-white">₹{dec.unitPrice.toLocaleString('en-IN')}</div>
                                                        <div className="text-xs text-slate-500">Total: ₹{(dec.availableQty * dec.unitPrice).toLocaleString('en-IN')}</div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className={`flex items-center gap-1.5 ${isStale ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
                                                            {isStale && <AlertTriangle className="w-3.5 h-3.5" />}
                                                            {formatRelativeTime(dec.updatedAt)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDeclarationsPage;
