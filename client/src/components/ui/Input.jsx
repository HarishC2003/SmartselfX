import React, { forwardRef } from 'react';

export const Input = forwardRef(({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
            w-full rounded-lg bg-background border border-slate-700 
            text-text placeholder-slate-500 focus:border-primary 
            focus:ring-1 focus:ring-primary transition-colors
            ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2
            ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-danger">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
