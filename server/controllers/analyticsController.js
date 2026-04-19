import { analyticsService } from '../services/analyticsService.js';
import User from '../models/User.js';
import { sendMail } from '../utils/sendMail.js';
import { runWeeklyReport } from '../jobs/weeklyReportJob.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Date Helper
const getDateRange = (query) => {
    let { startDate, endDate } = query;
    if (!startDate || !endDate) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        startDate = start.toISOString();
        endDate = end.toISOString();
    }
    return { startDate, endDate };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getExecutiveSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = getDateRange(req.query);
        const data = await analyticsService.getExecutiveSummary({ startDate, endDate });
        
        res.setHeader('Cache-Control', 'max-age=300'); // 5 min cache
        res.status(200).json({
            data,
            generatedAt: new Date().toISOString(),
            dateRange: { startDate, endDate }
        });
    } catch (error) {
        next(error);
    }
};

export const getInventoryHealth = async (req, res, next) => {
    try {
        const { startDate, endDate } = getDateRange(req.query);
        const data = await analyticsService.getInventoryHealthReport({ startDate, endDate });
        
        res.status(200).json({
            data,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req, res, next) => {
    try {
        const { startDate, endDate } = getDateRange(req.query);
        const groupBy = req.query.groupBy || 'day';
        const data = await analyticsService.getTransactionReport({ startDate, endDate, groupBy });
        
        res.status(200).json({
            data,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

export const getPurchaseOrders = async (req, res, next) => {
    try {
        const { startDate, endDate } = getDateRange(req.query);
        const data = await analyticsService.getPurchaseOrderReport({ startDate, endDate });
        
        res.status(200).json({
            data,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

export const getCategories = async (req, res, next) => {
    try {
        const { startDate, endDate } = getDateRange(req.query);
        const data = await analyticsService.getCategoryReport({ startDate, endDate });
        
        res.status(200).json({
            data,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const exportExcel = async (req, res, next) => {
    try {
        const reportType = req.query.report || 'full';
        const { startDate, endDate } = getDateRange(req.query);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SmartShelfX';
        workbook.created = new Date();

        const formatSheetParams = (sheet, headers) => {
            // SmartShelfX branding header
            sheet.mergeCells('A1', String.fromCharCode(65 + headers.length - 1) + '1');
            const titleRow = sheet.getRow(1);
            titleRow.values = [`SmartShelfX ${sheet.name} Report`];
            titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4F46E5' } // Indigo-600
            };
            titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Subtitle Date Range
            sheet.mergeCells('A2', String.fromCharCode(65 + headers.length - 1) + '2');
            const subTitleRow = sheet.getRow(2);
            subTitleRow.values = [`Generated on: ${new Date().toLocaleString()} | Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`];
            subTitleRow.font = { name: 'Arial', size: 10, italic: true };
            subTitleRow.alignment = { horizontal: 'center' };

            sheet.addRow([]); // Blank row

            // actual headers
            const headerRow = sheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE2E8F0' } // Slate-200
            };
            // Add autofilter
            sheet.autoFilter = {
                from: { row: 4, column: 1 },
                to: { row: 4, column: headers.length }
            };

            // Fix columns width broadly based on headers length
            sheet.columns.forEach((column, i) => {
                column.width = headers[i].length < 15 ? 15 : headers[i].length + 5;
            });
            
            return sheet;
        };

        const styleDataRow = (row, isEven) => {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } // White / Slate-50
            };
        };

        // Fetch Data in parallel for 'full', or individually for specific types
        let healthData, txData, poData, catData;

        if (reportType === 'full') {
            // ✅ Promise.all for maximum parallel performance
            [healthData, txData, poData, catData] = await Promise.all([
                analyticsService.getInventoryHealthReport({ startDate, endDate }),
                analyticsService.getTransactionReport({ startDate, endDate, groupBy: 'day' }),
                analyticsService.getPurchaseOrderReport({ startDate, endDate }),
                analyticsService.getCategoryReport({ startDate, endDate })
            ]);
        } else {
            if (reportType === 'inventory') healthData = await analyticsService.getInventoryHealthReport({ startDate, endDate });
            if (reportType === 'transactions') txData = await analyticsService.getTransactionReport({ startDate, endDate, groupBy: 'day' });
            if (reportType === 'purchase-orders') poData = await analyticsService.getPurchaseOrderReport({ startDate, endDate });
            if (reportType === 'categories') catData = await analyticsService.getCategoryReport({ startDate, endDate });
        }

        if (healthData) {
            const sheet = workbook.addWorksheet('Inventory Health');
            formatSheetParams(sheet, ['Status', 'Count', 'Percentage (%)', 'Total Value ($)']);
            
            healthData.stockStatusBreakdown.forEach((item, idx) => {
                const row = sheet.addRow([item.status, item.count, item.percentage, item.totalValue]);
                styleDataRow(row, idx % 2 === 0);
                row.getCell(4).numFmt = '"$"#,##0.00';
                if (item.status === 'OUT_OF_STOCK') row.font = { color: { argb: 'FFEF4444' } };
                if (item.status === 'LOW_STOCK') row.font = { color: { argb: 'FFF59E0B' } };
            });
        }

        if (txData) {
            const sheet = workbook.addWorksheet('Transactions Report');
            formatSheetParams(sheet, ['Period', 'Total IN', 'Total OUT', 'Net Movement', 'Tx Count']);
            txData.timeline.forEach((item, idx) => {
                const row = sheet.addRow([item.period, item.totalIn, item.totalOut, item.netMovement, item.transactionCount]);
                styleDataRow(row, idx % 2 === 0);
                row.getCell(2).numFmt = '#,##0';
                row.getCell(3).numFmt = '#,##0';
            });
        }

        if (poData) {
            const sheet = workbook.addWorksheet('Purchase Orders');
            formatSheetParams(sheet, ['Period', 'PO Count', 'Total Value ($)', 'Approved Count', 'Rejected Count']);
            poData.timeline.forEach((item, idx) => {
                const row = sheet.addRow([item.period, item.poCount, item.totalValue, item.approvedCount, item.rejectedCount]);
                styleDataRow(row, idx % 2 === 0);
                row.getCell(3).numFmt = '"$"#,##0.00';
            });

            const vendorSheet = workbook.addWorksheet('Vendor Performance');
            formatSheetParams(vendorSheet, ['Vendor Name', 'Total POs', 'Total Value ($)', 'Approval Rate (%)', 'Avg Delivery Days', 'On-Time Rate (%)']);
            poData.vendorPerformance.forEach((v, idx) => {
                const row = vendorSheet.addRow([v.vendorName, v.totalPOs, v.totalValue, v.approvalRate, v.avgDeliveryDays, v.onTimeRate]);
                styleDataRow(row, idx % 2 === 0);
                row.getCell(3).numFmt = '"$"#,##0.00';
                row.getCell(4).numFmt = '0.00"%"';
                row.getCell(6).numFmt = '0.00"%"';
            });
        }

        if (catData) {
            const sheet = workbook.addWorksheet('Category Breakdown');
            formatSheetParams(sheet, ['Category Name', 'Products', 'Total Stock Value ($)', 'Total OUT Qty', 'Total IN Qty', 'PO Value ($)', 'Low/Out Stock Count']);
            catData.categories.forEach((cat, idx) => {
                const row = sheet.addRow([
                    cat.name, cat.productCount, cat.totalStockValue, 
                    cat.totalOutQty, cat.totalInQty, cat.poValue, 
                    cat.lowStockCount + cat.outOfStockCount
                ]);
                styleDataRow(row, idx % 2 === 0);
                row.getCell(3).numFmt = '"$"#,##0.00';
                row.getCell(6).numFmt = '"$"#,##0.00';
            });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="SmartShelfX-Report-${new Date().toISOString().split('T')[0]}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

export const exportPDF = async (req, res, next) => {
    try {
        const reportType = req.query.report || 'full';
        const { startDate, endDate } = getDateRange(req.query);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="SmartShelfX-Report-${new Date().toISOString().split('T')[0]}.pdf"`);

        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        doc.pipe(res);

        // --- Cover Page ---
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0F172A'); // Dark theme background for cover
        doc.fillColor('#6366F1').fontSize(40).font('Helvetica-Bold').text('SmartShelfX', 0, doc.page.height / 3, { align: 'center' });
        doc.fillColor('#22D3EE').fontSize(20).text('Analytics Data Report', { align: 'center' });
        doc.moveDown(2);
        doc.fillColor('#F1F5F9').fontSize(14).text(`Report Type: ${reportType.toUpperCase()}`, { align: 'center' });
        doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(4);
        doc.fillColor('#94A3B8').fontSize(10).text(`Generated by: ${req.user?.name || 'SmartShelfX System'} on ${new Date().toLocaleString()}`, { align: 'center', bottom: 50 });

        // Add a new page for content
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF'); // Reset background to white

        // Helper to draw section headers
        const drawSectionHeader = (title) => {
            doc.moveDown();
            doc.rect(doc.x, doc.y, doc.page.width - 80, 25).fill('#4F46E5'); // indigo-600
            doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text(title, doc.x + 10, doc.y + 6);
            doc.moveDown(1.5);
            doc.fillColor('#000000').fontSize(10).font('Helvetica');
        };

        // Table definition helper
        const drawTable = (headers, rows, colWidths) => {
            const startX = doc.x;
            let currentY = doc.y;

            // Draw Headers
            doc.font('Helvetica-Bold');
            doc.rect(startX, currentY, doc.page.width - 80, 20).fill('#E2E8F0');
            doc.fillColor('#000000');
            
            let currentX = startX + 5;
            headers.forEach((h, i) => {
                doc.text(h, currentX, currentY + 5, { width: colWidths[i], align: 'left' });
                currentX += colWidths[i];
            });

            currentY += 20;
            doc.font('Helvetica');

            // Draw Rows
            rows.forEach((row, rowIndex) => {
                // Check page break
                if (currentY + 20 > doc.page.height - 50) {
                    doc.addPage();
                    currentY = 40;
                }

                if (rowIndex % 2 === 0) {
                    doc.rect(startX, currentY, doc.page.width - 80, 20).fill('#F8FAFC');
                    doc.fillColor('#000000');
                }

                currentX = startX + 5;
                row.forEach((cell, i) => {
                    const text = (cell === null || cell === undefined) ? '' : String(cell);
                    doc.text(text, currentX, currentY + 5, { width: colWidths[i], align: 'left', lineBreak: false });
                    currentX += colWidths[i];
                });

                currentY += 20;
                doc.y = currentY;
            });
            doc.moveDown();
        };

        // Fetch & Draw Data conditionally
        if (['full', 'inventory'].includes(reportType)) {
            const data = await analyticsService.getInventoryHealthReport({ startDate, endDate });
            drawSectionHeader('Inventory Health - Status Breakdown');
            
            const rows = data.stockStatusBreakdown.map(s => [
                s.status, s.count, s.percentage.toFixed(2) + '%', '$' + s.totalValue.toFixed(2)
            ]);
            drawTable(['Status', 'Count', 'Share', 'Value'], rows, [150, 80, 80, 150]);
        }

        if (['full', 'purchase-orders'].includes(reportType)) {
            const data = await analyticsService.getPurchaseOrderReport({ startDate, endDate });
            drawSectionHeader('Purchase Orders - Top Vendors');

            const rows = data.vendorPerformance.slice(0, 15).map(v => [
                v.vendorName.substring(0, 20), v.totalPOs, '$' + v.totalValue.toFixed(2), v.approvalRate.toFixed(1) + '%'
            ]);
            drawTable(['Vendor Name', 'POs', 'Total Value', 'Approval Rate'], rows, [200, 50, 120, 100]);
        }

        // Add page numbers to all standard pages
        const pages = doc.bufferedPageRange();
        for (let i = 1; i < pages.count; i++) { // Skip cover page (0)
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#94A3B8').text(
                `Page ${i} of ${pages.count - 1}  •  Generated by SmartShelfX on ${new Date().toLocaleString()}`,
                40, doc.page.height - 30, { align: 'center' }
            );
        }

        doc.end();
    } catch (error) {
        next(error);
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCHEDULED REPORT EMAIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sendWeeklyReport = async (req, res, next) => {
    try {
        const { recipients } = req.body;
        const count = await runWeeklyReport(recipients);

        if (count === 0) {
            return res.status(400).json({ message: 'No recipients found.' });
        }

        res.status(200).json({
            message: `Weekly report sent successfully to ${count} recipients.`
        });
    } catch (error) {
        next(error);
    }
};
