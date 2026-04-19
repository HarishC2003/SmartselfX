import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Upload, FileText, Download, CheckCircle, AlertCircle, RefreshCw, ChevronRight, XCircle, ArrowRight } from 'lucide-react';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';
import { useProducts } from '../../context/ProductContext';

const REQUIRED_HEADERS = ['name', 'sku', 'category', 'vendor', 'costPrice', 'sellingPrice', 'reorderLevel', 'reorderQuantity', 'maxStockLevel'];

const CSVImportModal = ({ isOpen, onClose }) => {
    const { fetchProducts, filters } = useProducts();

    // Steps: 1 (Upload), 2 (Preview), 3 (Uploading), 4 (Result)
    const [step, setStep] = useState(1);

    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [validationStats, setValidationStats] = useState({ valid: 0, invalid: 0 });
    const [headers, setHeaders] = useState([]);

    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const [showErrors, setShowErrors] = useState(false);
    const fileInputRef = useRef(null);

    const resetState = () => {
        setStep(1);
        setFile(null);
        setPreviewData([]);
        setValidationStats({ valid: 0, invalid: 0 });
        setHeaders([]);
        setIsUploading(false);
        setImportResult(null);
        setShowErrors(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const downloadTemplate = () => {
        const csvContent =
            "name,sku,category,vendor,costPrice,sellingPrice,currentStock,reorderLevel,reorderQuantity,maxStockLevel,description,unit,isPerishable,location,barcode,tags\n" +
            "Wireless Mouse,ELEC-ADM-1001,Electronics,vendor@example.com,15.50,29.99,50,10,50,200,Ergonomic wireless mouse,PCS,false,A-12-3,,electronics;accessories\n" +
            "Organic Apples,FOOD-VEN-2204,Groceries,vendor@example.com,1.20,2.50,100,20,100,500,Fresh organic apples,KG,true,ColdStore-1,,fruit;fresh\n";

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'smartshelfx_product_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const processFile = (selectedFile) => {
        if (!selectedFile) return;

        // Validation limits: 5MB
        if (selectedFile.size > 5 * 1024 * 1024) {
            toast.error("File exceeds 5MB limit");
            return;
        }

        setFile(selectedFile);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            preview: 5, // Just get first 5 rows for UI
            complete: (results) => {
                const parsedHeaders = results.meta.fields || [];
                setHeaders(parsedHeaders);

                const data = results.data;
                setPreviewData(data);

                // Do a full pass just to get counts (lightweight parsing without saving to state to save memory)
                Papa.parse(selectedFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (fullResults) => {
                        let validCtr = 0;
                        let invalidCtr = 0;

                        fullResults.data.forEach(row => {
                            const isRowValid = REQUIRED_HEADERS.every(h => {
                                const val = row[h] || row[h.trim()]; // check exact or trimmed match
                                return val !== undefined && val !== null && val.toString().trim() !== '';
                            });
                            if (isRowValid) validCtr++;
                            else invalidCtr++;
                        });

                        setValidationStats({ valid: validCtr, invalid: invalidCtr });
                        setStep(2);
                    }
                });
            },
            error: (error) => {
                toast.error("Error parsing CSV file");
            }
        });
    };

    const handleFileChange = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const startImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setStep(3);

        try {
            const formData = new FormData();
            formData.append('csvFile', file);

            const result = await productService.importProductsCSV(formData);
            setImportResult(result);
            setStep(4);

            // Revalidate table behind the modal
            fetchProducts(filters);
        } catch (error) {
            setStep(1); // Revert to let them try again
            setIsUploading(false);
            toast.error(error.response?.data?.message || 'Server error during import');
        }
    };

    const isMissingRequired = (row, header) => {
        if (!REQUIRED_HEADERS.includes(header)) return false;
        const val = row[header];
        return val === undefined || val === null || val.toString().trim() === '';
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Product Import" maxWidth="max-w-4xl" closeOnOutsideClick={false}>

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <div className="space-y-6">
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-600 hover:border-primary bg-surface/30 hover:bg-primary/5 rounded-2xl p-12 text-center cursor-pointer transition-all group"
                    >
                        <div className="w-16 h-16 bg-slate-800 group-hover:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <Upload size={28} className="text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Drag & drop your CSV file here</h3>
                        <p className="text-sm text-slate-400 mb-6">or click to browse from your computer (Max 5MB)</p>

                        <input
                            type="file"
                            accept=".csv, application/vnd.ms-excel, text/csv"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <Button type="button" variant="primary" className="mx-auto" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            Browse Files
                        </Button>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
                        <FileText size={24} className="text-primary shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-primary mb-1">Need a template?</h4>
                            <p className="text-xs text-primary/80 mb-3">Download our sample CSV to make sure your columns match perfectly.</p>
                            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="border-primary/30 text-primary hover:bg-primary/20">
                                <Download size={14} className="mr-2" /> Download Template
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: PREVIEW */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-surface border border-white/5 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-primary">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-white">{file?.name}</h4>
                                <p className="text-xs text-slate-400">{(file?.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-400">
                            Change File
                        </Button>
                    </div>

                    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white">Data Preview <span className="text-slate-500 font-normal">(First 5 rows)</span></h4>
                        </div>
                        <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
                            <table className="w-full text-xs text-left whitespace-nowrap">
                                <thead className="text-slate-400 uppercase bg-black/20">
                                    <tr>
                                        {headers.map((h, i) => (
                                            <th key={i} className="px-4 py-3 font-medium border-b border-white/5">
                                                {h} {REQUIRED_HEADERS.includes(h) && <span className="text-danger">*</span>}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {previewData.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            {headers.map((h, j) => {
                                                const hasError = isMissingRequired(row, h);
                                                return (
                                                    <td key={j} className={`px-4 py-2 ${hasError ? 'bg-danger/10 text-danger border border-danger/20' : 'text-slate-300'}`}>
                                                        {row[h] || (hasError ? 'Missing' : '-')}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center text-success text-sm font-medium">
                                <CheckCircle size={16} className="mr-2" />
                                {validationStats.valid} rows ready
                            </div>
                            {validationStats.invalid > 0 && (
                                <div className="flex items-center text-danger text-sm font-medium animate-pulse">
                                    <AlertCircle size={16} className="mr-2" />
                                    {validationStats.invalid} rows have errors
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button type="button" variant="primary" onClick={startImport}>
                                Start Import <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: UPLOADING */}
            {step === 3 && (
                <div className="py-20 text-center space-y-4">
                    <RefreshCw size={48} className="mx-auto text-primary animate-spin" />
                    <h3 className="text-xl font-medium text-white">Importing Products...</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                        Please don't close this window. We are processing your file and mapping it into the database.
                    </p>
                    <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto mt-6 overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-full animate-pulse"></div>
                    </div>
                </div>
            )}

            {/* STEP 4: RESULT */}
            {step === 4 && importResult && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="text-center pb-6 border-b border-white/5">
                        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} className="text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Import Complete!</h2>
                        <p className="text-sm text-slate-400">Your specific requested processes have been fully managed by the server.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-surface border border-white/5 rounded-xl p-4 text-center pb-6">
                            <p className="text-sm text-slate-400 font-medium mb-1">New Products</p>
                            <p className="text-3xl font-bold text-success">{importResult.summary.imported}</p>
                            <p className="text-xs text-slate-500 mt-2">Successfully Created</p>
                        </div>
                        <div className="bg-surface border border-white/5 rounded-xl p-4 text-center pb-6">
                            <p className="text-sm text-slate-400 font-medium mb-1">Updated Products</p>
                            <p className="text-3xl font-bold text-primary">{importResult.summary.updated}</p>
                            <p className="text-xs text-slate-500 mt-2">SKUs Matched & Upserted</p>
                        </div>
                        <div className="bg-surface border border-white/5 rounded-xl p-4 text-center pb-6">
                            <p className="text-sm text-slate-400 font-medium mb-1">Failed Rows</p>
                            <p className={`text-3xl font-bold ${importResult.summary.failed > 0 ? 'text-danger' : 'text-slate-300'}`}>
                                {importResult.summary.failed}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">Parsing Errors</p>
                        </div>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                        <div className="bg-danger/5 border border-danger/20 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setShowErrors(!showErrors)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-danger/10 transition-colors"
                            >
                                <div className="flex items-center text-danger font-medium text-sm">
                                    <AlertCircle size={16} className="mr-2" />
                                    View detailed error log ({importResult.errors.length} items)
                                </div>
                                <ChevronRight size={16} className={`text-danger transition-transform ${showErrors ? 'rotate-90' : ''}`} />
                            </button>

                            {showErrors && (
                                <div className="p-4 border-t border-danger/20 max-h-60 overflow-y-auto custom-scrollbar bg-black/20">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-slate-400">
                                            <tr>
                                                <th className="pb-2 w-16">Row #</th>
                                                <th className="pb-2 w-32">SKU</th>
                                                <th className="pb-2">Reason for Failure</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300 divide-y divide-white/5">
                                            {importResult.errors.map((err, i) => (
                                                <tr key={i}>
                                                    <td className="py-2">{err.row}</td>
                                                    <td className="py-2 font-mono text-slate-400">{err.sku || 'N/A'}</td>
                                                    <td className="py-2 text-danger">{err.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button type="button" variant="outline" onClick={resetState}>
                            Import Another File
                        </Button>
                        <Button type="button" variant="primary" onClick={handleClose}>
                            View Products
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CSVImportModal;
