import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Mail, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExportButton = ({ onExcelExport, onPDFExport, onSendReport, isLoading, showSendReport = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = async (actionFn, name) => {
        setIsOpen(false);
        const toastId = toast.loading(`Preparing ${name}...`);
        try {
            await actionFn();
            toast.success(`${name} complete!`, { id: toastId });
        } catch (error) {
            toast.error(`Failed to process ${name}`, { id: toastId });
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:hover:bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 font-medium transition-colors shadow-lg shadow-indigo-500/20 outline-none focus:ring-2 focus:ring-indigo-400"
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export
                <ChevronDown size={14} className={`ml-1 opacity-70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1E293B] border border-[#334155] rounded-xl shadow-xl z-50 overflow-hidden text-sm slide-in-from-top-2">
                    <button 
                        onClick={() => handleAction(onExcelExport, 'Excel export')}
                        className="w-full flex items-center gap-3 text-left px-4 py-3 text-slate-300 hover:bg-[#334155] hover:text-emerald-400 border-b border-[#334155] transition-colors"
                    >
                        <FileSpreadsheet size={16} /> Export as Excel (.xlsx)
                    </button>
                    
                    <button 
                        onClick={() => handleAction(onPDFExport, 'PDF export')}
                        className="w-full flex items-center gap-3 text-left px-4 py-3 text-slate-300 hover:bg-[#334155] hover:text-red-400 border-b border-[#334155] transition-colors"
                    >
                        <FileText size={16} /> Export as PDF
                    </button>
                    
                    {showSendReport && onSendReport && (
                        <button 
                            onClick={() => handleAction(onSendReport, 'Weekly email report')}
                            className="w-full flex items-center gap-3 text-left px-4 py-3 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                        >
                            <Mail size={16} /> Send Weekly Report
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExportButton;
