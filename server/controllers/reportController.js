import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import User from '../models/User.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Helper to get start and end of current month
const getMonthRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export const getExecutiveSummary = async (req, res, next) => {
    try {
        const { start, end } = getMonthRange();

        // Total Inventory Value
        const inventoryAgg = await Product.aggregate([
            { $match: { isActive: true } },
            { 
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
                    totalItems: { $sum: '$currentStock' },
                    lowStockCount: { 
                        $sum: { 
                            $cond: [{ $lte: ['$currentStock', '$reorderLevel'] }, 1, 0] 
                        } 
                    },
                    outOfStockCount: {
                        $sum: {
                            $cond: [{ $eq: ['$currentStock', 0] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Purchase Orders Value (Approved/Received this month)
        const poAgg = await PurchaseOrder.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: start, $lte: end },
                    status: { $in: ['APPROVED', 'DISPATCHED', 'RECEIVED'] }
                } 
            },
            {
                $group: {
                    _id: null,
                    totalPOValue: { $sum: '$totalAmount' },
                    poCount: { $sum: 1 }
                }
            }
        ]);

        // Sales (OUT transactions) Value this month
        const salesAgg = await StockTransaction.aggregate([
            {
                $match: {
                    type: 'OUT',
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: null,
                    totalSalesValue: { $sum: { $multiply: ['$quantity', '$product.sellingPrice'] } },
                    totalSalesItems: { $sum: '$quantity' }
                }
            }
        ]);

        res.json({
            inventoryValue: inventoryAgg[0]?.totalValue || 0,
            totalItems: inventoryAgg[0]?.totalItems || 0,
            lowStockCount: inventoryAgg[0]?.lowStockCount || 0,
            outOfStockCount: inventoryAgg[0]?.outOfStockCount || 0,
            monthlyPOValue: poAgg[0]?.totalPOValue || 0,
            monthlyPOCount: poAgg[0]?.poCount || 0,
            monthlySalesValue: salesAgg[0]?.totalSalesValue || 0,
            monthlySalesItems: salesAgg[0]?.totalSalesItems || 0,
            period: { start, end }
        });
    } catch (error) {
        next(error);
    }
};

export const getInventoryHealth = async (req, res, next) => {
    try {
        const healthData = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: 1,
                    sku: 1,
                    categoryName: '$category.name',
                    currentStock: 1,
                    reorderLevel: 1,
                    maxStockLevel: 1,
                    costPrice: 1,
                    stockValue: { $multiply: ['$currentStock', '$costPrice'] },
                    status: '$stockStatus',
                    utilization: {
                        $cond: [
                            { $gt: ['$maxStockLevel', 0] },
                            { $multiply: [{ $divide: ['$currentStock', '$maxStockLevel'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { stockValue: -1 } }
        ]);

        res.json(healthData);
    } catch (error) {
        next(error);
    }
};

export const getPurchaseVsSales = async (req, res, next) => {
    try {
        // Last 6 months trend
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const trendData = await StockTransaction.aggregate([
            {
                $match: { timestamp: { $gte: sixMonthsAgo } }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: {
                        year: { $year: '$timestamp' },
                        month: { $month: '$timestamp' },
                        type: '$type'
                    },
                    totalQuantity: { $sum: '$quantity' },
                    totalValue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$type', 'IN'] },
                                { $multiply: ['$quantity', '$product.costPrice'] },
                                { $multiply: ['$quantity', '$product.sellingPrice'] }
                            ]
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format data into an array of { month, inQuantity, outQuantity, inValue, outValue }
        const formattedData = {};
        trendData.forEach(item => {
            const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            if (!formattedData[key]) {
                formattedData[key] = {
                    month: key,
                    inQuantity: 0,
                    outQuantity: 0,
                    inValue: 0,
                    outValue: 0
                };
            }
            if (item._id.type === 'IN') {
                formattedData[key].inQuantity = item.totalQuantity;
                formattedData[key].inValue = item.totalValue;
            } else {
                formattedData[key].outQuantity = item.totalQuantity;
                formattedData[key].outValue = item.totalValue;
            }
        });

        res.json(Object.values(formattedData));
    } catch (error) {
        next(error);
    }
};

export const getTopPerformers = async (req, res, next) => {
    try {
        const { start, end } = getMonthRange();

        // Top 5 Products by Sales Value (OUT)
        const topProducts = await StockTransaction.aggregate([
            {
                $match: {
                    type: 'OUT',
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$productId',
                    name: { $first: '$product.name' },
                    sku: { $first: '$product.sku' },
                    totalQuantitySold: { $sum: '$quantity' },
                    totalSalesValue: { $sum: { $multiply: ['$quantity', '$product.sellingPrice'] } }
                }
            },
            { $sort: { totalSalesValue: -1 } },
            { $limit: 5 }
        ]);

        // Top 5 Vendors by PO Value
        const topVendors = await PurchaseOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $in: ['APPROVED', 'DISPATCHED', 'RECEIVED'] }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'vendorId',
                    foreignField: '_id',
                    as: 'vendor'
                }
            },
            { $unwind: '$vendor' },
            {
                $group: {
                    _id: '$vendorId',
                    name: { $first: '$vendor.name' },
                    poCount: { $sum: 1 },
                    totalPOValue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { totalPOValue: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            topProducts,
            topVendors
        });
    } catch (error) {
        next(error);
    }
};

export const exportReport = async (req, res, next) => {
    try {
        const { type, format } = req.query; // type: inventory_health, format: xlsx or pdf

        if (!type || !format) {
            return res.status(400).json({ message: 'Missing type or format query parameter.' });
        }

        let data = [];
        let headers = [];
        let title = '';

        if (type === 'inventory_health') {
            title = 'Inventory Health Report';
            headers = ['SKU', 'Product Name', 'Category', 'Current Stock', 'Status', 'Stock Value', 'Utilization (%)'];
            
            const healthData = await Product.aggregate([
                { $match: { isActive: true } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        name: 1,
                        sku: 1,
                        categoryName: '$category.name',
                        currentStock: 1,
                        maxStockLevel: 1,
                        costPrice: 1,
                        stockValue: { $multiply: ['$currentStock', '$costPrice'] },
                        status: '$stockStatus',
                        utilization: {
                            $cond: [
                                { $gt: ['$maxStockLevel', 0] },
                                { $multiply: [{ $divide: ['$currentStock', '$maxStockLevel'] }, 100] },
                                0
                            ]
                        }
                    }
                },
                { $sort: { stockValue: -1 } }
            ]);

            data = healthData.map(item => [
                item.sku,
                item.name,
                item.categoryName || 'N/A',
                item.currentStock,
                item.status,
                Number(item.stockValue || 0).toFixed(2),
                Number(item.utilization || 0).toFixed(2)
            ]);
        } else if (type === 'purchase_sales') {
            title = 'Purchase & Sales Comparison';
            headers = ['Month', 'PO Quantity (IN)', 'PO Value ($)', 'Sales Quantity (OUT)', 'Sales Value ($)'];
            
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const trendData = await StockTransaction.aggregate([
                { $match: { timestamp: { $gte: sixMonthsAgo } } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: { year: { $year: '$timestamp' }, month: { $month: '$timestamp' }, type: '$type' },
                        totalQuantity: { $sum: '$quantity' },
                        totalValue: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$type', 'IN'] },
                                    { $multiply: ['$quantity', '$product.costPrice'] },
                                    { $multiply: ['$quantity', '$product.sellingPrice'] }
                                ]
                            }
                        }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            const formattedData = {};
            trendData.forEach(item => {
                const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
                if (!formattedData[key]) formattedData[key] = { month: key, inQty: 0, outQty: 0, inVal: 0, outVal: 0 };
                if (item._id.type === 'IN') {
                    formattedData[key].inQty = item.totalQuantity;
                    formattedData[key].inVal = item.totalValue;
                } else {
                    formattedData[key].outQty = item.totalQuantity;
                    formattedData[key].outVal = item.totalValue;
                }
            });

            data = Object.values(formattedData).map(item => [
                item.month, item.inQty, Number(item.inVal || 0).toFixed(2), item.outQty, Number(item.outVal || 0).toFixed(2)
            ]);
        } else if (type === 'top_performers') {
            title = 'Top Products Report';
            headers = ['SKU', 'Product Name', 'Total Qty Sold', 'Total Sales Revenue ($)'];
            
            const { start, end } = getMonthRange();
            const topProducts = await StockTransaction.aggregate([
                { $match: { type: 'OUT', timestamp: { $gte: start, $lte: end } } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: '$productId',
                        name: { $first: '$product.name' },
                        sku: { $first: '$product.sku' },
                        totalQuantitySold: { $sum: '$quantity' },
                        totalSalesValue: { $sum: { $multiply: ['$quantity', '$product.sellingPrice'] } }
                    }
                },
                { $sort: { totalSalesValue: -1 } }
            ]);

            data = topProducts.map(item => [
                item.sku, item.name, item.totalQuantitySold, Number(item.totalSalesValue || 0).toFixed(2)
            ]);
        } else {
            return res.status(400).json({ message: 'Invalid report type.' });
        }

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(title);

            sheet.addRow(headers);
            sheet.getRow(1).font = { bold: true };

            data.forEach(row => {
                sheet.addRow(row);
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`);

            await workbook.xlsx.write(res);
            return res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);

            doc.pipe(res);

            doc.fontSize(20).text(title, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.moveDown();

            // Simple table drawing for PDF
            const startX = 30;
            let startY = doc.y;

            // Draw headers
            doc.font('Helvetica-Bold');
            const colWidths = [60, 150, 80, 60, 70, 60, 60];
            let currentX = startX;
            headers.forEach((header, i) => {
                doc.text(header, currentX, startY, { width: colWidths[i], align: 'left' });
                currentX += colWidths[i];
            });

            startY += 20;
            doc.font('Helvetica');

            // Draw data
            data.forEach(row => {
                if (startY > doc.page.height - 50) {
                    doc.addPage();
                    startY = 30;
                }
                currentX = startX;
                row.forEach((cell, i) => {
                    doc.text(String(cell), currentX, startY, { width: colWidths[i], align: 'left' });
                    currentX += colWidths[i];
                });
                startY += 20;
            });

            doc.end();
        } else {
            return res.status(400).json({ message: 'Invalid format. Use xlsx or pdf.' });
        }
    } catch (error) {
        next(error);
    }
};
