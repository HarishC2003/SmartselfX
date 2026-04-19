import cron from 'node-cron';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import User from '../models/User.js';
import { sendMail } from '../utils/sendMail.js';

export const scheduleReportJobs = () => {
    // Run every Monday at 8:00 AM
    cron.schedule('0 8 * * 1', async () => {
        console.log('[CRON] Generating weekly inventory summary report...');
        try {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            const end = new Date();

            const inventoryAgg = await Product.aggregate([
                { $match: { isActive: true } },
                { 
                    $group: {
                        _id: null,
                        totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
                        lowStockCount: { $sum: { $cond: [{ $lte: ['$currentStock', '$reorderLevel'] }, 1, 0] } },
                        outOfStockCount: { $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] } }
                    }
                }
            ]);

            const salesAgg = await StockTransaction.aggregate([
                { $match: { type: 'OUT', timestamp: { $gte: start, $lte: end } } },
                { $group: { _id: null, totalItemsSold: { $sum: '$quantity' } } }
            ]);

            const admins = await User.find({ role: 'ADMIN' });

            if (admins.length > 0) {
                const totalValue = inventoryAgg[0]?.totalValue?.toFixed(2) || 0;
                const lowStockCount = inventoryAgg[0]?.lowStockCount || 0;
                const outOfStockCount = inventoryAgg[0]?.outOfStockCount || 0;
                const totalItemsSold = salesAgg[0]?.totalItemsSold || 0;

                const content = `
                    <h3>Weekly Inventory Summary</h3>
                    <p>Here is your inventory performance for the last 7 days:</p>
                    <ul>
                        <li><strong>Total Inventory Value:</strong> $${totalValue}</li>
                        <li><strong>Low Stock Items:</strong> ${lowStockCount}</li>
                        <li><strong>Out of Stock Items:</strong> ${outOfStockCount}</li>
                        <li><strong>Total Items Sold (7 days):</strong> ${totalItemsSold}</li>
                    </ul>
                    <p>Log in to your dashboard to view the full report.</p>
                `;

                for (const admin of admins) {
                    await sendMail(admin.email, 'Weekly Inventory Report', content);
                }
                console.log('[CRON] Weekly reports sent successfully.');
            }
        } catch (error) {
            console.error('[CRON Error] Failed to generate weekly report:', error);
        }
    });
};
