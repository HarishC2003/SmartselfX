import React from 'react';

const EmptyState = ({ icon, title, subtitle, actionLabel, onAction, action }) => {
    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) return icon;
        const IconComponent = icon;
        return <IconComponent className="w-16 h-16 mx-auto text-slate-500" />;
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-white/5 rounded-2xl h-full min-h-[400px]">
            <div className="mb-6 opacity-80">{renderIcon()}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium">
                {subtitle}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    {actionLabel}
                </button>
            )}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
