import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

const DateRangePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (value?.startDate) {
            setStart(new Date(value.startDate).toISOString().split('T')[0]);
        }
        if (value?.endDate) {
            setEnd(new Date(value.endDate).toISOString().split('T')[0]);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const setPreset = (days) => {
        const endD = new Date();
        const startD = new Date();
        if (days > 0) {
            startD.setDate(endD.getDate() - days);
        } else if (days === 'year') {
            startD.setMonth(0, 1);
        }
        
        onChange({ startDate: startD.toISOString(), endDate: endD.toISOString() });
        setIsOpen(false);
    };

    const handleCustomApply = () => {
        if (start && end) {
            const startD = new Date(start);
            const endD = new Date(end);
            endD.setHours(23, 59, 59, 999);
            onChange({ startDate: startD.toISOString(), endDate: endD.toISOString() });
            setIsOpen(false);
        }
    };

    const formatDateRangeLabel = () => {
        if (!value?.startDate || !value?.endDate) return 'Select Date Range';
        const s = new Date(value.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const e = new Date(value.endDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        return `${s} – ${e}`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-200 text-sm rounded-lg px-4 py-2 transition-colors focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
                <Calendar size={16} className="text-indigo-400" />
                <span className="font-medium whitespace-nowrap">{formatDateRangeLabel()}</span>
            </button>
            
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl z-50 overflow-hidden slide-in-from-top-2 p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={() => setPreset(0)} className="px-3 py-1 bg-[#334155] hover:bg-indigo-500/20 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 text-slate-300 text-xs rounded-full transition-colors">Today</button>
                        <button onClick={() => setPreset(7)} className="px-3 py-1 bg-[#334155] hover:bg-indigo-500/20 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 text-slate-300 text-xs rounded-full transition-colors">7D</button>
                        <button onClick={() => setPreset(30)} className="px-3 py-1 bg-[#334155] hover:bg-indigo-500/20 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 text-slate-300 text-xs rounded-full transition-colors">30D</button>
                        <button onClick={() => setPreset(90)} className="px-3 py-1 bg-[#334155] hover:bg-indigo-500/20 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 text-slate-300 text-xs rounded-full transition-colors">90D</button>
                        <button onClick={() => setPreset('year')} className="px-3 py-1 bg-[#334155] hover:bg-indigo-500/20 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 text-slate-300 text-xs rounded-full transition-colors">1Y</button>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-[#334155]">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Custom Range</p>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                value={start} 
                                onChange={(e) => setStart(e.target.value)}
                                className="w-full bg-[#0F172A] border border-[#334155] text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-color-scheme-dark"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">End Date</label>
                            <input 
                                type="date" 
                                value={end} 
                                onChange={(e) => setEnd(e.target.value)}
                                className="w-full bg-[#0F172A] border border-[#334155] text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-color-scheme-dark"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <button 
                            onClick={handleCustomApply}
                            disabled={!start || !end}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium rounded-lg text-sm mt-2 transition-colors"
                        >
                            Apply Custom Range
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
