import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Upload, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProducts } from '../../context/ProductContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../services/authService';
import declarationService from '../../services/declarationService';
import ConfirmDialog from '../ui/ConfirmDialog';

// Zod Validation Schema
const productSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    sku: z.string().min(3, 'SKU must be at least 3 characters').max(20, 'Maximum 20 characters').regex(/^[a-zA-Z0-9-]+$/, 'Alphanumeric and hyphens only'),
    description: z.string().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    vendorId: z.string().min(1, 'Vendor is required'),
    unit: z.enum(['PCS', 'KG', 'LTR', 'BOX', 'CARTON', 'DOZEN', 'MTR']),
    costPrice: z.coerce.number().min(0, 'Cost Price must be 0 or greater'),
    sellingPrice: z.coerce.number().min(0, 'Selling Price must be 0 or greater'),
    currentStock: z.coerce.number().min(0, 'Current Stock must be 0 or greater'),
    reorderLevel: z.coerce.number().min(0, 'Reorder Level must be 0 or greater'),
    reorderQuantity: z.coerce.number().min(1, 'Reorder Quantity must be at least 1'),
    maxStockLevel: z.coerce.number().min(1, 'Max Stock Level must be at least 1'),
    isPerishable: z.boolean(),
    expiryDate: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    barcode: z.string().optional(),
    location: z.string().optional(),
}).refine(data => data.reorderLevel < data.maxStockLevel, {
    message: "Reorder level must be strictly less than Max stock level",
    path: ["reorderLevel"]
}).refine(data => {
    if (data.isPerishable) {
        if (!data.expiryDate) return false;
        const expiry = new Date(data.expiryDate);
        return expiry > new Date();
    }
    return true;
}, {
    message: "Expiry date must be set in the future for perishable goods",
    path: ["expiryDate"]
});

const ProductFormDrawer = ({ isOpen, onClose, product = null }) => {
    const isEditMode = !!product;
    const { createProduct, updateProduct, categories } = useProducts();

    const [activeTab, setActiveTab] = useState('basic');
    const [vendors, setVendors] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);

    // Image State
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    // Vendor Search State
    const [vendorSearchQuery, setVendorSearchQuery] = useState('');
    const [debouncedVendorQuery, setDebouncedVendorQuery] = useState('');
    const [vendorSearchResults, setVendorSearchResults] = useState(null);
    const [isSearchingVendor, setIsSearchingVendor] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors, isDirty, isSubmitting }
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            sku: '',
            description: '',
            categoryId: '',
            vendorId: '',
            unit: 'PCS',
            costPrice: 0,
            sellingPrice: 0,
            currentStock: 0,
            reorderLevel: 10,
            reorderQuantity: 50,
            maxStockLevel: 500,
            isPerishable: false,
            expiryDate: '',
            barcode: '',
            location: '',
            tags: []
        }
    });

    const watchedCost = watch('costPrice') || 0;
    const watchedSell = watch('sellingPrice') || 0;
    const watchedCurrentStock = watch('currentStock') || 0;
    const watchedMinStock = watch('reorderLevel') || 0;
    const watchedMaxStock = watch('maxStockLevel') || 500;
    const isPerishable = watch('isPerishable');

    // Profit Margin Calculation
    const profitMargin = watchedSell > 0 ? (((watchedSell - watchedCost) / watchedSell) * 100).toFixed(2) : 0;
    const isLoss = Number(profitMargin) < 0;

    // Fetch Vendors
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                // Fetch users with VENDOR role
                const { data } = await api.get('/users');
                const vendorList = (data.users || data).filter(u => u.role === 'VENDOR');
                setVendors(vendorList);
            } catch (err) {
                console.error('Failed to load vendors');
            }
        };
        fetchVendors();
    }, []);

    // Fetch vendor declarations based on search
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedVendorQuery(vendorSearchQuery), 300);
        return () => clearTimeout(handler);
    }, [vendorSearchQuery]);

    useEffect(() => {
        const search = async () => {
            if (debouncedVendorQuery.length >= 2) {
                setIsSearchingVendor(true);
                try {
                    const res = await declarationService.searchVendorsForProduct(debouncedVendorQuery);
                    setVendorSearchResults(res.vendors || []);
                } catch (err) {
                    setVendorSearchResults([]);
                }
                setIsSearchingVendor(false);
            } else {
                setVendorSearchResults(null);
            }
        };
        search();
    }, [debouncedVendorQuery]);

    // Set Initial values if editing
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && product) {
                reset({
                    name: product.name,
                    sku: product.sku,
                    description: product.description || '',
                    categoryId: product.categoryId?._id || product.categoryId || '',
                    vendorId: product.vendorId?._id || product.vendorId || '',
                    unit: product.unit || 'PCS',
                    costPrice: product.costPrice,
                    sellingPrice: product.sellingPrice,
                    currentStock: product.currentStock,
                    reorderLevel: product.reorderLevel,
                    reorderQuantity: product.reorderQuantity,
                    maxStockLevel: product.maxStockLevel,
                    isPerishable: product.isPerishable,
                    expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
                    barcode: product.barcode || '',
                    location: product.location || '',
                    tags: product.tags || []
                });
                setTags(product.tags || []);
                if (product.imageUrl) {
                    setImagePreview(`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${product.imageUrl}`);
                } else {
                    setImagePreview(null);
                }
            } else {
                reset();
                setTags([]);
                setImagePreview(null);
                setImageFile(null);
            }
            setActiveTab('basic');
        }
    }, [isOpen, isEditMode, product, reset]);

    const handleClose = () => {
        if (isDirty) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) {
                const newTags = [...tags, newTag];
                setTags(newTags);
                setValue('tags', newTags, { shouldDirty: true });
            }
            setTagInput('');
        }
    };

    const removeTag = (indexToRemove) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        setTags(newTags);
        setValue('tags', newTags, { shouldDirty: true });
    };

    const generateSKU = () => {
        const catId = watch('categoryId');
        const venId = watch('vendorId');

        let catAbbrev = 'PRD';
        let venAbbrev = 'VEN';

        if (catId) {
            const cat = categories.find(c => c._id === catId);
            if (cat) catAbbrev = cat.name.substring(0, 4).toUpperCase();
        }

        if (venId) {
            const ven = vendors.find(v => v._id === venId);
            if (ven) venAbbrev = ven.name.substring(0, 3).toUpperCase();
        }

        const randomStr = Math.floor(1000 + Math.random() * 9000);
        const autoSku = `${catAbbrev}-${venAbbrev}-${randomStr}`.replace(/\s+/g, '');
        setValue('sku', autoSku, { shouldValidate: true, shouldDirty: true });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image must be less than 2MB');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data, isAddAnother = false) => {
        try {
            // Append explicit array mapping for form data if bypassing standard JSON
            const submissionData = { ...data, tags };

            // For file processing, ProductContext create/update can handle formData parsing,
            // or we add image File property directly into the payload object.
            if (imageFile) {
                submissionData.image = imageFile;
            }

            if (isEditMode) {
                await updateProduct(product._id, submissionData);
            } else {
                await createProduct(submissionData);
            }

            if (isAddAnother && !isEditMode) {
                reset();
                setTags([]);
                setImagePreview(null);
                setImageFile(null);
                setActiveTab('basic');
            } else {
                onClose();
            }
        } catch (error) {
            // Context already handles toast errors
        }
    };

    // Calculate days to expiry
    const getDaysToExpiry = () => {
        const exp = watch('expiryDate');
        if (!exp) return null;
        const diffTime = new Date(exp).getTime() - new Date().getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className={`relative w-full lg:w-[560px] h-full bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0`}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-surface z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {isEditMode ? `Edit Product — ${product.sku}` : 'Add New Product'}
                        </h2>
                        {isDirty && <p className="text-xs text-warning mt-1 italic">Unsaved changes present</p>}
                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 border-b border-white/5 overflow-x-auto hide-scrollbar shrink-0">
                    <div className="flex space-x-6">
                        {['basic', 'stock', 'vendor', 'image'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap
                                    ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-white'}
                                `}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                                {activeTab === tab && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="productForm" onSubmit={handleSubmit((d) => onSubmit(d, false))} className="space-y-6">

                        {/* Tab 1: Basic Info */}
                        <div className={activeTab === 'basic' ? 'block space-y-5 animate-in fade-in duration-300' : 'hidden'}>
                            <Input label="Product Name *" placeholder="e.g. Wireless Mouse" {...register('name')} error={errors.name?.message} />

                            <div className="space-y-1.5">
                                <label className="flex justify-between items-center text-sm font-medium text-slate-300">
                                    <span>SKU *</span>
                                    <button type="button" onClick={generateSKU} className="text-xs text-primary hover:text-indigo-400 flex items-center">
                                        <RefreshCw size={12} className="mr-1" /> Auto-generate
                                    </button>
                                </label>
                                <input
                                    className="w-full bg-background border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-primary uppercase font-mono"
                                    placeholder="E.g. ELEC-ACM-4829"
                                    {...register('sku')}
                                />
                                {errors.sku && <p className="text-xs text-danger mt-1">{errors.sku.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300">Description</label>
                                <textarea
                                    rows="3"
                                    className="w-full bg-background border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-primary resize-none custom-scrollbar"
                                    placeholder="Enter product description..."
                                    {...register('description')}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-300">Category *</label>
                                    <select className="w-full bg-background border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-primary" {...register('categoryId')}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {errors.categoryId && <p className="text-xs text-danger mt-1">{errors.categoryId.message}</p>}
                                </div>
                                <Input label="Warehouse Location" placeholder="e.g. A-12-3" {...register('location')} error={errors.location?.message} />
                            </div>

                            {/* Tags Input */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300">Tags</label>
                                <div className="min-h-[46px] w-full bg-background border border-slate-700 rounded-lg p-2 flex flex-wrap gap-2 items-center focus-within:border-primary">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="bg-primary/20 text-primary px-2.5 py-1 rounded-md text-xs font-medium flex items-center">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(index)} className="ml-1.5 hover:text-white">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder={tags.length === 0 ? "Type tag & enter..." : ""}
                                        className="bg-transparent text-sm text-white outline-none flex-1 min-w-[120px]"
                                    />
                                </div>
                            </div>

                            <Input label="Barcode" placeholder="Scan or enter barcode" {...register('barcode')} error={errors.barcode?.message} />
                        </div>

                        {/* Tab 2: Stock & Pricing */}
                        <div className={activeTab === 'stock' ? 'block space-y-5 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-300">Unit of Measure *</label>
                                    <select className="w-full bg-background border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-primary" {...register('unit')}>
                                        {['PCS', 'KG', 'LTR', 'BOX', 'CARTON', 'DOZEN', 'MTR'].map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Current Stock *"
                                    type="number"
                                    disabled={isEditMode}
                                    {...register('currentStock')}
                                    error={errors.currentStock?.message}
                                    tooltip={isEditMode ? "Managed via transactions only" : ""}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <span className="absolute left-3 top-[34px] text-slate-400">$</span>
                                    <Input label="Cost Price *" type="number" step="0.01" className="pl-7" {...register('costPrice')} error={errors.costPrice?.message} />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-[34px] text-slate-400">$</span>
                                    <Input label="Selling Price *" type="number" step="0.01" className="pl-7" {...register('sellingPrice')} error={errors.sellingPrice?.message} />
                                </div>
                            </div>

                            {/* Live Margin Display */}
                            {watchedSell > 0 && (
                                <div className={`p-3 rounded-lg border flex items-center justify-between text-sm font-medium
                                    ${isLoss ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-success/10 border-success/20 text-success'}
                                `}>
                                    <span className="flex items-center">
                                        {isLoss && <AlertCircle size={16} className="mr-2" />}
                                        Live Profit Margin
                                    </span>
                                    <span>{profitMargin}% margin</span>
                                </div>
                            )}
                            {watchedSell > 0 && watchedSell < watchedCost && (
                                <p className="text-xs text-warning mt-1 italic w-full text-right"><AlertCircle size={12} className="inline mr-1 -mt-0.5" />Selling below cost price!</p>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                <Input label="Reorder Lvl *" type="number" {...register('reorderLevel')} error={errors.reorderLevel?.message} />
                                <Input label="Reorder Qty *" type="number" {...register('reorderQuantity')} error={errors.reorderQuantity?.message} />
                                <Input label="Max Stock *" type="number" {...register('maxStockLevel')} error={errors.maxStockLevel?.message} />
                            </div>

                            {/* Health Bar Graphic */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-sm font-medium text-slate-300 mb-2">Stock Capacity Visualizer</p>
                                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex relative border border-white/5">
                                    {/* Compute width percentages accurately based on Max Stock */}
                                    <div
                                        className={`h-full transition-all duration-500
                                            ${watchedCurrentStock <= watchedMinStock ? 'bg-danger' :
                                                watchedCurrentStock > watchedMaxStock ? 'bg-warning' : 'bg-success'}
                                        `}
                                        style={{ width: `${Math.min((watchedCurrentStock / (watchedMaxStock || 1)) * 100, 100)}%` }}
                                    ></div>
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                                        style={{ left: `${(watchedMinStock / (watchedMaxStock || 1)) * 100}%` }}
                                        title="Reorder Level"
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                                    <span>0</span>
                                    <span>{watchedMinStock} (Min)</span>
                                    <span>{watchedMaxStock} (Max)</span>
                                </div>
                            </div>
                        </div>

                        {/* Tab 3: Vendor & Expiry */}
                        <div className={activeTab === 'vendor' ? 'block space-y-5 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">Assign Vendor (Smart Search) *</label>
                                <div className="relative">
                                    <div className="flex bg-background border border-slate-700 text-white rounded-lg focus-within:border-primary overflow-hidden">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                className="w-full p-2.5 outline-none bg-transparent text-sm"
                                                placeholder="Type product name to find vendor..."
                                                value={vendorSearchQuery}
                                                onChange={(e) => setVendorSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {isSearchingVendor && <p className="text-xs text-primary mt-1">Searching vendor declarations...</p>}
                                    
                                    {/* Dropdown Results */}
                                    {vendorSearchResults !== null && vendorSearchQuery.length >= 2 && (
                                        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                            {vendorSearchResults.length === 0 ? (
                                                <div className="p-3 text-sm text-slate-400 text-center">No vendors declared this product.</div>
                                            ) : (
                                                vendorSearchResults.map(({ vendor, declarations }) => (
                                                    <div key={vendor._id} className="p-2 border-b border-slate-700/50">
                                                        <p className="font-semibold text-white text-xs px-1 pt-1 opacity-70">{vendor.name}</p>
                                                        {declarations.map(dec => (
                                                            <div 
                                                                key={dec._id} 
                                                                className="mt-1 flex justify-between items-center bg-slate-900/50 p-2 rounded cursor-pointer hover:bg-primary/20 hover:text-white transition-colors"
                                                                onClick={() => {
                                                                    setValue('vendorId', vendor._id, { shouldValidate: true });
                                                                    setValue('costPrice', dec.unitPrice, { shouldValidate: true });
                                                                    if(dec.productName) setValue('name', dec.productName, { shouldValidate: true });
                                                                    if(dec.sku) setValue('sku', dec.sku, { shouldValidate: true });
                                                                    if(dec.description) setValue('description', dec.description, { shouldValidate: true });
                                                                    if(dec.unit) setValue('unit', dec.unit, { shouldValidate: true });
                                                                    setVendorSearchQuery(''); 
                                                                    toast.success(`Assigned ${vendor.name} • Autofilled Details & Price`);
                                                                }}
                                                            >
                                                                <span className="text-sm font-medium truncate pr-2">{dec.productName}</span>
                                                                <span className="text-sm font-bold text-success shrink-0">₹{dec.unitPrice}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="relative mt-2">
                                    <span className="text-xs text-slate-400 block mb-1">Or select manually from all vendors:</span>
                                    <select className="w-full bg-background border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-primary" {...register('vendorId')}>
                                        <option value="">Select a Vendor</option>
                                        {vendors.map(v => (
                                            <option key={v._id} value={v._id}>{v.name} ({v.email})</option>
                                        ))}
                                    </select>
                                    {errors.vendorId && <p className="text-xs text-danger mt-1">{errors.vendorId.message}</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="flex items-center justify-between cursor-pointer p-4 bg-surface/50 border border-white/5 rounded-xl">
                                    <div>
                                        <p className="font-medium text-white text-sm">Is Perishable?</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Toggle if product expires</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" {...register('isPerishable')} />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${isPerishable ? 'bg-primary' : 'bg-slate-700'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPerishable ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {isPerishable && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                    <Input label="Expiry Date *" type="date" {...register('expiryDate')} error={errors.expiryDate?.message} />
                                    {getDaysToExpiry() !== null && (
                                        <p className={`text-xs mt-1 font-medium ${getDaysToExpiry() < 30 ? 'text-warning' : 'text-success'}`}>
                                            {getDaysToExpiry() > 0 ? `Expires in ${getDaysToExpiry()} days` : 'Already Expired!'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tab 4: Image */}
                        <div className={activeTab === 'image' ? 'block space-y-5 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">Product Image (Optional)</label>

                                {imagePreview ? (
                                    <div className="relative border border-white/10 rounded-xl overflow-hidden group bg-background flex justify-center items-center h-48">
                                        <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => { setImagePreview(null); setImageFile(null); }}
                                                className="bg-danger text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-red-600 focus:scale-95 transition-all"
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                                        <Upload size={32} className="mx-auto text-slate-500 mb-4" />
                                        <p className="text-sm text-slate-300 font-medium">Click to upload or drag & drop</p>
                                        <p className="text-xs text-slate-500 mt-1">Supported formats: JPG, PNG, WEBP (Max 2MB)</p>
                                        <input
                                            type="file"
                                            accept="image/jpeg, image/png, image/webp"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-white/10 bg-surface z-10 flex gap-3 justify-end items-center shrink-0">
                    <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                    {!isEditMode && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleSubmit((d) => onSubmit(d, true))}
                            isLoading={isSubmitting}
                        >
                            Save & Add Another
                        </Button>
                    )}
                    <Button
                        type="submit"
                        form="productForm"
                        isLoading={isSubmitting}
                    >
                        {isEditMode ? 'Update Product' : 'Save Product'}
                    </Button>
                </div>
            </div>
            
            <ConfirmDialog 
                isOpen={showCloseConfirm}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to close without saving?"
                confirmLabel="Yes, Discard"
                confirmColor="bg-rose-600 hover:bg-rose-500"
                onConfirm={() => { setShowCloseConfirm(false); onClose(); }}
                onCancel={() => setShowCloseConfirm(false)}
            />
        </div>
    );
};

export default ProductFormDrawer;
