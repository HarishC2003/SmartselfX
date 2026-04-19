import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    confirmColor = 'bg-rose-600 hover:bg-rose-500',
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setDisabled(true);
            const timer = setTimeout(() => setDisabled(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isLoading ? onCancel : undefined} />
            
            <div className="relative bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                        <p className="text-xs font-bold uppercase tracking-wider text-rose-400 mt-1">Are you sure?</p>
                    </div>
                </div>
                
                <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex items-center justify-end gap-3 select-none">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={disabled || isLoading}
                        className={`flex items-center justify-center min-w-[100px] px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${confirmColor} focus:ring-4 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
