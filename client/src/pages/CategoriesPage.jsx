import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2, Tag, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProducts } from '../context/ProductContext';
import { categoryService } from '../services/categoryService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

const COMMON_EMOJIS = ['📦', '🍎', '👚', '💻', '🛋️', '🧴', '🛠️', '⚽', '🚗', '📚', '💊', '🪴', '🎸', '🎮', '🍔', '👗', '📱', '🧊', '🔥', '💧'];
const PRESET_COLORS = ['#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const categorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    icon: z.string().min(1, 'Icon is required'),
    color: z.string().min(4, 'Color must be a valid hex code'),
});

const CategoriesPage = () => {
    const { user } = useAuth();
    const { categories, fetchCategories } = useProducts();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '', icon: '📦', color: '#6366F1' }
    });

    const watchedName = watch('name') || '';
    const watchedIcon = watch('icon');
    const watchedColor = watch('color');
    const liveSlug = watchedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const openCreateModal = () => {
        setSelectedCategory(null);
        reset({ name: '', description: '', icon: '📦', color: '#6366F1' });
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setSelectedCategory(category);
        reset({
            name: category.name,
            description: category.description || '',
            icon: category.icon || '📦',
            color: category.color || '#6366F1'
        });
        setIsModalOpen(true);
    };

    const confirmDelete = (category) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (selectedCategory) {
                await categoryService.updateCategory(selectedCategory._id, data);
                toast.success('Category updated successfully');
            } else {
                await categoryService.createCategory(data);
                toast.success('Category created successfully');
            }
            fetchCategories(); // Refresh global category list
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory || selectedCategory.productCount > 0) return;

        try {
            await categoryService.deleteCategory(selectedCategory._id);
            toast.success('Category deleted successfully');
            fetchCategories();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    // Derived permissions
    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user?.role);
    if (!isAdminOrManager) {
        return <div className="p-8 text-center text-white">Access Denied</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Categories</h1>
                    <p className="text-sm text-slate-400 mt-1">Organize your product inventory hierarchy</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus size={16} className="mr-2" /> New Category
                </Button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <Card key={category._id} className="p-5 flex flex-col hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-300 group">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner shrink-0"
                                style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40`, color: category.color }}
                            >
                                {category.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white truncate">{category.name}</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5 mb-2 truncate">slug: {category.slug}</p>
                                <div className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-surface border border-white/5 text-slate-300">
                                    <Package size={12} className="mr-1.5 opacity-70" /> {category.productCount || 0} Products
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 mb-5 flex-1 line-clamp-2 text-sm text-slate-400">
                            {category.description || <span className="italic opacity-50">No description provided</span>}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(category)} className="text-slate-400 hover:text-white hover:bg-white/5">
                                <Edit2 size={14} className="mr-1.5" /> Edit
                            </Button>
                            {user?.role === 'ADMIN' && (
                                <Button variant="ghost" size="sm" onClick={() => confirmDelete(category)} className="text-danger hover:text-red-400 hover:bg-danger/10">
                                    <Trash2 size={14} className="mr-1.5" /> Delete
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}

                {categories.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-surface/30 rounded-2xl border border-white/5 border-dashed">
                        <Tag size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-1">No categories defined yet</h3>
                        <p className="text-slate-400 text-sm mb-6">Create your first category to start organizing products.</p>
                        <Button onClick={openCreateModal}>
                            <Plus size={16} className="mr-2" /> Create Category
                        </Button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCategory ? `Edit Category` : 'Create Category'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div className="space-y-1.5">
                        <Input label="Category Name *" placeholder="e.g. Electronics" {...register('name')} error={errors.name?.message} />
                        {watchedName && (
                            <p className="text-xs text-slate-500 font-mono pl-1">Predicted Slug: {liveSlug}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Description</label>
                        <textarea
                            rows="2"
                            className="w-full bg-background border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-primary resize-none"
                            placeholder="Optional category description..."
                            {...register('description')}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/5">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-300">Icon (Emoji)</label>
                            <div className="bg-background border border-white/10 rounded-lg p-3 grid grid-cols-5 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {COMMON_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji} type="button"
                                        onClick={() => setValue('icon', emoji)}
                                        className={`text-xl p-1 rounded transition-colors ${watchedIcon === emoji ? 'bg-primary/20 scale-110' : 'hover:bg-white/10'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-500 w-16">Custom:</span>
                                <input type="text" {...register('icon')} className="w-full bg-background border border-slate-700 text-white rounded-md p-1.5 text-center text-lg outline-none focus:border-primary" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-300">Color Tag</label>
                            <div className="flex flex-wrap gap-3">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color} type="button"
                                        onClick={() => setValue('color', color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${watchedColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-xs text-slate-500 w-16">Hex:</span>
                                <div className="relative flex-1">
                                    <input type="color" {...register('color')} className="absolute left-1 top-1 w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    <input type="text" {...register('color')} className="w-full bg-background border border-slate-700 text-white rounded-md p-1.5 pl-9 outline-none focus:border-primary font-mono text-sm uppercase" />
                                </div>
                            </div>
                            {errors.color && <p className="text-xs text-danger">{errors.color.message}</p>}
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="pt-4 border-t border-white/5">
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Live Badge Preview</label>
                        <div className="bg-background border border-white/10 rounded-xl p-6 flex justify-center items-center">
                            <span
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg transition-colors"
                                style={{ backgroundColor: `${watchedColor}20`, color: watchedColor, border: `1px solid ${watchedColor}40` }}
                            >
                                <span className="text-lg">{watchedIcon || '📦'}</span>
                                {watchedName || 'Category Name'}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">
                            {selectedCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            {selectedCategory && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Category">
                    {selectedCategory.productCount > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex items-start gap-4">
                                <AlertTriangle className="text-warning mt-0.5 shrink-0" size={24} />
                                <div>
                                    <h4 className="text-warning font-semibold">Cannot Delete Category</h4>
                                    <p className="text-sm text-slate-300 mt-1">
                                        This category contains <strong className="text-white">{selectedCategory.productCount}</strong> products. You must reassign those products or deactivate them before deleting this category to maintain data integrity.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setIsDeleteModalOpen(false)}>Understood</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-300">
                                Are you sure you want to delete <strong className="text-white">"{selectedCategory.name}"</strong>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                                <Button type="button" variant="danger" onClick={handleDelete}>Delete Permanently</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

        </div>
    );
};

export default CategoriesPage;
