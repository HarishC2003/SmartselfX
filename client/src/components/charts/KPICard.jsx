import React from 'react';

const KPICard = ({ title, value, subtitle, trend, trendValue, icon: Icon, color = '#6366F1', isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-[#1E293B] rounded-xl p-6 border border-white/10 relative overflow-hidden flex flex-col justify-center h-32 animate-pulse">
                <div className="absolute left-0 top-0 bottom-0 w-1 opacity-20" style={{ backgroundColor: color }}></div>
                <div className="flex justify-between w-full mb-3">
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="w-8 h-8 rounded-lg bg-white/10"></div>
                </div>
                <div className="h-8 bg-white/10 rounded w-1/3"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-white/10 relative overflow-hidden transition-all hover:bg-slate-800/80">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }}></div>
            
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
                </div>
                {Icon && (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color: color }}>
                        <Icon size={18} />
                    </div>
                )}
            </div>
            
            <div className="flex items-end gap-3">
                <h3 className="text-3xl font-bold text-white tracking-tight leading-none">{value}</h3>
                
                {trend && trendValue && (
                    <div className={`flex items-center text-sm font-bold pb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend === 'up' ? '▲' : '▼'} {trendValue}
                    </div>
                )}
            </div>
            
            {subtitle && (
                <p className="text-slate-500 text-xs font-medium mt-3 border-t border-white/5 pt-3">{subtitle}</p>
            )}
        </div>
    );
};

export default KPICard;
