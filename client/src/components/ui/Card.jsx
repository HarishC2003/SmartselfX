import React from 'react';

export const Card = ({ children, title, actions, className = '' }) => {
    return (
        <div className={`bg-surface rounded-2xl shadow-xl border border-white/5 overflow-hidden ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
                    {actions && <div>{actions}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};
