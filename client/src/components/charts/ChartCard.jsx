import React from 'react';
import { Download, AlertCircle } from 'lucide-react';

const ChartCard = ({ title, subtitle, height = 'h-[400px]', isLoading, error, onRetry, exportable, onExport, children }) => {
    return (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-white/10 flex flex-col w-full h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
                </div>
                {exportable && (
                    <button 
                        onClick={onExport} 
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                        title="Export Chart Data"
                    >
                        <Download size={16} />
                    </button>
                )}
            </div>
            
            <div className={`relative flex-1 w-full ${height}`}>
                {isLoading ? (
                    <div className="absolute inset-0 bg-white/5 animate-pulse rounded-lg"></div>
                ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/5 rounded-lg border border-red-500/20">
                        <AlertCircle size={32} className="text-red-500 mb-3" />
                        <p className="text-slate-300 text-sm mb-4">Failed to load chart data</p>
                        {onRetry && (
                            <button onClick={onRetry} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
                                Retry
                            </button>
                        )}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default ChartCard;
