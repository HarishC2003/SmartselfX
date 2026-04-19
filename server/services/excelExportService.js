const ExcelJS = require('exceljs');

const generateFullReport = async (analyticsData, dateRange) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SmartShelfX';
    workbook.created = new Date();

    const darkColor = 'FF1E293B';
    const indigoColor = 'FF4F46E5';
    const redFill = 'FFFFE4E6'; // light red
    const amberFill = 'FFFFF3CD'; // light amber
    const greenTint = 'FFE6FFFA'; // light green
    const redTint = 'FFFFE4E6';   // light red

    // Format helpers
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : '';

    // Extract data
    const { executiveSummary = {}, inventoryHealth = {}, transactionReport = {}, poReport = {}, categoryReport = {} } = analyticsData;

    // --- SHEET 1: Executive Summary ---
    const sheet1 = workbook.addWorksheet('Executive Summary', {
        views: [{ showGridLines: false }],
        properties: { tabColor: { argb: 'FF4F46E5' } }
    });

    sheet1.mergeCells('A1:B1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = 'SmartShelfX Executive Summary';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkColor } };
    titleCell.alignment = { horizontal: 'center' };

    sheet1.getColumn(1).width = 30;
    sheet1.getColumn(2).width = 30;

    const esData = [
        ['Date Range', `${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`],
        ['Total Products', executiveSummary.inventory?.totalProducts || 0],
        ['Total Stock Value', executiveSummary.inventory?.totalStockValue || 0],
        ['Total Retail Value', executiveSummary.inventory?.totalRetailValue || 0],
        ['Potential Profit', executiveSummary.inventory?.potentialProfit || 0],
        ['Low Stock Count', executiveSummary.inventory?.lowStockCount || 0],
        ['Out of Stock Count', executiveSummary.inventory?.outOfStockCount || 0],
        ['Overstocked Count', executiveSummary.inventory?.overstockedCount || 0],
        ['Healthy Stock Count', executiveSummary.inventory?.healthyStockCount || 0],
    ];

    let rowNum = 3;
    esData.forEach(([label, value]) => {
        const row = sheet1.getRow(rowNum);
        row.getCell(1).value = label;
        row.getCell(2).value = value;
        row.font = { color: { argb: 'FFFFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkColor } };
        rowNum++;
    });

    // --- SHEET 2: Inventory Health ---
    const sheet2 = workbook.addWorksheet('Inventory Health', {
        views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
        properties: { tabColor: { argb: 'FF4F46E5' } },
        autoFilter: { from: 'A1', to: 'K1' }
    });

    sheet2.columns = [
        { header: 'Product Name', key: 'name', width: 30 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Vendor', key: 'vendor', width: 20 },
        { header: 'Current Stock', key: 'currentStock', width: 15 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Cost Price', key: 'costPrice', width: 15 },
        { header: 'Selling Price', key: 'sellingPrice', width: 15 },
        { header: 'Stock Value', key: 'stockValue', width: 15 },
        { header: 'Reorder Level', key: 'reorderLevel', width: 15 },
        { header: 'Status', key: 'status', width: 20 }
    ];

    sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indigoColor } };

    const products = analyticsData.products || inventoryHealth.topValueProducts || [];
    products.forEach(p => {
        const row = sheet2.addRow({
            name: p.name,
            sku: p.sku,
            category: p.category?.name || p.category || 'N/A',
            vendor: p.vendor?.vendorName || p.vendor?.name || p.vendor || 'N/A',
            currentStock: p.currentStock,
            unit: p.unit,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
            stockValue: p.currentStock * p.costPrice,
            reorderLevel: p.reorderLevel,
            status: p.stockStatus || (p.currentStock === 0 ? 'OUT_OF_STOCK' : p.currentStock <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK')
        });

        if (p.currentStock === 0) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: redFill } };
        } else if (p.currentStock <= p.reorderLevel) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: amberFill } };
        }
    });

    // --- SHEET 3: Stock Transactions ---
    const sheet3 = workbook.addWorksheet('Stock Transactions', {
        views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
        properties: { tabColor: { argb: 'FF4F46E5' } },
        autoFilter: { from: 'A1', to: 'I1' }
    });

    sheet3.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Product', key: 'product', width: 30 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Before', key: 'before', width: 10 },
        { header: 'After', key: 'after', width: 10 },
        { header: 'Handler', key: 'handler', width: 20 },
        { header: 'Reference', key: 'reference', width: 20 }
    ];

    sheet3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indigoColor } };

    const transactions = transactionReport.recentTransactions || analyticsData.transactions || [];
    transactions.forEach(t => {
        const row = sheet3.addRow({
            date: formatDate(t.createdAt),
            product: t.product?.name || 'N/A',
            sku: t.product?.sku || 'N/A',
            type: t.type,
            quantity: t.quantity,
            before: t.balanceBefore,
            after: t.balanceAfter,
            handler: t.handledBy?.name || 'System',
            reference: t.referenceType + (t.referenceId ? ` (${t.referenceId})` : '')
        });

        if (t.type === 'IN') {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: greenTint } };
            row.font = { color: { argb: 'FF15803D' } };
        } else if (t.type === 'OUT') {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: redTint } };
            row.font = { color: { argb: 'FFB91C1C' } };
        }
    });

    // --- SHEET 4: Purchase Orders ---
    const sheet4 = workbook.addWorksheet('Purchase Orders', {
        views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
        properties: { tabColor: { argb: 'FF4F46E5' } },
        autoFilter: { from: 'A1', to: 'J1' }
    });

    sheet4.columns = [
        { header: 'PO Number', key: 'poNumber', width: 20 },
        { header: 'Product', key: 'product', width: 30 },
        { header: 'Vendor', key: 'vendor', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'AI Suggested', key: 'aiSuggested', width: 15 },
        { header: 'Created Date', key: 'createdAt', width: 20 },
        { header: 'Approved Date', key: 'approvedAt', width: 20 },
        { header: 'Delivered Date', key: 'deliveredAt', width: 20 }
    ];

    sheet4.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indigoColor } };

    const pos = poReport.recentOrders || analyticsData.purchaseOrders || poReport.timeline || [];
    pos.forEach(po => {
        const row = sheet4.addRow({
            poNumber: po.poNumber || po._id?.toString().slice(-6),
            product: po.product?.name || 'Varies',
            vendor: po.vendor?.vendorName || po.vendor?.name || 'N/A',
            quantity: po.orderedQuantity || po.quantity || 0,
            amount: po.totalAmount || po.totalValue || 0,
            status: po.status || 'PENDING',
            aiSuggested: po.isAISuggested ? 'Yes' : 'No',
            createdAt: formatDate(po.createdAt),
            approvedAt: formatDate(po.approvedAt),
            deliveredAt: formatDate(po.deliveredAt)
        });

        let stColor = 'FFFFFFFF';
        let ftColor = 'FF000000';
        if(po.status === 'PENDING') {stColor = 'FFFFF3CD'; ftColor='FFB45309'}
        else if(po.status === 'APPROVED') {stColor = 'FFDBEAFE'; ftColor='FF1D4ED8'}
        else if(po.status === 'RECEIVED') {stColor = 'FFE6FFFA'; ftColor='FF047857'}
        else if(po.status === 'REJECTED' || po.status === 'CANCELLED') {stColor = 'FFFFE4E6'; ftColor='FFB91C1C'}

        row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stColor } };
        row.getCell('status').font = { color: { argb: ftColor }, bold: true };
    });

    // --- SHEET 5: Vendor Performance ---
    const sheet5 = workbook.addWorksheet('Vendor Performance', {
        views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
        properties: { tabColor: { argb: 'FF4F46E5' } },
        autoFilter: { from: 'A1', to: 'G1' }
    });

    sheet5.columns = [
        { header: 'Vendor', key: 'vendorName', width: 30 },
        { header: 'Total POs', key: 'totalPOs', width: 15 },
        { header: 'Total Value', key: 'totalValue', width: 15 },
        { header: 'Approval Rate', key: 'approvalRate', width: 15 },
        { header: 'Avg Delivery Days', key: 'avgDelivery', width: 20 },
        { header: 'On-Time Rate', key: 'onTimeRate', width: 15 },
        { header: 'Rating', key: 'rating', width: 10 }
    ];

    sheet5.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet5.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indigoColor } };

    const vendors = poReport.vendorPerformance || [];
    vendors.forEach(v => {
        sheet5.addRow({
            vendorName: v.vendorName,
            totalPOs: v.totalPOs,
            totalValue: v.totalValue,
            approvalRate: `${(v.approvalRate || 0).toFixed(1)}%`,
            avgDelivery: (v.avgDeliveryDays || 0).toFixed(1),
            onTimeRate: `${(v.onTimeRate || 0).toFixed(1)}%`,
            rating: `${Math.round(((v.approvalRate||0) + (v.onTimeRate||0)) / 40)} Stars`
        });
    });

    // --- SHEET 6: Category Summary ---
    const sheet6 = workbook.addWorksheet('Category Summary', {
        views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
        properties: { tabColor: { argb: 'FF4F46E5' } },
        autoFilter: { from: 'A1', to: 'F1' }
    });

    sheet6.columns = [
        { header: 'Category', key: 'categoryObj', width: 25 },
        { header: 'Products', key: 'products', width: 15 },
        { header: 'Stock Value', key: 'stockValue', width: 15 },
        { header: 'Out Qty', key: 'outQty', width: 15 },
        { header: 'PO Count', key: 'poCount', width: 15 },
        { header: 'Low Stock Count', key: 'lowStockCount', width: 20 }
    ];

    sheet6.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet6.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indigoColor } };

    const cats = categoryReport.categoryBreakdown || inventoryHealth.categoryBreakdown || [];
    cats.forEach(c => {
        sheet6.addRow({
            categoryObj: c.categoryName || c.name,
            products: c.productCount,
            stockValue: c.totalStockValue,
            outQty: c.totalOutQty || 0,
            poCount: c.poCount || 0,
            lowStockCount: c.lowStockCount || 0
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

module.exports = {
    generateFullReport
};
