import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-slate-800 text-slate-300',
        primary: 'bg-primary/20 text-primary border border-primary/30',
        success: 'bg-success/20 text-success border border-success/30',
        warning: 'bg-warning/20 text-warning border border-warning/30',
        danger: 'bg-danger/20 text-danger border border-danger/30',
        // Role specific
        ADMIN: 'bg-primary/20 text-primary border border-primary/30',
        MANAGER: 'bg-accent/20 text-accent border border-accent/30',
        VENDOR: 'bg-warning/20 text-warning border border-warning/30',
    };

    const selectedVariant = variants[variant] || variants.default;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedVariant} ${className}`}>
            {children}
        </span>
    );
};
