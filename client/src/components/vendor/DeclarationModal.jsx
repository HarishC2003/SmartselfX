import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, X } from 'lucide-react';
import { Button } from '../ui/Button';

const declarationSchema = z.object({
  productName: z.string().min(2, "Product name is required").max(100),
  sku: z.string()
    .min(1, 'SKU is required')
    .max(30, 'SKU must be under 30 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Only letters, numbers, hyphens, and underscores allowed'),
  description: z.string().optional(),
  unit: z.enum(['PCS', 'KG', 'LTR', 'BOX', 'CARTON', 'DOZEN', 'MTR']),
  availableQty: z.number({ coerce: true }).min(0, "Must be greater than or equal to 0"),
  unitPrice: z.number({ coerce: true }).min(0, "Must be greater than or equal to 0")
});

const DeclarationModal = ({ isOpen, onClose, onSave, declarationToEdit = null }) => {
  const isEditing = !!declarationToEdit;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      productName: '',
      sku: '',
      description: '',
      unit: 'PCS',
      availableQty: 0,
      unitPrice: 0
    }
  });

  const watchProductName = watch("productName");
  const watchQty = watch("availableQty");
  const watchPrice = watch("unitPrice");
  const watchUnit = watch("unit");

  useEffect(() => {
    if (isOpen) {
      if (declarationToEdit) {
        reset(declarationToEdit);
      } else {
        reset({
          productName: '',
          sku: '',
          description: '',
          unit: 'PCS',
          availableQty: 0,
          unitPrice: 0
        });
      }
    }
  }, [isOpen, declarationToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      // Error is handled in context
    }
  };

  const inputClasses = (hasError) =>
    `w-full p-2.5 bg-slate-900 border ${hasError ? 'border-rose-500/60' : 'border-white/10'} rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-xl shadow-2xl shadow-black/40 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-800/80">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              {isEditing ? `Edit Declaration — ${declarationToEdit.sku}` : 'Declare a Product'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isEditing ? 'Update stock availability and price.' : 'Tell us what you supply and how much you have.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="declaration-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Product Name*</label>
              <input
                type="text"
                {...register('productName')}
                placeholder="e.g. Wireless Bluetooth Headphones"
                className={inputClasses(errors.productName)}
              />
              {errors.productName && <p className="text-rose-400 text-xs mt-1">{errors.productName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">SKU / Product Code*</label>
              <input
                type="text"
                {...register('sku', {
                    onChange: (e) => { e.target.value = e.target.value.toUpperCase(); }
                })}
                placeholder="e.g. ACM-WH-001"
                className={`${inputClasses(errors.sku)} uppercase`}
              />
              <p className="text-xs text-slate-500 mt-1">Use your own warehouse SKU or product code</p>
              {errors.sku && <p className="text-rose-400 text-xs mt-1">{errors.sku.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit of Measure*</label>
                <select
                  {...register('unit')}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  <option value="PCS">PCS</option>
                  <option value="KG">KG</option>
                  <option value="LTR">LTR</option>
                  <option value="BOX">BOX</option>
                  <option value="CARTON">CARTON</option>
                  <option value="DOZEN">DOZEN</option>
                  <option value="MTR">MTR</option>
                </select>
                {errors.unit && <p className="text-rose-400 text-xs mt-1">{errors.unit.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit Price (₹)*</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('unitPrice')}
                  placeholder="0.00"
                  className={inputClasses(errors.unitPrice)}
                />
                <p className="text-xs text-slate-500 mt-1">Your price per unit</p>
                {errors.unitPrice && <p className="text-rose-400 text-xs mt-1">{errors.unitPrice.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Available Quantity*</label>
              <input
                type="number"
                {...register('availableQty')}
                placeholder="0"
                className={inputClasses(errors.availableQty)}
              />
              <p className="text-xs text-slate-500 mt-1">This auto-decreases when POs are dispatched.</p>
              {errors.availableQty && <p className="text-rose-400 text-xs mt-1">{errors.availableQty.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
              <textarea
                {...register('description')}
                rows="3"
                placeholder="Brief description of the product"
                className={inputClasses(errors.description)}
              ></textarea>
            </div>
            
            {/* Live Summary */}
            <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 flex flex-col gap-1.5 mt-4">
                <span className="text-sm font-medium text-indigo-300">📦 {watchProductName || "Product"}</span>
                <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>Available:</span>
                    <span className="font-semibold text-white">{watchQty || 0} {watchUnit}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>Price:</span>
                    <span className="font-semibold text-white">₹{watchPrice || 0}/{watchUnit}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-indigo-500/20 flex justify-between items-center bg-indigo-500/10 p-2.5 rounded-lg">
                    <span className="text-indigo-300 font-medium">Total Value:</span>
                    <span className="text-white font-bold text-lg">₹{((watchQty || 0) * (watchPrice || 0)).toLocaleString('en-IN')}</span>
                </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-slate-800/80">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">
            Cancel
          </Button>
          <Button type="submit" form="declaration-form" isLoading={isSubmitting} className="shadow-md shadow-indigo-500/20">
            {isEditing ? 'Save Changes' : 'Save Declaration'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeclarationModal;
